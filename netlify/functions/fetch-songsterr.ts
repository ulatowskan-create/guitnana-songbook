import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import * as cheerio from "cheerio";

interface RequestBody {
    artist: string;
    title: string;
}

interface ResponseBody {
    success: boolean;
    content?: string;
    source?: string;
    error?: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, error: "Method not allowed" }),
        };
    }

    try {
        const body: RequestBody = JSON.parse(event.body || "{}");
        const { artist, title } = body;

        if (!artist || !title) {
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, error: "Missing artist or title" }),
            };
        }

        console.log(`Searching Songsterr for: ${artist} - ${title}`);

        // 1. Search for the song using Songsterr API
        const searchUrl = `https://www.songsterr.com/api/songs?pattern=${encodeURIComponent(artist + " " + title)}`;

        const searchResponse = await fetch(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }
        });

        if (!searchResponse.ok) {
            throw new Error(`Songsterr search failed: ${searchResponse.status}`);
        }

        const searchResults = await searchResponse.json();

        if (!Array.isArray(searchResults) || searchResults.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, error: "Song not found on Songsterr" })
            };
        }

        // Find the best match that has chords
        const bestMatch = searchResults.find((s: any) => s.hasChords === true) || searchResults[0];

        if (!bestMatch) {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, error: "No suitable match found" })
            };
        }

        console.log(`Found match: ${bestMatch.artist} - ${bestMatch.title} (ID: ${bestMatch.songId})`);

        // 2. Construct Chords Page URL
        const slug = `${bestMatch.artist}-${bestMatch.title}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const chordsUrl = `https://www.songsterr.com/a/wsa/${slug}-chords-s${bestMatch.songId}`;
        console.log(`Fetching chords from: ${chordsUrl}`);

        // 3. Fetch the Chords Page
        const pageResponse = await fetch(chordsUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }
        });

        if (!pageResponse.ok) {
            throw new Error(`Failed to fetch chords page: ${pageResponse.status}`);
        }

        const html = await pageResponse.text();
        const $ = cheerio.load(html);

        // 4. Parse Chords and Lyrics - ROBUST METHOD

        // Remove garbage elements preventing "Songsterr Plus" etc.
        $('script, style, nav, header, footer, aside, .ad-unit, iframe, button').remove();

        // Strategy: Find the container with the most "chord-like" spans
        let bestContainer = $('body');
        let maxSpans = 0;

        // Iterate over all semantic containers
        $('div, section, main, article').each((i, el) => {
            const spansCount = $(el).find('span').length;
            // Simple heuristic: container with most spans is likely our target
            if (spansCount > maxSpans) {
                maxSpans = spansCount;
                bestContainer = $(el);
            }
        });

        if (maxSpans < 5) {
            // Fallback
            console.log("Low span count, falling back to body");
            bestContainer = $('body');
        }

        // Pre-formatting: Add newlines before block elements to preserve structure
        bestContainer.find('br, div, p').before('\n');

        // Process Chords: Replace <span>Am</span> with [Am]
        bestContainer.find('span').each((i, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            // Check if it looks like a chord
            if (/^[A-G][b#]?(m|maj|dim|aug|sus|add|7|9|11|13|5|6)*(\/[A-G][b#]?)?$/.test(text)) {
                $el.replaceWith(`[${text}]`);
            }
        });

        // Clean text
        let textContent = bestContainer.text();

        // Remove huge gaps and trim logic
        textContent = textContent
            .replace(/^[ \t]+/gm, '')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();

        // Explicitly remove "Songsterr Plus" artifacts phrases
        const garbagePhrases = [
            "Songsterr Plus", "Favorites", "Sign In", "Subscribe", "Rev. ", "Difficulty:", "Tuning:",
            "Get Plus", "Track:"
        ];
        garbagePhrases.forEach(phrase => {
            const regex = new RegExp(`^.*${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'gm');
            textContent = textContent.replace(regex, '');
        });

        textContent = textContent.trim();

        if (textContent.length > 50) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    content: textContent,
                    source: chordsUrl
                })
            };
        }

        return {
            statusCode: 404,
            body: JSON.stringify({ success: false, error: "Could not parse content" })
        };

    } catch (error) {
        console.error("Error in fetch-songsterr:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
        };
    }
};

export { handler };
