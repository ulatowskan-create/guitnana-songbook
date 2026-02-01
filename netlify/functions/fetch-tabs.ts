import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import * as cheerio from "cheerio";

interface RequestBody {
  url: string;
}

interface ResponseBody {
  success: boolean;
  content?: string;
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
    const { url } = body;

    if (!url || !url.includes("ultimate-guitar.com")) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Invalid Ultimate Guitar URL" }),
      };
    }

    // Fetch the page with proper headers to avoid bot detection
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          success: false, 
          error: `Failed to fetch: ${response.status} ${response.statusText}` 
        }),
      };
    }

    const html = await response.text();

    // Try to extract data from window.UGAPP_DATA
    const ugDataMatch = html.match(/window\.UGAPP_DATA\s*=\s*(\{.*?\});/s);
    
    if (ugDataMatch && ugDataMatch[1]) {
      try {
        const ugData = JSON.parse(ugDataMatch[1]);
        
        // Try different possible paths where the tab content might be stored
        let tabContent = 
          ugData?.store?.page?.data?.tab_view?.wiki_tab?.content ||
          ugData?.data?.tab_view?.wiki_tab?.content ||
          ugData?.tab_view?.wiki_tab?.content ||
          ugData?.store?.page?.data?.tab?.content ||
          null;

        if (tabContent) {
          // Convert Ultimate Guitar's chord format [ch]Am[/ch] to our format [Am]
          const formattedContent = tabContent
            .replace(/\[ch\](.*?)\[\/ch\]/g, "[$1]")
            .replace(/\[tab\](.*?)\[\/tab\]/gs, "$1")
            .trim();

          return {
            statusCode: 200,
            body: JSON.stringify({ 
              success: true, 
              content: formattedContent 
            } as ResponseBody),
          };
        }
      } catch (parseError) {
        console.error("Error parsing UGAPP_DATA:", parseError);
      }
    }

    // Fallback: Try to scrape from HTML using cheerio
    const $ = cheerio.load(html);
    
    // Try common selectors for tab content
    const selectors = [
      'pre[class*="js-tab-content"]',
      'pre.js-tab-content',
      '[data-name="tab-content"]',
      'code[class*="tab"]',
      'pre code',
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        const content = element.text().trim();
        if (content.length > 100) { // Ensure we got meaningful content
          return {
            statusCode: 200,
            body: JSON.stringify({ 
              success: true, 
              content 
            } as ResponseBody),
          };
        }
      }
    }

    // If we couldn't find the content
    return {
      statusCode: 404,
      body: JSON.stringify({ 
        success: false, 
        error: "Could not extract tab content from page" 
      }),
    };

  } catch (error) {
    console.error("Error in fetch-tabs function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
    };
  }
};

export { handler };
