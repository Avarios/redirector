export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (request.method === 'POST' && url.pathname === '/') {
      return handleCreateRedirect(request, env);
    }
    
    if (request.method === 'GET' && url.pathname !== '/') {
      return handleRedirect(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  },
};

async function handleRedirect(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const id = url.pathname.slice(1);

  if (!id) {
    return new Response('Bad Request', { status: 400 });
  }
  try {
    const result = await env.DB.prepare(`SELECT url FROM redirects WHERE subdomain = ?`)
      .bind(id)
      .first();
    
    if (result?.url) {
      const originalUrl = new URL(result.url as string);
      const incomingUrl = new URL(request.url);

      // Append all search params from the incoming request to the original url
      incomingUrl.searchParams.forEach((value, key) => {
        originalUrl.searchParams.append(key, value);
      });

      return Response.redirect(originalUrl.toString(), 302);
    }
    
    return new Response('Redirect not found', { status: 404 });
  } catch (error) {
    console.error('Database error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleCreateRedirect(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { url?: string };
    
    if (!body.url) {
      return new Response('URL is required', { status: 400 });
    }
    
    const subdomain = await createUniqueSubdomain(body.url, env);
    
    if (!subdomain) {
      return new Response('Could not create redirect', { status: 500 });
    }
    
    const requestUrl = new URL(request.url);
    const hostParts = requestUrl.hostname.split('.');
    const baseDomain = hostParts.length > 2 ? hostParts.slice(1).join('.') : requestUrl.hostname;
    const redirectUrl = `${requestUrl.protocol}//${subdomain}.${baseDomain}`;
    
    return Response.json({
      subdomain,
      url: redirectUrl,
      originalUrl: body.url
    });
  } catch (error) {
    return new Response('Invalid JSON', { status: 400 });
  }
}

async function createUniqueSubdomain(url: string, env: Env): Promise<string | null> {
  let subdomain = await generateSubdomain(url);
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const exists = await checkSubdomainExists(subdomain, env);
    
    if (!exists) {
      try {
        await env.DB.prepare('INSERT INTO redirects (subdomain, url) VALUES (?, ?')
          .bind(subdomain, url)
          .run();
        return subdomain;
      } catch (error) {
        console.error('Insert error:', error);
        return null;
      }
    }
    
    const salt = Math.random().toString(36).substring(2, 6);
    subdomain = await generateSubdomain(url, salt);
    attempts++;
  }
  
  return null;
}

async function generateSubdomain(url: string, salt: string = ''): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url + salt);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const hashHex = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return hashHex.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 12);
}

async function checkSubdomainExists(subdomain: string, env: Env): Promise<boolean> {
  try {
    const result = await env.DB.prepare(`SELECT 1 FROM redirects WHERE subdomain = ${subdomain}`)
      .bind(subdomain)
      .first();
    return !!result;
  } catch (error) {
    console.error('Check subdomain error:', error);
    return false;
  }
}