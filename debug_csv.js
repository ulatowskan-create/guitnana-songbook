
const parseCSV = (text) => {
    const result = [];
    let row = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                currentField += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                row.push(currentField);
                currentField = '';
            } else if (char === '\n' || char === '\r') {
                if (currentField || row.length > 0) {
                    row.push(currentField);
                    result.push(row);
                    row = [];
                    currentField = '';
                }
                if (char === '\r' && nextChar === '\n') i++;
            } else {
                currentField += char;
            }
        }
    }

    if (currentField || row.length > 0) {
        row.push(currentField);
        result.push(row);
    }

    // Normalize
    const maxCols = 7;
    return result.map(r => {
        while (r.length < maxCols) {
            r.push('');
        }
        return r;
    });
}

const csvData = `"Zespół","Tytuł","Link do YT (embed)","Link do tabów","Link do chordów","Tekst+chords "
"Stereophonics","Maybe Tomorrow","https://www.youtube.com/embed/2q9_ZEtuTR8","","https://tabs.ultimate-guitar.com/tab/stereophonics/maybe-tomorrow-chords-783454","(Chords)
 
C        x-3-2-0-1-0
Am       x-0-2-2-1-0
Em       0-2-2-0-0-0
Dsus2/F# 2-0-0-2-3-0
B7       x-2-1-2-0-2

[Chorus]
 
C             Am
 So maybe tomorrow
              Em  Dsus2/F#
 I'll find my way home
"`;

const rows = parseCSV(csvData);
console.log("Total rows:", rows.length);
if (rows.length > 1) {
    const songRow = rows[1];
    console.log("Band:", songRow[0]);
    console.log("Title:", songRow[1]);
    console.log("Manual Chords Length:", songRow[5].length);
    console.log("Manual Chords Preview:", songRow[5].substring(0, 50));
    console.log("Row length:", songRow.length);
    console.log("Full row:", JSON.stringify(songRow, null, 2));
}
