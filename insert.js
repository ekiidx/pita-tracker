const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        return console.error('Failed to connect to database:', err.message);
    }
    console.log('Connected to SQLite database.');
});

db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS blood`);
    db.run(`DROP TABLE IF EXISTS insulin`);
    db.run(`DROP TABLE IF EXISTS food`);

    db.run(`
    CREATE TABLE IF NOT EXISTS blood (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      blood INTEGER NOT NULL,
      temp INTEGER NOT NULL
    );
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS insulin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      insulin INTEGER NOT NULL
    );
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS food (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      food INTEGER NOT NULL
    );
  `);

    const stmt_blood = db.prepare(`INSERT INTO blood (date, time, blood, temp) VALUES (?, ?, ?, ?)`);
    const stmt_insulin = db.prepare(`INSERT INTO insulin (date, time, insulin) VALUES (?, ?, ?)`);
    const stmt_food = db.prepare(`INSERT INTO food (date, time, food) VALUES (?, ?, ?)`);

    const dummyBlood = [
        ['2025-06-18', '09:00', '333', '74'],
        ['2025-06-18', '12:00', '287', '75'],
        ['2025-06-18', '16:00', '184', '77'],
        ['2025-06-18', '19:00', '125', '76'],
    ];
    const dummyInsulin = [
        ['2025-06-18', '10:00', '.5'],
        ['2025-06-18', '12:45', '1'],
        ['2025-06-18', '16:00', '.5'],
        ['2025-06-18', '19:15', '1'],
    ];
    const dummyFood = [
        ['2025-06-18', '09:30', '.25'],
        ['2025-06-18', '12:30', '.5'],
        ['2025-06-18', '17:00', '.25'],
    ];

    dummyBlood.forEach(([date, time, blood, temp]) => {
        stmt_blood.run(date, time, blood, temp);
    });
    dummyInsulin.forEach(([date, time, insulin]) => {
        stmt_insulin.run(date, time, insulin);
    });
    dummyFood.forEach(([date, time, food]) => {
        stmt_food.run(date, time, food);
    });

    stmt_blood.finalize();
    stmt_insulin.finalize();
    stmt_food.finalize();

    console.log('Database initialized with data.');
});

db.close();