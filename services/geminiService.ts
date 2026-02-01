
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key is missing! Check VITE_GEMINI_API_KEY or GEMINI_API_KEY.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getSongInsight = async (band: string, title: string, content: string) => {
  try {
    const ai = getAiClient();
    if (!ai) return "Skonfiguruj klucz API Gemini, aby otrzymać wskazówki.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Jesteś ekspertem muzycznym. Podaj 3 bardzo krótkie, praktyczne wskazówki dotyczące grania piosenki "${title}" wykonawcy "${band}". 
      Skup się na rytmie, biciu lub trudności akordów.
      ZASADY:
      1. Używaj JĘZYKA POLSKIEGO.
      2. Każda wskazówka MUSI być w nowej linii.
      3. Nie używaj gwiazdek, kropek ani punktorów na początku linii.
      4. Maksimum 15 słów na wskazówkę.
      
      Tekst/Akordy pomocniczo: ${content.substring(0, 500)}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Nie udało się pobrać wskazówek.\nSpróbuj ponownie później.\nZagraj to po swojemu!";
  }
};

// Helper to check if URL is from Ultimate Guitar
const isUltimateGuitarUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes("ultimate-guitar.com") || url.includes("tabs.ultimate-guitar.com");
};

// Helper to fetch from Songsterr (New Primary Method)
const fetchFromSongsterr = async (band: string, title: string): Promise<string | null> => {
  try {
    const response = await fetch("/.netlify/functions/fetch-songsterr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ artist: band, title: title }),
    });

    if (!response.ok) {
      // Just log warning, don't spam errors as this is expected if song not found
      console.warn("Songsterr fetch failed:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.success && data.content) {
      console.log(`Fetched from Songsterr: ${data.source}`);
      return data.content;
    }

    return null;
  } catch (error) {
    console.warn("Error calling Songsterr function:", error);
    return null;
  }
};

// Helper to fetch from Netlify Function (UG Scraper)
const fetchFromNetlifyFunction = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch("/.netlify/functions/fetch-tabs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      console.error("UG Netlify function error:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.success && data.content) {
      return data.content;
    }

    return null;
  } catch (error) {
    console.error("Error calling UG Netlify function:", error);
    return null;
  }
};

export const getChordsAndLyrics = async (band: string, title: string, sourceUrl: string) => {
  console.log(`Getting chords for: ${band} - ${title}`);

  // STRATEGY 1: Songsterr (Primary)
  // We try to find the song on Songsterr automatically
  const songsterrContent = await fetchFromSongsterr(band, title);
  if (songsterrContent) {
    return songsterrContent;
  }

  // STRATEGY 2: Ultimate Guitar Scraper (Secondary)
  // Only if we have a valid UG URL
  if (isUltimateGuitarUrl(sourceUrl)) {
    console.log("Attempting to fetch from Ultimate Guitar:", sourceUrl);
    const scrapedContent = await fetchFromNetlifyFunction(sourceUrl);

    if (scrapedContent) {
      return scrapedContent;
    }
  }

  // STRATEGY 3: AI Generation (Fallback)
  // STRATEGY 3: AI Generation (Fallback)
  console.log("Falling back to AI generation");
  try {
    const ai = getAiClient();
    if (!ai) return null;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Jesteś profesjonalnym transkrybentem muzycznym. Twoim zadaniem jest podanie tekstu piosenki "${title}" wykonawcy "${band}" wraz z akordami.
      Użyj linku jako źródła jeśli to możliwe: ${sourceUrl}
      
      ZASADY FORMATOWANIA:
      1. Umieszczaj akordy w nawiasach kwadratowych BEZPOŚREDNIO PRZED słowem lub sylabą, nad którą powinny się znajdować, np. [C] I've been [Am] down.
      2. Podaj tylko najważniejsze części: Zwrotki (Verse) i Refreny (Chorus).
      3. Zachowaj oryginalny język piosenki.
      4. Nie dodawaj żadnych wstępów ani podziękowań, tylko czysty tekst z akordami w nawiasach.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Chords Error:", error);
    return null;
  }
};
