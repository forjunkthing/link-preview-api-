const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetches HTML from a URL and extracts OpenGraph, Twitter Cards, and standard metadata.
 * @param {string} url - The target URL
 * @returns {Promise<Object>} The extracted metadata object
 */
async function fetchMetadata(url) {
    try {
        // Add a user agent to prevent being blocked by some sites
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            timeout: 5000,
        });

        const $ = cheerio.load(html);

        // Helper functions to get attribute values
        const getAttr = (selector, attr) => $(selector).attr(attr) || null;

        // Structured metadata response
        const metadata = {
            title: null,
            description: null,
            image: null,
            favicon: null,
            domain: new URL(url).hostname,
            url: url,
        };

        // Extract Title (OG -> Twitter -> Standard Meta -> Title tag)
        metadata.title =
            getAttr('meta[property="og:title"]', 'content') ||
            getAttr('meta[name="twitter:title"]', 'content') ||
            getAttr('meta[name="title"]', 'content') ||
            $('title').first().text() ||
            null;

        // Extract Description
        metadata.description =
            getAttr('meta[property="og:description"]', 'content') ||
            getAttr('meta[name="twitter:description"]', 'content') ||
            getAttr('meta[name="description"]', 'content') ||
            null;

        // Extract Image
        metadata.image =
            getAttr('meta[property="og:image"]', 'content') ||
            getAttr('meta[name="twitter:image"]', 'content') ||
            getAttr('meta[itemprop="image"]', 'content') ||
            null;

        // Extract Favicon
        metadata.favicon =
            getAttr('link[rel="apple-touch-icon"]', 'href') ||
            getAttr('link[rel="icon"]', 'href') ||
            getAttr('link[rel="shortcut icon"]', 'href') ||
            null;

        // Ensure image and favicon URLs are absolute if they are relative
        const makeAbsolute = (link) => {
            if (!link) return null;
            try {
                return new URL(link, url).href;
            } catch (e) {
                return link; // fallback if URL constructor fails
            }
        };

        metadata.image = makeAbsolute(metadata.image);
        metadata.favicon = makeAbsolute(metadata.favicon);

        return metadata;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Failed to fetch URL: ${error.message}`);
        }
        throw new Error(`Failed to parse metadata: ${error.message}`);
    }
}

module.exports = { fetchMetadata };
