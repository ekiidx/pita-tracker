const sqlite3 = require('sqlite3').verbose();

// Tools
const currentDate = new Date();
const year = currentDate.getFullYear();
const month = currentDate.getMonth() + 1; // Add 1 because getMonth() is 0-indexed
const day = currentDate.getDate();
// const isoDate = currentDate.toISOString(); // Example using ISO string for a standard format (YYYY-MM-DDTHH:MM:SS.sssZ)
const yyyyMmDd = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; // Example for YYYY-MM-DD format


const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        return console.error('Failed to connect to database:', err.message);
    }
    console.log('Connected to SQLite database.');
});

db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS entry`);
    db.run(`DROP TABLE IF EXISTS blood`);
    db.run(`DROP TABLE IF EXISTS insulin`);
    db.run(`DROP TABLE IF EXISTS food`);

    db.run(`
    CREATE TABLE IF NOT EXISTS entry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL
    );
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS blood (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        blood INTEGER NOT NULL,
        temp INTEGER NOT NULL
    );
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS insulin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        insulin INTEGER NOT NULL
    );
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS food (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        food INTEGER NOT NULL
    );
  `);
    const stmt_entry = db.prepare(`INSERT INTO entry (date) VALUES (?)`);
    const stmt_blood = db.prepare(`INSERT INTO blood (entry_id, date, time, blood, temp) VALUES (?, ?, ?, ?, ?)`);
    const stmt_insulin = db.prepare(`INSERT INTO insulin (entry_id, date, time, insulin) VALUES (?, ?, ?, ?)`);
    const stmt_food = db.prepare(`INSERT INTO food (entry_id, date, time, food) VALUES (?, ?, ?, ?)`);

    const dummyEntry = [
        [yyyyMmDd],
    ];
    const dummyBlood = [
        ['1', yyyyMmDd, '09:00', '333', '74'],
        ['1', yyyyMmDd, '12:00', '287', '75'],
        ['1', yyyyMmDd, '16:00', '184', '77'],
        ['1', yyyyMmDd, '19:00', '125', '76'],
    ];
    const dummyInsulin = [
        ['1', yyyyMmDd, '10:00', '.5'],
        ['1', yyyyMmDd, '12:45', '1'],
        ['1', yyyyMmDd, '16:00', '.5'],
        ['1', yyyyMmDd, '19:15', '1'],
    ];
    const dummyFood = [
        ['1', yyyyMmDd, '09:30', '.25'],
        ['1', yyyyMmDd, '12:30', '.5'],
        ['1', yyyyMmDd, '17:00', '.25'],
    ];

    dummyEntry.forEach(([date]) => {
        stmt_entry.run(date);
    });
    dummyBlood.forEach(([entry_id, date, time, blood, temp]) => {
        stmt_blood.run(entry_id, date, time, blood, temp);
    });
    dummyInsulin.forEach(([entry_id, date, time, insulin]) => {
        stmt_insulin.run(entry_id, date, time, insulin);
    });
    dummyFood.forEach(([entry_id, date, time, food]) => {
        stmt_food.run(entry_id, date, time, food);
    });

    stmt_entry.finalize();
    stmt_blood.finalize();
    stmt_insulin.finalize();
    stmt_food.finalize();

    console.log('Database initialized with data.');
});

db.close();