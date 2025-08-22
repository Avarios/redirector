"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
    const host = req.headers.host || '';
    // Remove port if present
    const hostWithoutPort = host.split(':')[0];
    const domainParts = hostWithoutPort.split('.');
    // Assuming domain is like subdomain.domain.com
    let subdomain = '';
    if (domainParts.length > 2) {
        subdomain = domainParts.slice(0, -2).join('.');
    }
    res.json({ subdomain });
});
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
