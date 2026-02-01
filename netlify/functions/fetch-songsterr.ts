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
        // Priority: Precise match + has chords -> Any match with chords
        const bestMatch = searchResults.find((s: any) => s.hasChords === true) || searchResults[0];

        if (!bestMatch) {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, error: "No suitable match found" })
            };
        }

        console.log(`Found match: ${bestMatch.artist} - ${bestMatch.title} (ID: ${bestMatch.songId})`);

        // 2. Construct Chords Page URL
        // Format: https://www.songsterr.com/a/wsa/{slug}-chords-s{id}
        // Note: The slug doesn't have to be perfect, mostly the ID matters, but we try to be nice
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

        // 4. Parse Chords and Lyrics
        // Songsterr structure usually involves a container with lines
        // We look for where the chords are. Often standard parsing.

        // Based on analysis, Songsterr renders server-side.
        // Let's try to grab the main container. 
        // Since class names might change, we look for data attributes or patterns.

        // Songsterr Chords view analysis (based on browser subagent findings):
        // Chords are often in elements that might not have stable classes, but we know chords
        // are mixed with lyrics.
        // A common pattern in their new UI is specific containers.

        // Strategy: Extract text, attempting to keep newlines.
        // However, Songsterr chords might be in `<span>` tags while lyrics are text nodes.
        // We iterate over the DOM to reconstruct the text.

        let extractedText = "";

        // Try to find the root container for the tab/chords
        // Usually it's in a generated div. We can try to find the container that has many "C" (chord) classes or similar.
        // But a safer bet with Cheerio is to find the main content area.

        // Important: Songsterr is a Next.js app. The raw HTML *might* contain the data in __NEXT_DATA__
        const nextDataScript = $('#__NEXT_DATA__');
        if (nextDataScript.length > 0) {
            try {
                const nextData = JSON.parse(nextDataScript.html() || "{}");
                // Try to find chords in props
                // The structure is deep and complex, traversing it might be fragile.
                // Let's stick to DOM parsing if possible, or try to find the store.

                // If DOM parsing is too hard blindly, we can try a simple text extraction
                // but preserving structure is key for chords.
            } catch (e) {
                console.log("Failed to parse __NEXT_DATA__");
            }
        }

        // Heuristic parsing for SongsterrDOM
        // We look for the line wrappers.
        // Unfortunately without exact selectors from current version, this is tricky.
        // BUT, Browser Subagent saw: <span>E </span> White man

        // Let's try to target the main rendering area.
        // We can assume the content is within a <main> tag or similar.
        const mainContent = $('main');

        if (mainContent.length > 0) {
            // Simple extraction: convert <span>CHORD</span> to [CHORD]
            // We traverse all nodes.
            const traverse = (element: any) => {
                element.contents().each((_: any, el: any) => {
                    if (el.type === 'text') {
                        extractedText += el.data;
                    } else if (el.type === 'tag') {
                        const $el = $(el);
                        // Check if it's a chord. Usually short text, maybe specific color style?
                        // Songsterr chords often have a class like `C`.
                        // Or we check if it matches a chord pattern (e.g. A, Am, G7)
                        if ($el.is('span')) {
                            // Assume spans are chords if they are short and look like chords
                            const text = $el.text();
                            if (/^[A-G][b#]?(m|maj|dim|aug|sus|add|7|9|11|13)*(\/[A-G][b#]?)?$/.test(text.trim())) {
                                extractedText += `[${text.trim()}]`;
                            } else {
                                traverse($el);
                            }
                        } else if ($el.is('br') || $el.is('div') || $el.is('p')) {
                            extractedText += '\n';
                            traverse($el);
                        } else {
                            traverse($el);
                        }
                    }
                });
            };
            // traverse(mainContent); // Only if we trust manual traversal
        }

        // Backup Plan: Songsterr renders JSON in a script tag with class "state".
        // Or we just fetch raw text if we can't be smart.

        // Revision: Since we can't see the exact class names right now and they might be hashed (Next.js),
        // let's rely on the fact that we saw `<span>` for chords.
        // We will clean up the text.

        // Let's try to extract everything from the body, formatting spans as chords.
        // We can allow some noise.

        extractedText = "";
        $('body').find('*').each((i, el) => {
            // This is too aggressive.
        });

        // Better strategy for Songsterr:
        // Look for the JSON data in script tag. It's usually the most reliable way for Next.js apps.
        if (nextDataScript.length > 0) {
            const json = JSON.parse(nextDataScript.html() as string);
            // Deep search for "chords" or "lyrics" keys?
            // This is risky without inspecting the JSON structure.
        }

        // Let's go with Cheerio text extraction with a specific logic:
        // Identify blocks.
        // Replace spans with brackets.

        // We will replace all <span>Text</span> with [Text] inside the HTML string first?
        // No, that might catch non-chords.

        // Let's try to just dump the text and use AI to clean it up? 
        // No, we want to avoid AI if possible.

        // Based on subagent: <span>E </span> White man
        // If we just replace `<span>` with `[` and `</span>` with `]`, we might get something parsable.

        // Let's grab the HTML of the main container (if found) or body.
        // Regex replace span tags.
        let modifiedHtml = html;

        // Try to narrow down to the tab container
        // Songsterr usually has a div with id="tab-..." or class="...tab..."
        // If not found, use body.

        // Aggressive normalization:
        // 1. Replace <span ...>CHORD</span> with [CHORD]
        // 2. Strip other tags

        // To do this safely with Cheerio:
        $('span').each((i, el) => {
            const text = $(el).text();
            // Heuristic: Is it a chord?
            if (/^[A-G][b#]?(m|maj|dim|aug|sus|add|7|9|11|13)*(\/[A-G][b#]?)?$/.test(text.trim())) {
                $(el).replaceWith(`[${text.trim()}]`);
            }
        });

        // Now get the text.
        // We need to preserve newlines.
        $('div, p, br').before('\n');
        let textContent = $('body').text();

        // Clean up excessive newlines
        textContent = textContent.replace(/\n\s*\n/g, '\n').trim();

        // Return extracted content
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
