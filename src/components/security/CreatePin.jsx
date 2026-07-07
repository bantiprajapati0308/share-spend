/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from 'react';
import { Lock } from 'react-bootstrap-icons';
import { appendDigit, removeLastDigit, validatePin } from '../../services/security/pin.service';
import PinDots from './PinDots';
import PinPad from './PinPad';
import styles from './Security.module.scss';

function CreatePin({ title = 'Create 4 Digit PIN', subtitle = 'Enter a PIN to secure your app.', onComplete, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const addDigit = useCallback((digit) => {
    setError('');
    setPin((current) => appendDigit(current, digit, 4));
  }, []);

  useEffect(() => {
    if (pin.length !== 4) return;
    const validation = validatePin(pin, 4);
    if (validation) {
      setError(validation);
      setPin('');
      return;
    }
    onComplete(pin);
  }, [onComplete, pin]);

  return (
    <div className={styles.pinStage}>
      <div className={`${styles.card} p-4 text-center`}>
        <div className={`${styles.logoMark} mx-auto mb-3`}>
          <Lock size={28} />
        </div>
        <h2 className="h5 fw-bold mb-2">{title}</h2>
        <p className="text-muted small mb-4">{subtitle}</p>
        <PinDots value={pin} length={4} />
        {error && <div className="alert alert-danger py-2 small mt-3 mb-0">{error}</div>}
        <div className="mt-4">
          <PinPad onDigit={addDigit} onBackspace={() => setPin((current) => removeLastDigit(current))} />
        </div>
        {onCancel && (
          <button type="button" className="btn btn-link text-decoration-none mt-3" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default CreatePin;
