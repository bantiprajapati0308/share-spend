/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { CheckCircleFill, Circle, X } from 'react-bootstrap-icons';
import styles from './Security.module.scss';

export const AUTO_LOCK_OPTIONS = [
  { label: 'Immediately', value: 0 },
  { label: '30 Seconds', value: 30 },
  { label: '1 Minute', value: 60 },
  { label: '5 Minutes', value: 300 },
  { label: '15 Minutes', value: 900 },
  { label: 'Never', value: -1 },
];

export const formatAutoLock = (seconds) => AUTO_LOCK_OPTIONS.find((option) => option.value === seconds)?.label || '1 Minute';

function AutoLockSelector({ show, value, onSelect, onClose }) {
  if (!show) return null;

  return (
    <div className={styles.bottomSheetBackdrop} role="presentation" onClick={onClose}>
      <div className={styles.bottomSheet} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div>
            <h2 className="h5 fw-bold mb-1">Auto Lock</h2>
            <p className="text-muted small mb-0">Choose after how long the app should lock automatically.</p>
          </div>
          <button type="button" className="btn btn-light rounded-circle" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="d-grid gap-2">
          {AUTO_LOCK_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`btn text-start d-flex align-items-center justify-content-between ${value === option.value ? 'btn-primary' : 'btn-outline-light border text-dark'}`}
              onClick={() => onSelect(option.value)}
            >
              <span>{option.label}</span>
              {value === option.value ? <CheckCircleFill size={18} /> : <Circle size={18} className="text-muted" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AutoLockSelector;
