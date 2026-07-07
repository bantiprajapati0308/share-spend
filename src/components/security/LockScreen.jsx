import { useCallback, useEffect, useState } from 'react';
import { LockFill } from 'react-bootstrap-icons';
import Logo from '../../assets/images/logo.png';
import { useAppLock } from '../../hooks/useAppLock';
import { appendDigit, removeLastDigit } from '../../services/security/pin.service';
import ForgotPinModal from './ForgotPinModal';
import PinDots from './PinDots';
import PinPad from './PinPad';
import styles from './Security.module.scss';

function getRemainingText(lockUntil) {
  if (!lockUntil || lockUntil <= Date.now()) return '';
  const seconds = Math.ceil((lockUntil - Date.now()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function LockScreen() {
  const { settings, verifyPin } = useAppLock();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockUntil, setLockUntil] = useState(settings?.lockUntil || null);
  const [remaining, setRemaining] = useState(getRemainingText(settings?.lockUntil));
  const [showForgotPin, setShowForgotPin] = useState(false);

  const isTemporarilyLocked = lockUntil && lockUntil > Date.now();

  useEffect(() => {
    setLockUntil(settings?.lockUntil || null);
  }, [settings?.lockUntil]);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getRemainingText(lockUntil)), 1000);
    return () => window.clearInterval(timer);
  }, [lockUntil]);

  const submitPin = useCallback(
    async (enteredPin) => {
      if (isTemporarilyLocked) return;
      setIsVerifying(true);
      setError('');
      const result = await verifyPin(enteredPin);
      setIsVerifying(false);
      setPin('');
      if (!result.success) {
        setLockUntil(result.lockUntil || null);
        setError(result.message || 'Incorrect PIN.');
      }
    },
    [isTemporarilyLocked, verifyPin]
  );

  const addDigit = (digit) => {
    setError('');
    setPin((current) => {
      const nextPin = appendDigit(current, digit, 4);
      if (nextPin.length === 4) submitPin(nextPin);
      return nextPin;
    });
  };

  return (
    <div className={styles.lockScreen}>
      <div className={styles.lockPanel}>
        <div className="text-center">
          <img src={Logo} alt="ShareSpend" width="46" height="46" className="mb-2" />
          <h1 className="h4 fw-bold mb-1">Welcome back</h1>
          <p className="text-muted small mb-4">Enter your PIN to continue.</p>
          <div className={`${styles.logoMark} mx-auto mb-4`}>
            <LockFill size={28} />
          </div>
          <PinDots value={pin} length={4} />
          {isTemporarilyLocked && <div className="alert alert-warning py-2 small mt-3 mb-0">Try again in {remaining}</div>}
          {error && !isTemporarilyLocked && <div className="alert alert-danger py-2 small mt-3 mb-0">{error}</div>}
        </div>
        <div className="mt-4">
          <PinPad
            onDigit={addDigit}
            onBackspace={() => setPin((current) => removeLastDigit(current))}
            disabled={isVerifying || isTemporarilyLocked}
          />
        </div>
        <button type="button" className="btn btn-link text-decoration-none w-100 mt-3" onClick={() => setShowForgotPin(true)}>
          Forgot PIN?
        </button>
      </div>
      <ForgotPinModal show={showForgotPin} onHide={() => setShowForgotPin(false)} />
    </div>
  );
}

export default LockScreen;
