const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { fetchMetadata } = require('./utils/metadata');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Monetization Feature: Rate Limiting
// Limit each IP to 100 requests per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again after 15 minutes.'
    }
});

// Apply rate limiting to all /api routes
app.use('/api/', apiLimiter);

// 2. Monetization Feature: API Key Authentication Middleware
const requireApiKey = (req, res, next) => {
    // In a real application, this would check against a database of valid keys
    // associated with customer billing accounts (e.g. Stripe).
    // For demonstration, we use a single key from the .env file.
    const apiKey = req.header('X-API-Key') || req.query.api_key;
    const validKey = process.env.SERVICE_API_KEY || 'demo_key_123';

    if (!apiKey || apiKey !== validKey) {
        return res.status(401).json({ error: 'Unauthorized. Invalid or missing API Key.' });
    }
    next();
};

// --- Routes ---

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Link Preview API is running' });
});

// Core Endpoint: Get Metadata Preview
app.get('/api/preview', requireApiKey, async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: 'Missing required query parameter: url' });
    }

    // Basic URL validation
    try {
        new URL(targetUrl);
    } catch (err) {
        return res.status(400).json({ error: 'Invalid URL format provided.' });
    }

    try {
        const metadata = await fetchMetadata(targetUrl);
        res.status(200).json(metadata);
    } catch (error) {
        console.error(`Error processing ${targetUrl}:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Link Preview API server running on port ${PORT}`);
    console.log(`Test endpoint: http://localhost:${PORT}/api/preview?url=https://github.com&api_key=demo_key_123`);
});
