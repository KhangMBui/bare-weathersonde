import { insertRecord } from '../database/db';
import { Alert } from 'react-native';

export function importPredefinedRecords(predefined_records: any) {
  Alert.alert(
    'Import Test Data',
    "This will add 30 test records to your database with projectName 'TestProject' and experimentNumber 1. Continue?",
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Import',
        onPress: () => {
          let inserted = 0;
          const baseDate = new Date();

          // ONLY ONE forEach loop needed
          predefined_records.forEach((record: any, index: number) => {
            // Create unique time for each record
            const recordDate = new Date(baseDate.getTime());
            recordDate.setSeconds(baseDate.getSeconds() + index);

            const formattedDate = recordDate.toISOString().split('T')[0];
            const formattedTime = recordDate.toTimeString().split(' ')[0];

            // Convert to database record format
            const dbRecord = {
              date: formattedDate,
              time: formattedTime,
              altitude: record.altitude,
              internalTemp: 22.5,
              internalRH: 50,
              internalPres: 1013.5,
              airTemp: record.temperature,
              weatherRH: record.humidity,
              inversionIntensity: 0,
              inversionHeight: 0,
              inversionRate: 0,
              projectName: 'TestProject',
              experimentNumber: 1,
            };

            // Insert into database
            insertRecord(dbRecord, () => {
              inserted++;
              if (inserted === predefined_records.length) {
                Alert.alert(
                  'Import Complete',
                  `Successfully imported ${inserted} records into the database.`,
                );
              }
            });
          });
        },
      },
    ],
  );
}
