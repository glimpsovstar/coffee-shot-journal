import { useRef, useState } from 'react';
import { markCloudImportDone } from '../lib/cloudConfig';
import { importJournalDataToCloud } from '../services/cloudImport';
import {
  buildJournalBackupFromIndexedDb,
  downloadJournalBackupFile,
  journalDataFromBackup,
  parseJournalBackupFile,
  photoBlobsFromBackup,
  restoreJournalBackupToIndexedDb,
} from '../utils/journalBackup';

interface JournalBackupPanelProps {
  cloudUserId: string | null;
  onRestored: () => void;
}

export function JournalBackupPanel({ cloudUserId, onRestored }: JournalBackupPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setError(null);
    setMessage(null);
    setExporting(true);
    try {
      const backup = await buildJournalBackupFromIndexedDb();
      downloadJournalBackupFile(backup);
      setMessage(
        `Exported ${backup.beans.length} beans, ${backup.shots.length} shots, and ${backup.photos.length} photos.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (file: File) => {
    setError(null);
    setMessage(null);
    setImporting(true);
    try {
      const text = await file.text();
      const backup = parseJournalBackupFile(text);

      if (cloudUserId) {
        const summary = await importJournalDataToCloud(
          cloudUserId,
          journalDataFromBackup(backup),
          photoBlobsFromBackup(backup),
        );
        markCloudImportDone(cloudUserId);
        setMessage(
          `Imported to cloud: ${summary.beans} beans, ${summary.shots} shots, ${summary.photos} photos.`,
        );
      } else {
        await restoreJournalBackupToIndexedDb(backup);
        setMessage(
          `Restored ${backup.beans.length} beans, ${backup.shots.length} shots, and ${backup.photos.length} photos on this device.`,
        );
      }

      onRestored();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <section className="journal-backup" aria-labelledby="journal-backup-heading">
      <h2 id="journal-backup-heading">Backup &amp; restore</h2>
      <p>
        {cloudUserId
          ? 'Export or import a JSON backup file. Use this to move journal data from localhost to the cloud (export on your dev machine, then import here while signed in).'
          : 'Export or import a JSON backup of beans, shots, and photos on this browser.'}
      </p>

      <div className="journal-backup__actions">
        <button type="button" className="btn-secondary" disabled={exporting} onClick={handleExport}>
          {exporting ? 'Exporting…' : 'Download backup file'}
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
        >
          {importing ? 'Importing…' : cloudUserId ? 'Import backup to cloud' : 'Import backup file'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="journal-backup__file-input"
          aria-label="Journal backup file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleImportFile(file);
          }}
        />
      </div>

      {message ? <p className="journal-backup__message">{message}</p> : null}
      {error ? (
        <p className="journal-backup__error" role="alert">{error}</p>
      ) : null}
    </section>
  );
}
