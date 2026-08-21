const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.get("SELECT * FROM restaurants WHERE id = 1", (err, row) => {
  if (err) console.error(err);
  console.log('Restaurante 1:', row);
  db.close();
});
