/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Eye, EyeSlash, Key } from 'react-bootstrap-icons';
import { useAppLock } from '../../hooks/useAppLock';
import CreatePin from './CreatePin';
import ConfirmPin from './ConfirmPin';
import styles from './Security.module.scss';

function ForgotPinModal({ show, onHide }) {
  const { resetPin } = useAppLock();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('password');
  const [newPin, setNewPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setPassword('');
    setShowPassword(false);
    setStep('password');
    setNewPin('');
    setError('');
    onHide();
  };

  const handleReset = useCallback(async (confirmedPin) => {
    setIsSaving(true);
    setError('');
    try {
      await resetPin(password, confirmedPin);
      close();
    } catch (err) {
      setError(err.code === 'auth/wrong-password' ? 'Password is incorrect.' : err.message || 'Unable to reset PIN.');
      setStep('password');
    } finally {
      setIsSaving(false);
    }
  }, [password, resetPin]);

  return (
    <Modal show={show} onHide={close} centered>
      <Modal.Body className="p-4">
        {step === 'password' && (
          <>
            <div className="text-center mb-4">
              <div className={`${styles.logoMark} mx-auto mb-3`}>
                <Key size={28} />
              </div>
              <h2 className="h5 fw-bold">Verify Your Account</h2>
              <p className="small text-muted mb-0">Enter your Firebase password to reset your PIN.</p>
            </div>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <label className="form-label small fw-semibold">Account Password</label>
            <div className="input-group mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeSlash /> : <Eye />}
              </button>
            </div>
            <button type="button" className="btn btn-primary w-100" onClick={() => setStep('create')} disabled={!password}>
              Verify
            </button>
            <button type="button" className="btn btn-link text-decoration-none w-100 mt-2" onClick={close}>
              Cancel
            </button>
          </>
        )}
        {step === 'create' && (
          <CreatePin
            title="Create New PIN"
            subtitle="Choose a new 4 digit PIN."
            onComplete={(pin) => {
              setNewPin(pin);
              setStep('confirm');
            }}
            onCancel={() => setStep('password')}
          />
        )}
        {step === 'confirm' && (
          <ConfirmPin
            originalPin={newPin}
            isSaving={isSaving}
            onBack={() => setStep('create')}
            onComplete={handleReset}
          />
        )}
      </Modal.Body>
    </Modal>
  );
}

export default ForgotPinModal;
