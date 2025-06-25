import SQLite from 'react-native-sqlite-2';

let db: any = null;

export function getDb() {
  if (!db) {
    db = SQLite.openDatabase('weathersonde.db', '1.0', '', 1);
  }
  return db;
}

export function initDB() {
  const db = getDb();
  db.transaction((tx: any) => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        time TEXT,
        altitude REAL,
        internalTemp REAL,
        internalRH TEXT,
        internalPres TEXT,
        airTemp REAL,
        weatherRH TEXT,
        inversionIntensity TEXT,
        inversionHeight TEXT,
        inversionRate TEXT,
        UNIQUE(date, time)
      );
    `);
  });
}

export function insertRecord(record: any, callback?: () => void) {
  const db = getDb();
  db.transaction((tx: any) => {
    tx.executeSql(
      `INSERT OR IGNORE INTO records (date, time, altitude, internalTemp, internalRH, internalPres, airTemp, weatherRH, inversionIntensity, inversionHeight, inversionRate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.date,
        record.time,
        record.altitude,
        record.internalTemp,
        record.internalRH,
        record.internalPres,
        record.airTemp,
        record.weatherRH,
        record.inversionIntensity,
        record.inversionHeight,
        record.inversionRate,
      ],
      callback,
      (err: any) => console.log('Insert error:', err),
    );
  });
}

export function fetchRecords(callback: (records: any[]) => void) {
  const db = getDb();
  db.transaction((tx: any) => {
    tx.executeSql(
      `SELECT * FROM records ORDER BY id DESC LIMIT 20`,
      [],
      (tx: any, result: any) => {
        const records = [];
        for (let i = 0; i < result.rows.length; i++) {
          records.push(result.rows.item(i));
        }
        callback(records);
      },
      (err: any) => console.log('Fetch error:', err),
    );
  });
}

export function clearRecords(callback?: () => void) {
  const db = getDb();
  db.transaction((tx: any) => {
    tx.executeSql(`DELETE FROM records`, [], callback, (err: any) =>
      console.log('Clear error:', err),
    );
  });
}
