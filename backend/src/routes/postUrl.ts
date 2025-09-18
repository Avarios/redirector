import { Request, Response } from 'express';
import crypto from 'crypto';
import { Database } from 'sqlite';
/**
 * Handles POST requests to create a new redirect subdomain for a given URL.
 *
 * Expects a JSON body with a `url` property. If the `url` is missing, responds with HTTP 400.
 * Attempts to insert a new subdomain for the provided URL using `tryInsertSubdomain`.
 * If successful, constructs a redirect URL using the new subdomain and the base domain from the request host,
 * and responds with a JSON object containing the new subdomain, the constructed redirect URL, and the original URL.
 * If subdomain creation fails, responds with HTTP 500.
 *
 * @param req - Express request object, expected to contain a `body.url` property.
 * @param res - Express response object used to send the response.
 * @returns A JSON response with subdomain info on success, or an error status on failure.
 */
const postRoute = async (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).send('URL is required');
    }
    const newDomain = await tryInsertSubdomain(url, req.db);
    if (newDomain) {
        // Build the full redirect URL
        const protocol = req.protocol;
        const host = req.get('host') || '';
        // Remove the current subdomain (if any) from host
        const hostParts = host.split('.');
        // Remove the first part (subdomain) if there are more than 2 parts
        const baseDomain = hostParts.length > 2 ? hostParts.slice(1).join('.') : host;
        const redirectUrl = `${protocol}://${newDomain}.${baseDomain}`;
        return res.json({ subdomain: newDomain, url: redirectUrl, originalUrl: url.replace(/[<>"'&]/g, '') });
    }
    else {
        return res.status(500).send('Could not create redirect');
    }
};

/**
 * Attempts to generate and insert a unique subdomain for the given domain into the database.
 *
 * This function generates a subdomain based on the provided domain. If the generated subdomain
 * already exists in the database, it appends a random salt to the domain and tries again until
 * a unique subdomain is found. Once a unique subdomain is generated, it inserts a new record
 * into the `redirects` table with the subdomain and the original domain URL.
 *
 * @param domain - The domain for which to generate a unique subdomain.
 * @returns A promise that resolves to the unique subdomain string.
 */
const tryInsertSubdomain = async (domain: string, db: Database): Promise<string> => {
    try {
        let url = generateSubdomainFromUrl(domain);
        while (await checkSubdomainExists(url, db)) {
            const newSalt = crypto.randomBytes(2).toString('hex');
            url = generateSubdomainFromUrl(domain, newSalt);
        }
        await db.run('INSERT INTO redirects (subdomain, url) VALUES (?,?)', [url, domain]);
        return url;
    } catch (error) {
        console.error('Failed to insert subdomain:', error);
        throw error;
    }
}

/**
 * Generates a sanitized subdomain string from a given URL and optional salt.
 *
 * The function creates a SHA-256 hash of the concatenated URL and salt,
 * encodes it in base64url format, removes all non-alphanumeric characters,
 * converts the result to lowercase, and truncates it to a maximum of 12 characters.
 *
 * @param url - The input URL to generate the subdomain from.
 * @param salt - An optional salt to add randomness to the hash (default is an empty string).
 * @returns A lowercase, alphanumeric string of up to 12 characters suitable for use as a subdomain.
 */
const generateSubdomainFromUrl = (url: string, salt: string = ''): string => {
    const hash = crypto.createHash('sha256').update(url + salt).digest('base64url');
    // Use only lowercase letters and numbers, max 12 chars
    return hash.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 12);
}

/**
 * Checks if a given subdomain exists in the 'redirects' database table.
 *
 * @param subdomain - The subdomain to check for existence.
 * @returns A promise that resolves to `true` if the subdomain exists, or `false` otherwise.
 */
const checkSubdomainExists = async (subdomain: string, db: Database): Promise<boolean> => {
    try {
        const result = await db.get('SELECT 1 FROM redirects WHERE subdomain = ?', [subdomain]);
        return !!result;
    } catch (error) {
        console.error('Failed to check subdomain existence:', error);
        throw error;
    }
}

export { postRoute };