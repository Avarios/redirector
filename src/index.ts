import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    const host = req.hostname;
    const domainParts = host.split('.');
    console.log(`Host: ${host}, Domain Parts: ${domainParts}`);
    res.json({ subdomain: domainParts[0], domain: domainParts.slice(1).join('.') });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});