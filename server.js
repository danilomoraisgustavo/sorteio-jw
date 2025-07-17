const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('data.db');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database and seed characters if empty
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    gender TEXT
  )`);
    db.run(`CREATE TABLE IF NOT EXISTS draws (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT,
    user_gender TEXT,
    character_id INTEGER,
    draw_time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
    db.get("SELECT COUNT(*) AS count FROM characters", (e, r) => {
        if (r.count === 0) {
            const initialCharacters = [
                { name: 'Abel', gender: 'M' },
                { name: 'Abraão', gender: 'M' },
                { name: 'Ana', gender: 'F' },
                { name: 'Corá', gender: 'M' },
                { name: 'Daniel', gender: 'M' },
                { name: 'Davi', gender: 'M' },
                { name: 'Esaú', gender: 'M' },
                { name: 'Ester', gender: 'F' },
                { name: 'Ezequias', gender: 'M' },
                { name: 'Gideão', gender: 'M' },
                { name: 'Isaías', gender: 'M' },
                { name: 'Jacó', gender: 'M' },
                { name: 'Jeremias', gender: 'M' },
                { name: 'Jó', gender: 'M' },
                { name: 'Jonas', gender: 'M' },
                { name: 'Jonatã', gender: 'M' },
                { name: 'José', gender: 'M' },
                { name: 'Josias', gender: 'M' },
                { name: 'Josué', gender: 'M' },
                { name: 'Ló', gender: 'M' },
                { name: 'Manoá', gender: 'M' },
                { name: 'Miriã', gender: 'F' },
                { name: 'Moisés', gender: 'M' },
                { name: 'Neemias', gender: 'M' },
                { name: 'Noé', gender: 'M' },
                { name: 'Noemi', gender: 'F' },
                { name: 'Paulo', gender: 'M' },
                { name: 'Pedro', gender: 'M' },
                { name: 'Potifar', gender: 'M' },
                { name: 'Raabe', gender: 'F' },
                { name: 'Rubem', gender: 'M' },
                { name: 'Rute', gender: 'F' },
                { name: 'Salomão', gender: 'M' },
                { name: 'Samuel', gender: 'M' },
                { name: 'Sansão', gender: 'M' },
                { name: 'Timóteo', gender: 'M' },
                { name: 'Zípora', gender: 'F' }
            ];
            const stmt = db.prepare("INSERT INTO characters (name, gender) VALUES (?, ?)");
            for (const ch of initialCharacters) {
                stmt.run(ch.name, ch.gender);
            }
            stmt.finalize(() => {
                const PORT = process.env.PORT || 3000;
                app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
            });
        } else {
            const PORT = process.env.PORT || 3000;
            app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        }
    });
});

// Route for drawing a character
app.post('/draw', (req, res) => {
    const { name, gender } = req.body;
    if (!name || !gender) {
        return res.status(400).send('Nome ou gênero não fornecido');
    }
    // Check if this user has already drawn
    db.get("SELECT COUNT(*) AS c FROM draws WHERE user_name = ?", [name], (err, row) => {
        if (err) {
            return res.status(500).send('Erro interno');
        }
        if (row.c > 0) {
            // User already drew a character
            return res.status(400).send('Este nome já realizou o sorteio');
        }
        // Randomly select a character of the given gender
        db.get("SELECT id, name FROM characters WHERE gender = ? ORDER BY RANDOM() LIMIT 1", [gender], (err2, character) => {
            if (err2) {
                return res.status(500).send('Erro ao sortear personagem');
            }
            if (!character) {
                return res.status(404).send('Nenhum personagem disponível para o gênero selecionado');
            }
            // Record the draw
            db.run("INSERT INTO draws (user_name, user_gender, character_id) VALUES (?, ?, ?)",
                [name, gender, character.id],
                function (err3) {
                    if (err3) {
                        return res.status(500).send('Erro ao salvar resultado');
                    }
                    res.json({ character: character.name });
                }
            );
        });
    });
});

// Route for adding a new character to the list
app.post('/characters', (req, res) => {
    const { name, gender } = req.body;
    if (!name || !gender) {
        return res.status(400).send('Nome ou gênero não fornecido');
    }
    db.run("INSERT INTO characters (name, gender) VALUES (?, ?)", [name, gender], function (err) {
        if (err) {
            return res.status(500).send('Erro ao adicionar personagem');
        }
        res.json({ success: true });
    });
});
