require("dotenv").config();

const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/generate-recipe", async (req, res) => {
    try {
        const {
            ingredients,
            servings,
            maxTime,
            diet
        } = req.body;

        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({
                error: "Keine Zutaten angegeben."
            });
        }

        const prompt = `
Du bist Frigora, ein intelligenter KI-Koch.

Erstelle aus den vorhandenen Zutaten ein leckeres Rezept.

Vorhandene Zutaten:
${ingredients.join(", ")}

Personen:
${servings}

Maximale Zubereitungszeit:
${maxTime} Minuten

Ernährungsweise:
${diet}

Regeln:

1. Verwende möglichst viele der vorhandenen Zutaten.
2. Vermeide unnötige zusätzliche Zutaten.
3. Das Rezept muss innerhalb der angegebenen Zeit zubereitbar sein.
4. Berücksichtige die gewünschte Ernährungsweise.
5. Wenn zusätzliche Zutaten notwendig sind, liste sie separat auf.
6. Schreibe die Anleitung verständlich für einen normalen Hobbykoch.
7. Antworte auf Deutsch.

Erstelle das Rezept exakt in diesem Format:

REZEPTNAME:
[Name des Rezepts]

BESCHREIBUNG:
[Kurze Beschreibung]

ZEIT:
[Zubereitungszeit]

SCHWIERIGKEIT:
[Einfach / Mittel / Schwer]

VERWENDETE ZUTATEN:
- [Zutat 1]
- [Zutat 2]

ZUSÄTZLICHE ZUTATEN:
- [Zutat 1]
- [Zutat 2]

ZUBEREITUNG:
1. [Schritt 1]
2. [Schritt 2]
3. [Schritt 3]

Halte dich genau an diese Struktur und schreibe auf Deutsch.
`;

        const response = await client.responses.create({
            model: "gpt-5.6-luna",
            input: prompt
        });

        res.json({
            recipe: response.output_text
        });

    } catch (error) {
        console.error("KI-Fehler:", error);

        res.status(500).json({
            error: "Das Rezept konnte nicht erstellt werden."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Frigora läuft auf http://localhost:${PORT}`);
});