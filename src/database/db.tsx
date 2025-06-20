import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let db: any = null;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabase({
      name: 'weathersonde.db',
      location: 'default',
    });
  }
  return db;
}

export async function initDB() {
  const db = await getDb();
  await db.executeSql(`
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
}

export async function insertRecord(record: any) {
  const db = await getDb();
  await db.executeSql(
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
  );
}

export async function fetchRecords() {
  const db = await getDb();
  const [results] = await db.executeSql(
    `SELECT * FROM records ORDER BY id DESC LIMIT 20`,
  );
  // results.rows is a SQLResultSetRowList
  const records = [];
  for (let i = 0; i < results.rows.length; i++) {
    records.push(results.rows.item(i));
  }
  return records;
}

export async function clearRecords() {
  const db = await getDb();
  await db.executeSql(`DELETE FROM records`);
}
