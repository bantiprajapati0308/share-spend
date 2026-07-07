/* eslint-disable react/prop-types */
import { Backspace } from 'react-bootstrap-icons';
import styles from './Security.module.scss';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

function PinPad({ onDigit, onBackspace, disabled }) {
  return (
    <div className={styles.keypad}>
      {KEYS.map((key, index) => {
        if (!key) return <span key={`empty-${index}`} />;
        if (key === 'backspace') {
          return (
            <button key={key} type="button" className={styles.key} onClick={onBackspace} disabled={disabled} aria-label="Remove digit">
              <Backspace size={22} />
            </button>
          );
        }
        return (
          <button key={key} type="button" className={styles.key} onClick={() => onDigit(key)} disabled={disabled}>
            {key}
          </button>
        );
      })}
    </div>
  );
}

export default PinPad;
