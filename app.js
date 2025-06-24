const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { parse, format } = require('date-fns');
// const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
// app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

// Tools
const currentDate = new Date();
const year = currentDate.getFullYear();
const month = currentDate.getMonth() + 1; // Add 1 because getMonth() is 0-indexed
const day = currentDate.getDate();
// const isoDate = currentDate.toISOString(); // Example using ISO string for a standard format (YYYY-MM-DDTHH:MM:SS.sssZ)
const yyyyMmDd = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; // Example for YYYY-MM-DD format

// SQLite setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Database opening error:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// VIEW GET today
// app.get('/today', (req, res) => {

// 	const startDate = yyyyMmDd;
// 	const params_blood = [];
// 	const params_insulin = [];
// 	const params_food = [];

// 	if (startDate) {
//         params_blood.push(startDate);
//         params_insulin.push(startDate);
//         params_food.push(startDate);
// 	}

//   db.all('SELECT id, date, time, blood, as source FROM blood WHERE date >= ?', params_blood, (err, blood) => {
//     if (err) return res.status(500).send('Error fetching blood');

//     db.all('SELECT * FROM insulin WHERE date >= ?', params_insulin, (err, insulin) => {
//       if (err) return res.status(500).send('Error fetching insulin');

//       db.all('SELECT * FROM food WHERE date >= ?', params_food, (err, food) => {
//         if (err) return res.status(500).send('Error fetching food');

//         res.render('today', {
//           	blood,
//           	insulin,
// 			food
//         });
//       });
//     });
//   });
// });

// VIEW GET specific day
app.get('/entries/:date', (req, res) => {
    const { date } = req.params;
    res.render('entry', { date: date });
});

// API GET all entries
app.get('/api/entries', (req, res) => {
    const queries = [
        `SELECT id, date, time, blood, 'blood' as source FROM blood`,
        `SELECT id, date, time, insulin, 'insulin' as source FROM insulin`,
        `SELECT id, date, time, food, 'food' as source FROM food`
    ];
    const combinedQuery = queries.join(' UNION ALL ');
    const finalQuery = `${combinedQuery} ORDER BY date ASC, time ASC`;
    db.all(finalQuery, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// API GET all entries on specific day
app.get('/api/entries/:date', (req, res) => {
    const { date } = req.params;
    	const queries = [
        `SELECT id, date, time, blood, 'blood' as source FROM blood WHERE date = ? `,
        `SELECT id, date, time, insulin, 'insulin' as source FROM insulin WHERE date = ? `,
        `SELECT id, date, time, food, 'food' as source FROM food WHERE date = ? `
    ];
    const combinedQuery = queries.join(' UNION ALL ');
    const finalQuery = `${combinedQuery} ORDER BY date ASC, time ASC`;
    db.all(finalQuery, [date, date, date], (err, rows) => {
		if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Format time field in each row
        const formattedRows = rows.map(row => {
            // Combine date + time for proper parsing (assuming `time` is like '14:30')
            const fullDateTimeStr = `${row.date}T${row.time}`;
            const parsed = parse(fullDateTimeStr, 'yyyy-MM-dd\'T\'HH:mm', new Date());

            return {
                ...row,
                time: format(parsed, 'h:mm a'),
                date: format(parsed, 'L/d/yyyy'),
            };
        });

        res.json(formattedRows);

	});
})

// API GET all Blood entries
app.get('/api/entries/blood', (req, res) => {
    db.all('SELECT * FROM blood', [], (err, rows) => {
        if (err) {
            res.status(500).send('Database error');
            return;
        }
        res.json(rows);
    });
});

// API GET Blood entries for a specific day
app.get('/api/blood/:date', (req, res) => {
    const { date } = req.params;
    db.all(`SELECT time, blood FROM blood WHERE date = ?`, [date], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Return the full array of { time, amount }
        res.json(rows);
    });
});

// API GET all Insulin entries
app.get('/api/entries/insulin', (req, res) => {
    db.all('SELECT * FROM insulin', [], (err, rows) => {
        if (err) {
            res.status(500).send('Database error');
            return;
        }
        res.json(rows);
    });
});

// API GET Insulin entries for a specific day
app.get('/api/insulin/:date', (req, res) => {
    const { date } = req.params;
    db.all(`SELECT time, insulin FROM insulin WHERE date = ?`, [date], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Return the full array of { time, amount }
        res.json(rows);
    });
});

// API GET all Food entries
app.get('/api/entries/food', (req, res) => {
    db.all('SELECT * FROM food', [], (err, rows) => {
        if (err) {
            res.status(500).send('Database error');
            return;
        }
        res.json(rows);
    });
});

// API GET Food entries for a specific day
app.get('/api/food/:date', (req, res) => {
    const { date } = req.params;
    db.all(`SELECT time, food FROM food WHERE date = ?`, [date], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Return the full array of { time, amount }
        res.json(rows);
    });
});

// CREATE new Blood
app.post('/blood', (req, res) => {
    const {
        date,
        time,
        blood,
        temp
    } = req.body;
    if (!date || !time || !blood || !temp) {
        return res.status(400).json({
            error: 'Missing required fields: date, time, blood, temp'
        });
    }
    const stmt = db.prepare('INSERT INTO blood (date, time, blood, temp) VALUES (?, ?, ?, ?)');
    stmt.run([date, time, blood, temp], function(err) {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }
        res.redirect('/');
        // res.status(201).json({
        //     message: 'Blood entry saved successfully',
        //     id: this.lastID
        // });
    });
    stmt.finalize();
});

// CREATE new Insulin
app.post('/insulin', (req, res) => {
    const {
        date,
        time,
        insulin
    } = req.body;
    if (!date || !time || insulin === undefined) {
        return res.status(400).json({
            error: 'Missing required fields: date, time, insulin'
        });
    }
    const stmt = db.prepare('INSERT INTO insulin (date, time, insulin) VALUES (?, ?, ?)');
    stmt.run([date, time, insulin], function(err) {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }
        res.redirect('/');
        // res.status(201).json({
        //     message: 'Insulin entry saved successfully',
        //     id: this.lastID
        // });
    });
    stmt.finalize();
});

// CREATE new Food
app.post('/food', (req, res) => {
    const {
        date,
        time,
        food
    } = req.body;
    if (!date || !time || food === undefined) {
        return res.status(400).json({
            error: 'Missing required fields: date, time, food'
        });
    }
    const stmt = db.prepare('INSERT INTO food (date, time, food) VALUES (?, ?, ?)');
    stmt.run([date, time, food], function(err) {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }
        res.redirect('/');
        // res.status(201).json({
        //     message: 'Food entry saved successfully',
        //     id: this.lastID
        // });
    });
    stmt.finalize();
});

// API SORT by specific day range with limits
// app.get('/api/entries/data-by-date', (req, res) => {
//     const startDate = '2025-06-20'; // req.query.start_date; // e.g., '2024-01-01'
//     const endDate = '2025-06-21'; // req.query.end_date; // e.g., '2024-12-31'
//     let query_blood = 'SELECT * FROM blood';
//     const params = [];
//     if (startDate && endDate) {
//         query_blood += ' WHERE date BETWEEN ? AND ?';
//         params.push(startDate, endDate);
//     } else if (startDate) {
//         query_blood += ' WHERE date >= ?';
//         params.push(startDate);
//     } else if (endDate) {
//         query_blood += ' WHERE date <= ?';
//         params.push(endDate);
//     }
//     db.all(query_blood, params, (err, rows) => {
//         if (err) {
//             res.status(500).json({
//                 error: err.message
//             });
//             return;
//         }
//         res.json(rows);
//     });
// });

// app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});