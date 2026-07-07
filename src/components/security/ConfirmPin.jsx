/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'react-bootstrap-icons';
import { appendDigit, removeLastDigit } from '../../services/security/pin.service';
import PinDots from './PinDots';
import PinPad from './PinPad';
import styles from './Security.module.scss';

function ConfirmPin({ originalPin, onBack, onComplete, isSaving }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const addDigit = useCallback((digit) => {
    setError('');
    setPin((current) => appendDigit(current, digit, 4));
  }, []);

  useEffect(() => {
    if (pin.length < 4) {
      if (submitted) setSubmitted(false);
      return;
    }
    if (submitted) return;
    if (pin !== originalPin) {
      setError('PINs did not match. Try again.');
      setPin('');
      setSubmitted(false);
      return;
    }
    setSubmitted(true);
    onComplete(pin);
  }, [onComplete, originalPin, pin, submitted]);

  return (
    <div className={styles.pinStage}>
      <div className={`${styles.card} p-4 text-center`}>
        <div className={`${styles.logoMark} ${styles.successTile} mx-auto mb-3`}>
          <ShieldCheck size={28} />
        </div>
        <h2 className="h5 fw-bold mb-2">Confirm PIN</h2>
        <p className="text-muted small mb-4">Enter the same PIN one more time.</p>
        <PinDots value={pin} length={4} />
        {error && <div className="alert alert-danger py-2 small mt-3 mb-0">{error}</div>}
        <div className="mt-4">
          <PinPad onDigit={addDigit} onBackspace={() => setPin((current) => removeLastDigit(current))} disabled={isSaving} />
        </div>
        <button type="button" className="btn btn-link text-decoration-none mt-3" onClick={onBack} disabled={isSaving}>
          Back
        </button>
      </div>
    </div>
  );
}

export default ConfirmPin;
