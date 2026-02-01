
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSongInsight = async (band: string, title: string, content: string) => {
  try {
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
    console.error("Gemini Error:", error);
    return "Nie udało się pobrać wskazówek.\nSpróbuj ponownie później.\nZagraj to po swojemu!";
  }
};

export const getChordsAndLyrics = async (band: string, title: string, sourceUrl: string) => {
  try {
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
