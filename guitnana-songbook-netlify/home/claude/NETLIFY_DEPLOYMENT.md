# 🚀 Jak wdrożyć Guitnana Songbook na Netlify

## Krok 1: Przygotuj konto GitHub (jeśli nie masz)
1. Idź na https://github.com
2. Załóż darmowe konto
3. Potwierdź email

## Krok 2: Utwórz nowe repozytorium
1. Kliknij **"New repository"** (zielony przycisk)
2. Nazwa: `guitnana-songbook`
3. Ustaw jako **Public**
4. **NIE** zaznaczaj "Add a README file"
5. Kliknij **"Create repository"**

## Krok 3: Wgraj pliki do GitHub
### Opcja A - Przez interfejs GitHub (najprostsza):
1. W swoim repozytorium kliknij **"uploading an existing file"**
2. Rozpakuj `guitnana-songbook-netlify.zip`
3. Przeciągnij **wszystkie pliki** (nie folder!) do okna przeglądarki
4. Przewiń w dół i kliknij **"Commit changes"**

### Opcja B - Przez Git (dla zaawansowanych):
```bash
cd /ścieżka/do/rozpakowanego/projektu
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TWOJA-NAZWA/guitnana-songbook.git
git push -u origin main
```

## Krok 4: Połącz z Netlify
1. Idź na https://netlify.com
2. Kliknij **"Sign up"** → wybierz **"Sign up with GitHub"**
3. Po zalogowaniu kliknij **"Add new site"** → **"Import an existing project"**
4. Wybierz **"Deploy with GitHub"**
5. Znajdź i wybierz repozytorium `guitnana-songbook`
6. Netlify automatycznie wykryje ustawienia:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. **WAŻNE**: Kliknij **"Add environment variables"**
   - Variable: `VITE_GEMINI_API_KEY`
   - Value: `TWÓJ_KLUCZ_API_GEMINI`
8. Kliknij **"Deploy"**

## Krok 5: Poczekaj na deployment
- Deployment zajmie 2-5 minut
- Zobaczysz zielony status "Published"
- Dostaniesz URL typu: `https://nazwa-xyz.netlify.app`

## Krok 6: (Opcjonalne) Zmień nazwę domeny
1. W Netlify kliknij **"Domain settings"**
2. Kliknij **"Options"** → **"Edit site name"**
3. Wpisz np. `guitnana-songbook`
4. Twój URL będzie: `https://guitnana-songbook.netlify.app`

## ⚠️ WAŻNE: Klucz API Gemini
Musisz mieć własny klucz API Google Gemini:
1. Idź na https://aistudio.google.com/apikey
2. Kliknij **"Create API key"**
3. Skopiuj klucz
4. Wklej go w Netlify Environment Variables jako `VITE_GEMINI_API_KEY`

## 🎸 Gotowe!
Twoja aplikacja będzie działać z YouTube embedami bez błędu 153! 

## Aktualizacje w przyszłości
Każda zmiana w kodzie na GitHub automatycznie wdroży się na Netlify (continuous deployment).

---
Problemy? Napisz do mnie! 🚀
