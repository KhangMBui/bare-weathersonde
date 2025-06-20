import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Platform, Alert } from 'react-native';

const dbName = 'weathersonde.db';
// Default SQLite location for react-native-sqlite-storage on Android/iOS:
// const dbPath =
//   Platform.OS === 'android'
//     ? `${RNFS.DocumentDirectoryPath}/${dbName}`
//     : `${RNFS.LibraryDirectoryPath}/LocalDatabase/${dbName}`;

export async function exportDatabase() {
  let dbPath = '';
  if (Platform.OS === 'android') {
    dbPath = `${RNFS.DocumentDirectoryPath}/${dbName}`;
  } else {
    dbPath = `${RNFS.LibraryDirectoryPath}/LocalDatabase/${dbName}`;
  }

  const exists = await RNFS.exists(dbPath);
  if (!exists) {
    Alert.alert('Database file not found!', dbPath);
    return;
  }

  // Share the file
  await Share.open({
    url: `file://${dbPath}`,
    type: 'application/octet-stream',
    failOnCancel: false,
  });
}
