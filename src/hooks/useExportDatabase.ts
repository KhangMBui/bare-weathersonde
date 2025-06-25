import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Alert } from 'react-native';

const dbName = 'weathersonde.db';

export async function exportDatabase() {
  const dbPath = `${RNFS.DocumentDirectoryPath}/${dbName}`;

  const exists = await RNFS.exists(dbPath);
  if (!exists) {
    Alert.alert('Database file not found!', dbPath);
    return;
  }

  await Share.open({
    url: `file://${dbPath}`,
    type: 'application/octet-stream',
    failOnCancel: false,
  });
}
