const express = require('express');
// const path = require('path');
const sqlite3 = require('sqlite3').verbose();
// const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
// app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tools
const currentDate = new Date();
const year = currentDate.getFullYear();
const month = currentDate.getMonth() + 1; // Add 1 because getMonth() is 0-indexed
const day = currentDate.getDate();
const isoDate = currentDate.toISOString(); // Example using ISO string for a standard format (YYYY-MM-DDTHH:MM:SS.sssZ)
const yyyyMmDd = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; // Example for YYYY-MM-DD format

// SQLite setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Database opening error:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// GET Blood entries
app.get('/blood', (req, res) => {
    db.all('SELECT * FROM blood', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Database error');
            return;
        }
        res.json(rows);
    });
});

// GET Insulin entries
app.get('/insulin', (req, res) => {
    db.all('SELECT * FROM insulin', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Database error');
            return;
        }
        res.json(rows);
    });
});

// GET Food entries
app.get('/food', (req, res) => {
    db.all('SELECT * FROM food', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Database error');
            return;
        }
        res.json(rows);
    });
});

// CREATE new Blood
app.post('/blood', (req, res) => {
  const { date, time, blood } = req.body;

  if (!date || !time || blood === undefined) {
    return res.status(400).json({ error: 'Missing required fields: date, time, blood' });
  }

  const stmt = db.prepare('INSERT INTO blood (date, time, blood) VALUES (?, ?, ?)');

  stmt.run([date, time, blood], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      message: 'Blood entry saved successfully',
      id: this.lastID
    });
  });

  stmt.finalize();
});

// CREATE new Insulin
app.post('/insulin', (req, res) => {
  const { date, time, insulin } = req.body;

  if (!date || !time || insulin === undefined) {
    return res.status(400).json({ error: 'Missing required fields: date, time, insulin' });
  }

  const stmt = db.prepare('INSERT INTO insulin (date, time, insulin) VALUES (?, ?, ?)');

  stmt.run([date, time, insulin], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      message: 'Insulin entry saved successfully',
      id: this.lastID
    });
  });

  stmt.finalize();
});

// CREATE new Food
app.post('/food', (req, res) => {
  const { date, time, food } = req.body;

  if (!date || !time || food === undefined) {
    return res.status(400).json({ error: 'Missing required fields: date, time, food' });
  }

  const stmt = db.prepare('INSERT INTO food (date, time, food) VALUES (?, ?, ?)');

  stmt.run([date, time, food], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      message: 'Food entry saved successfully',
      id: this.lastID
    });
  });

  stmt.finalize();
});

// GET Today's entries
app.get('/today', (req, res) => {
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    res.send(`Today's date is: ${formattedDate}`);
});

// SORT by specific day range
app.get('/data-by-date', (req, res) => {
    const startDate = req.query.start_date; // e.g., '2024-01-01'
    const endDate = req.query.end_date; // e.g., '2024-12-31'

    let query = 'SELECT * FROM blood';
    const params = [];

    if (startDate && endDate) {
        query += ' WHERE date_column BETWEEN ? AND ?';
        params.push(startDate, endDate);
    } else if (startDate) {
        query += ' WHERE date_column >= ?';
        params.push(startDate);
    } else if (endDate) {
        query += ' WHERE date_column <= ?';
        params.push(endDate);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({
                error: err.message
            });
            return;
        }
        res.json(rows);
    });
});

// GET all entries
app.get('/entries', (req, res) => {
    const queries = [
        `SELECT id, date, time, blood, 'blood' as source FROM blood`,
        `SELECT id, date, time, insulin, 'insulin' as source FROM insulin`,
        `SELECT id, date, time, food, 'food' as source FROM food`
    ];

    const combinedQuery = queries.join(' UNION ALL ');
    const finalQuery = `${combinedQuery} ORDER BY date ASC, time ASC`;

    db.all(finalQuery, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }
        res.json(rows);
    });
});

app.use(express.static('public'));
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});