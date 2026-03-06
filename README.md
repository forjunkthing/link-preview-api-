# Link Preview & Metadata Extraction API

This is a developer-focused API that takes a URL and returns structured OpenGraph, Twitter Card, and standard HTML metadata (title, description, image, and favicon). This API is highly requested for applications that need to generate previews for links (like Slack, Discord, or custom social feeds).

## Features
- **Extensive Metadata Support:** Checks standard `<meta>`, `og:`, and `twitter:` tags for the best available preview data.
- **Robust Parsing:** Built on Cheerio for fast, memory-efficient HTML traversal.
- **Monetization Ready:** Built-in rate limiting and API key authentication layers. 

## Setup & Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   node index.js
   ```
   The sever will start on port `3000`.

## API Endpoints

### `GET /health`
Health check endpoint. Unauthenticated.

**Response:**
```json
{
  "status": "ok",
  "message": "Link Preview API is running"
}
```

### `GET /api/preview`
Core endpoint to fetch metadata for a given URL.

**Query Parameters:**
- `url` (Required): The URL to extract metadata from.
- `api_key` (Required if not using `X-API-Key` header): Your authentication key. The default test key is `demo_key_123`.

**Headers:**
- `X-API-Key`: Your authentication key (alternative to the query parameter).

**Example Request:**
```bash
curl "http://localhost:3000/api/preview?url=https://github.com&api_key=demo_key_123"
```

**Example Response:**
```json
{
  "title": "Build software better, together",
  "description": "GitHub is where people build software. More than 100 million people use GitHub to discover, fork, and contribute to over 420 million projects.",
  "image": "https://github.githubassets.com/images/modules/open_graph/github-logo.png",
  "favicon": "https://github.githubassets.com/favicons/favicon.svg",
  "domain": "github.com",
  "url": "https://github.com"
}
```

## Monetization Strategy

To actively monetize this API, consider the following platforms:

1. **RapidAPI:** You can list this API on [RapidAPI's Hub](https://rapidapi.com/hub). RapidAPI handles the routing, rate limiting, analytics, and billing for you. Users subscribe to a monthly quota (e.g. Free Tier: 100 requests/mo, Pro Tier $10/mo: 10,000 requests/mo). If you use RapidAPI, you can remove the local `express-rate-limit` and API Key checking and let their gateway handle it.
2. **Stripe Billing Setup:** Keep the provided local rate limiter and API key validation. Create a minimal frontend where users can enter their credit card via Stripe Elements, which generates a unique `SERVICE_API_KEY` mapped to their account.
3. **Patreon / BuyMeACoffee:** Gate access to the API key behind a paid tier.
