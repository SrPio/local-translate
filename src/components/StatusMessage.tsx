import type { StatusView } from '../shared/status';

interface StatusMessageProps {
  status: StatusView | null;
}

/** Announces loading and errors to assistive technologies. */
export function StatusMessage({ status }: StatusMessageProps) {
  return (
    <div className="lt-status-region" role="status" aria-live="polite">
      {status && (
        <p className={`lt-status lt-status-${status.tone}`}>
          {status.tone === 'progress' && <span className="lt-spinner" aria-hidden="true" />}
          <span>{status.text}</span>
        </p>
      )}
    </div>
  );
}
