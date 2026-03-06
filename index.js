const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { fetchMetadata } = require('./utils/metadata');
require('dotenv').config();

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require('stripe')(stripeKey) : null;

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));

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

// --- Stripe Monetization Endpoints ---

// 1. Create a Checkout Session
app.post('/create-checkout-session', async (req, res) => {
    const isTestKey = stripeKey === 'sk_test_...' || !stripe;

    if (isTestKey) {
        console.log("Using local test key... Mocking Stripe Checkout and redirecting to success!");
        return res.redirect(303, `http://localhost:${PORT}/?success=true`);
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Link Preview API - Pro Tier',
                            description: 'Production access with higher rate limits.',
                        },
                        unit_amount: 1000, // $10.00
                        recurring: { interval: 'month' }
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `http://localhost:${PORT}/?success=true`,
            cancel_url: `http://localhost:${PORT}/?canceled=true`,
        });
        res.redirect(303, session.url);
    } catch (error) {
        console.error("Stripe error:", error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. Webhook to provision API Keys
// In production, use express.raw({type: 'application/json'}) to verify signatures
app.post('/webhook', express.json(), (req, res) => {
    const event = req.body;

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            // In a real app, you would:
            // 1. Generate a unique API Key: const newApiKey = crypto.randomUUID();
            // 2. Save it to your Database mapped to session.customer_details.email
            // 3. Email the API key to the user
            console.log(`Payment successful for: ${session.customer_details.email}`);
            console.log(`Would generate and email API Key to: ${session.customer_details.email}`);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
});

app.listen(PORT, () => {
    console.log(`Link Preview API server running on port ${PORT}`);
    console.log(`Test endpoint: http://localhost:${PORT}/api/preview?url=https://github.com&api_key=demo_key_123`);
});
