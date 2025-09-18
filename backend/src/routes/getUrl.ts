import { Request, Response } from 'express';

/**
 * Handles incoming HTTP requests to resolve and redirect based on the subdomain.
 *
 * Extracts the subdomain from the request's hostname, queries the database for a matching redirect URL,
 * and issues an HTTP redirect if found. If no redirect is found, responds with a 404 status.
 * Handles and logs database errors, responding with a 500 status in case of failure.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @returns A Promise that resolves to an HTTP redirect, 404, or 500 response.
 */
const getRoute = async (req: Request, res: Response) => {
    console.debug('Received GET request for host:', req.hostname);
    const host = req.hostname;
    const domainParts = host.split('.');
    const subDomain = domainParts[0];
    console.debug('Extracted subdomain:', subDomain);
    try {
        const result = await req.db.get('SELECT url FROM redirects WHERE subdomain = ?', [subDomain]);
        if (result && result.url) {
            return res.redirect(result.url);
        } else {
            return res.status(404).send('Redirect not found');
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).send('Internal Server Error');
    }
};

export { getRoute };