# NT Draw

Ritverktyg för träprofiler (Norsjö Trä AB), som Windows-program.

- `app/index.html` – själva verktyget (samma fil som NT Ritverktyget i Claude, med PNG-export och lokala PDF-bibliotek).
- `app/vendor/` – jsPDF 4.2.1 och svg2pdf.js 2.9.0 läggs in automatiskt vid bygget (`scripts/prepare.js`), så att PDF fungerar utan internet.
- `main.js` – fönster, meny, "Spara som"-dialog och automatiska uppdateringar.

## Installera (kollegor)

1. Gå till **Releases** på GitHub och ladda ned `NT-Draw-Setup-x.y.z.exe`.
2. Kör filen. Windows kan visa "Windows skyddade datorn" eftersom programmet inte är kodsignerat: klicka **Mer info → Kör ändå**.
3. NT Draw finns sedan på skrivbordet och i startmenyn. Nya versioner hämtas automatiskt.

## Ge ut en ny version

1. Ersätt `app/index.html` med den nya versionen av verktyget.
2. Höj `version` i `package.json` (t.ex. 1.0.0 → 1.0.1).
3. Gå till fliken **Actions** → **Bygg och publicera** → **Run workflow**.
4. Efter ca 5–10 minuter ligger installationsfilen under **Releases**. Installerade program uppdaterar sig vid nästa start.

## Utveckla lokalt

```
npm install
npm start
```
