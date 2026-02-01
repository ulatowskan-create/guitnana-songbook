# 🚀 Jak wdrożyć Guitnana Songbook na Netlify

## ✨ Co zostało naprawione
- ✅ YouTube embedy będą działać (koniec z błędem 153!)
- ✅ Automatyczny fallback do przycisku jeśli iframe nie zadziała
- ✅ Pełna konfiguracja dla Netlify

---

## 📋 Krok po kroku

### Krok 1: Utwórz konto GitHub (jeśli nie masz)
1. Idź na **https://github.com**
2. Kliknij **"Sign up"**
3. Potwierdź email

### Krok 2: Utwórz nowe repozytorium
1. Zaloguj się na GitHub
2. Kliknij **zielony przycisk "New"** (przy "Repositories")
3. Wypełnij:
   - **Repository name:** `guitnana-songbook`
   - **Visibility:** Public ✅
   - **NIE zaznaczaj** "Add a README file"
4. Kliknij **"Create repository"**

### Krok 3: Wgraj kod na GitHub

#### OPCJA A - Przez przeglądarkę (najłatwiejsza!) 🌟
1. W swoim nowym repo zobaczysz tekst "uploading an existing file"
2. Kliknij w ten link
3. **Rozpakuj** plik `guitnana-songbook-netlify.zip` na swoim komputerze
4. Otwórz folder z rozpakowanymi plikami
5. **Zaznacz WSZYSTKIE pliki** (Ctrl+A / Cmd+A)
6. **Przeciągnij** je do okna GitHub w przeglądarce
7. Przewiń na dół strony
8. Kliknij **"Commit changes"** (zielony przycisk)
9. Poczekaj aż się wgrają (zobaczysz listę plików)

#### OPCJA B - Przez Git (dla bardziej zaawansowanych)
```bash
cd ścieżka/do/rozpakowanego/folderu
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TWOJA-NAZWA-UŻYTKOWNIKA/guitnana-songbook.git
git push -u origin main
```

### Krok 4: Wdróż na Netlify

1. **Idź na https://netlify.com**
2. Kliknij **"Sign up"**
3. Wybierz **"Sign up with GitHub"** (najprostsze!)
4. Autoryzuj Netlify dostęp do GitHub
5. Po zalogowaniu kliknij **"Add new site"** → **"Import an existing project"**
6. Wybierz **"Deploy with GitHub"**
7. Znajdź i kliknij na repozytorium **`guitnana-songbook`**
8. Netlify automatycznie wykryje ustawienia ✅
   - Build command: `npm run build`
   - Publish directory: `dist`
9. **⚠️ WAŻNE - Dodaj zmienną środowiskową:**
   - Kliknij **"Show advanced"** lub **"Add environment variables"**
   - Dodaj zmienną:
     - **Key:** `VITE_GEMINI_API_KEY`
     - **Value:** `TWÓJ_KLUCZ_API_GEMINI` (skopiuj z Google AI Studio)
10. Kliknij **"Deploy site"**

### Krok 5: Poczekaj na deployment 🎸

- Deployment zajmie **2-5 minut**
- Zobaczysz **zielony status "Published"**
- Dostaniesz URL typu: `https://random-name-123.netlify.app`

### Krok 6: (Opcjonalnie) Zmień adres strony

1. W Netlify przejdź do **"Site settings"**
2. W sekcji **"Site information"** kliknij **"Change site name"**
3. Wpisz np. `guitnana-songbook`
4. Twój nowy URL: **`https://guitnana-songbook.netlify.app`** 🎉

---

## 🔑 Gdzie wziąć klucz API Gemini?

1. Idź na **https://aistudio.google.com/apikey**
2. Kliknij **"Create API key"**
3. Wybierz projekt lub stwórz nowy
4. **Skopiuj klucz** (coś jak: `AIzaSy...`)
5. Wklej go w Netlify jako wartość `VITE_GEMINI_API_KEY`

⚠️ **UWAGA:** Ten klucz jest wrażliwy - NIE udostępniaj go publicznie!

---

## 🎉 Gotowe!

Twoja aplikacja działa na:
- **https://twoja-nazwa.netlify.app**
- YouTube embedy działają bez błędu 153! ✅
- Każda zmiana na GitHub automatycznie wdroży się na Netlify

---

## 🔄 Jak zaktualizować aplikację w przyszłości?

### Przez GitHub (przeglądarka):
1. Wejdź na swoje repo na GitHub
2. Znajdź plik do edycji (np. `components/SongDetail.tsx`)
3. Kliknij ikonę **ołówka** (Edit)
4. Wprowadź zmiany
5. Przewiń w dół i kliknij **"Commit changes"**
6. Netlify **automatycznie** wdroży zmiany! (2-3 minuty)

### Przez Git (terminal):
```bash
# Wprowadź zmiany w kodzie
git add .
git commit -m "Opis zmian"
git push
# Netlify automatycznie wdroży!
```

---

## 🆘 Najczęstsze problemy

### Problem: Białe embedy YouTube
- **Rozwiązanie:** Sprawdź czy URLe w danych są poprawne (format: `https://www.youtube.com/watch?v=...`)

### Problem: "API key not found"
- **Rozwiązanie:** 
  1. Sprawdź czy w Netlify jest ustawiona zmienna `VITE_GEMINI_API_KEY`
  2. Po dodaniu zmiennej kliknij **"Trigger deploy"** aby wdrożyć ponownie

### Problem: Deployment się nie udaje
- **Rozwiązanie:** 
  1. W Netlify przejdź do **"Deploys"**
  2. Kliknij na nieudany deploy
  3. Przeczytaj logi błędów
  4. Najczęściej brakuje jakiegoś pliku - sprawdź czy wszystkie pliki są na GitHub

---

## 📞 Pytania?

Jeśli coś nie działa, napisz do mnie! 🚀

Miłego grania! 🎸✨
