import { useEffect, useState } from 'react';
import {
  isCloudImportPromptHandled,
  markCloudImportPromptHandled,
} from '../lib/cloudConfig';
import { hasCustomLocalJournal, importLocalJournalToCloud } from '../services/cloudImport';

interface CloudImportPromptProps {
  userId: string;
  onImported: () => void;
}

export function CloudImportPrompt({ userId, onImported }: CloudImportPromptProps) {
  const [visible, setVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (isCloudImportPromptHandled(userId)) return;
      const custom = await hasCustomLocalJournal();
      if (!cancelled && custom) setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!visible) return null;

  const handleImport = async () => {
    setError(null);
    setImporting(true);
    try {
      const summary = await importLocalJournalToCloud(userId);
      setResult(
        `Imported ${summary.beans} beans, ${summary.shots} shots, and ${summary.photos} photos to the cloud.`,
      );
      setVisible(false);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleSkip = () => {
    markCloudImportPromptHandled(userId);
    setVisible(false);
  };

  return (
    <section className="cloud-import" aria-labelledby="cloud-import-heading">
      <h2 id="cloud-import-heading">Import journal from this device</h2>
      <p>
        This browser has local journal entries that are not in the cloud yet. Upload them once, or
        use <strong>Backup &amp; restore</strong> to import a file exported from another machine
        (e.g. localhost).
      </p>
      <div className="cloud-import__actions">
        <button type="button" className="btn-primary" disabled={importing} onClick={handleImport}>
          {importing ? 'Importing…' : 'Import to cloud'}
        </button>
        <button type="button" className="btn-secondary" disabled={importing} onClick={handleSkip}>
          Skip
        </button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      {result ? <p>{result}</p> : null}
    </section>
  );
}
