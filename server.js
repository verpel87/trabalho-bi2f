const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();

// Configurar SQLite
const db = new sqlite3.Database('./sampleDB.sqlite', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Successful connection to the database");
});

// Criar tabelas para Users e Leads
const sql_create_users = `CREATE TABLE IF NOT EXISTS Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);`;

const sql_create_leads = `CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    celular TEXT,
    genero TEXT,
    situacao TEXT
);`;

db.run(sql_create_users, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Successful creation of the 'Users' table");
	
	 // Hashing a senha do usuário admin
    bcrypt.hash('mud@r123', 10, (err, hash) => {
        if (err) {
            return console.error(err.message);
        }

        // Tentar inserir o usuário admin. Se ele já existir, essa inserção será ignorada.
        const sql_insert_admin = `
        INSERT OR IGNORE INTO Users (Id, username, password) VALUES (1, 'admin', ?)
        `;

        db.run(sql_insert_admin, [hash], (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Admin user inserted or already exists");
        });
    });
});

db.run(sql_create_leads, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Successful creation of the 'leads' table");
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware para sessions
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Static files
app.use(express.static('public'));

// Rota para registrar user
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        const sql_insert = `INSERT INTO Users (username, password) VALUES (?, ?)`;
        db.run(sql_insert, [username, hash], (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            return res.status(201).json({ message: 'User created! Basta clicar em "Voltar"' });	
        });
    });
});

// Rota referente ao login 
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const sql_select = `SELECT * FROM Users WHERE username = ?`;

    db.get(sql_select, [username], (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!row) {
            return res.status(400).json({ error: 'User not found. Please register!' });	
        }

        bcrypt.compare(password, row.password, (err, result) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (result) {
                req.session.loggedin = true;
                req.session.username = username;
                return res.status(200).json({ message: 'Login successful!' });
            } else {
                return res.status(401).json({ message: 'Password is incorrect' });
            }
        });
    });
});

// Verifica se está na regra de sessão
app.get('/admin', (req, res) => {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, '/public/admin.html'));
    } else {
        res.send('Please login to view this page! <a href="/">Login</a>');
    }
});

// Verifica se está na regra de sessão
app.get('/relatorios', (req, res) => {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, '/public/relatorios.html'));
    } else {
        res.send('Please login to view this page! <a href="/">Login</a>');
    }
});

// Verifica se está na regra de sessão
app.get('/users', (req, res) => {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, '/public/users.html'));
    } else {
        res.send('Please login to view this page! <a href="/">Login</a>');
    }
});  

// Rota para logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Endpoint para inserir dados no leads:
app.post('/dados', (req, res) => {
    let sql = `INSERT INTO leads (name, email, celular, genero, situacao) VALUES (?, ?, ?, ?, '1-cadastrado')`;
    let values = [req.body.name, req.body.email, req.body.celular, req.body.genero];

    db.run(sql, values, function(err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Rows inserted ${this.changes}`);
    });

    res.redirect('/return.html');
});

// Rota para pegar todos os leads:
app.get('/leads', (req, res) => {
    const situacao = req.query.situacao;

    let query = `SELECT * FROM Leads`;

    if (situacao) {
        query += ` WHERE situacao = ?`;
    }

    db.all(query, [situacao], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Rota para atualizar um lead:
app.put('/leads/:id', (req, res) => {
    const leadId = req.params.id;
    const { name, email, celular, genero, situacao } = req.body;
    let sql = `UPDATE leads SET name = ?, email = ?, celular = ?, genero = ?, situacao = ? WHERE rowid = ?`;
    db.run(sql, [name, email, celular, genero, situacao, leadId], function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "Lead updated", changes: this.changes });
    });
});

// Rota para deletar um lead:
app.delete('/leads/:id', (req, res) => {
    const leadId = req.params.id;
    let sql = `DELETE FROM leads WHERE rowid = ?`;
    db.run(sql, leadId, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "Lead deleted", changes: this.changes });
    });
});

// Rota para pegar relatório por gênero:
app.get('/reportByGender', (req, res) => {
    let sql = "SELECT genero, COUNT(genero) as count FROM leads GROUP BY genero";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Rota para pegar relatório por situação:
app.get('/reportByStatus', (req, res) => {
    let sql = "SELECT situacao, COUNT(situacao) as count FROM leads GROUP BY situacao";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Rota para pegar todos os usuários:
app.get('/api/users', (req, res) => {
    let sql = "SELECT username FROM Users";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Rota para deletar um usuário específico:
app.delete('/users/:username', (req, res) => {
    const username = req.params.username;
	
	if (username === 'admin') {
        return res.status(403).json({ message: 'O usuário "admin" não pode ser removido.' });
    }
	
    let sql = `DELETE FROM Users WHERE username = ?`;
    db.run(sql, username, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "Usuário deletado", changes: this.changes });
    });
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
