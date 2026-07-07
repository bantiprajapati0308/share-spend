/* eslint-disable react/prop-types */
import { useCallback, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { ArrowLeft, Clock, EyeSlash, Lock, ShieldCheck, ShieldLock, Window } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AutoLockSelector, { formatAutoLock } from '../../../components/security/AutoLockSelector';
import ConfirmPin from '../../../components/security/ConfirmPin';
import CreatePin from '../../../components/security/CreatePin';
import SecurityCard from '../../../components/security/SecurityCard';
import { useAppLock } from '../../../hooks/useAppLock';
import styles from '../../../components/security/Security.module.scss';

function PinFlowModal({ show, mode, onHide }) {
  const { enableLock, changePin } = useAppLock();
  const [step, setStep] = useState(mode === 'change' ? 'current' : 'create');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setStep(mode === 'change' ? 'current' : 'create');
    setCurrentPin('');
    setNewPin('');
    setError('');
    onHide();
  };

  const handleComplete = useCallback(async (confirmedPin) => {
    setIsSaving(true);
    setError('');
    try {
      const result = mode === 'change'
        ? await changePin(currentPin, confirmedPin)
        : { success: true, settings: await enableLock(confirmedPin) };

      if (!result.success) {
        setError(result.message || 'Unable to update PIN.');
        setStep(mode === 'change' ? 'current' : 'create');
        return;
      }

      toast.success(mode === 'change' ? 'PIN changed.' : 'App Lock enabled.');
      close();
    } catch (err) {
      setError(err.message || 'Unable to save PIN.');
    } finally {
      setIsSaving(false);
    }
  }, [changePin, currentPin, enableLock, mode]);

  return (
    <Modal show={show} onHide={close} centered>
      <Modal.Body className="p-3">
        {error && <div className="alert alert-danger py-2 small mx-2 mt-2">{error}</div>}
        {step === 'current' && (
          <CreatePin
            title="Enter Current PIN"
            subtitle="Verify your current PIN before changing it."
            onComplete={(pin) => {
              setCurrentPin(pin);
              setStep('create');
            }}
            onCancel={close}
          />
        )}
        {step === 'create' && (
          <CreatePin
            title={mode === 'change' ? 'Create New PIN' : 'Create 4 Digit PIN'}
            subtitle="Use a PIN you can remember but others cannot guess."
            onComplete={(pin) => {
              setNewPin(pin);
              setStep('confirm');
            }}
            onCancel={close}
          />
        )}
        {step === 'confirm' && (
          <ConfirmPin
            originalPin={newPin}
            isSaving={isSaving}
            onBack={() => setStep('create')}
            onComplete={handleComplete}
          />
        )}
      </Modal.Body>
    </Modal>
  );
}

function SecuritySettings() {
  const navigate = useNavigate();
  const { settings, lock, disableLock, updateAutoLock, updatePreferences } = useAppLock();
  const [showPinFlow, setShowPinFlow] = useState(false);
  const [pinFlowMode, setPinFlowMode] = useState('enable');
  const [showAutoLock, setShowAutoLock] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const enabled = Boolean(settings?.enabled);

  const openPinFlow = (mode) => {
    setPinFlowMode(mode);
    setShowPinFlow(true);
  };

  const handleDisable = async () => {
    if (!window.confirm('Disable App Lock for this account?')) return;
    setIsSaving(true);
    try {
      await disableLock();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoLock = async (seconds) => {
    setShowAutoLock(false);
    setIsSaving(true);
    try {
      await updateAutoLock(seconds);
      toast.success('Auto Lock updated.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreference = async (key, value) => {
    setIsSaving(true);
    try {
      await updatePreferences({ [key]: value });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className={styles.pageShell}>
      <div className={styles.settingsWrap}>
        <div className="d-flex align-items-center gap-3 mb-3">
          <button type="button" className="btn btn-light rounded-circle" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="h4 fw-bold mb-0">Security & Privacy</h1>
            <p className="text-muted small mb-0">Protect your ShareSpend data with App Lock.</p>
          </div>
        </div>

        <section className={`${styles.heroCard} mb-3`}>
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <div className={styles.iconTile}>
                <ShieldLock size={28} />
              </div>
              <h2 className="h5 fw-bold mt-3 mb-2">Your data is important</h2>
              <p className="text-muted mb-0">App Lock keeps this device session private with a PIN before finance screens are shown.</p>
            </div>
            <div className="col-md-7">
              <div className="row g-3">
                <div className="col-sm-4">
                  <SecurityCard title="App Lock" subtitle="PIN lock" status={enabled ? 'Enabled' : 'Off'} icon={Lock} />
                </div>
                <div className="col-sm-4">
                  <SecurityCard title="Auto Lock" subtitle={formatAutoLock(settings?.autoLockAfter ?? 60)} icon={Clock} />
                </div>
                <div className="col-sm-4">
                  <SecurityCard title="Refresh Lock" subtitle={settings?.lockOnRefresh ? 'Enabled' : 'Off'} icon={Window} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.card} p-3 p-md-4`}>
          <div className={`${styles.optionRow} mb-3`}>
            <div>
              <div className="fw-bold">Enable App Lock</div>
              <div className="small text-muted">Require a 4 digit PIN before opening the app.</div>
            </div>
            <Form.Check
              type="switch"
              checked={enabled}
              disabled={isSaving}
              onChange={(event) => (event.target.checked ? openPinFlow('enable') : handleDisable())}
              aria-label="Enable App Lock"
            />
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <button type="button" className={`${styles.optionRow} w-100 text-start`} onClick={() => setShowAutoLock(true)} disabled={!enabled || isSaving}>
                <span>
                  <span className="fw-bold d-block">Auto Lock</span>
                  <span className="small text-muted">Lock after inactivity or background time.</span>
                </span>
                <span className="small fw-bold text-primary">{formatAutoLock(settings?.autoLockAfter ?? 60)}</span>
              </button>
            </div>
            <div className="col-md-6">
              <div className={styles.optionRow}>
                <span>
                  <span className="fw-bold d-block">Lock on Browser Refresh</span>
                  <span className="small text-muted">Show the lock screen after reload.</span>
                </span>
                <Form.Check
                  type="switch"
                  checked={Boolean(settings?.lockOnRefresh)}
                  disabled={!enabled || isSaving}
                  onChange={(event) => handlePreference('lockOnRefresh', event.target.checked)}
                  aria-label="Lock on refresh"
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className={styles.optionRow}>
                <span>
                  <span className="fw-bold d-block">Lock on Tab Hidden</span>
                  <span className="small text-muted">Apply background lock when returning.</span>
                </span>
                <Form.Check
                  type="switch"
                  checked={Boolean(settings?.lockOnTabHidden)}
                  disabled={!enabled || isSaving}
                  onChange={(event) => handlePreference('lockOnTabHidden', event.target.checked)}
                  aria-label="Lock on tab hidden"
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className={styles.optionRow}>
                <span>
                  <span className="fw-bold d-block">PIN Status</span>
                  <span className="small text-muted">{enabled ? `${settings?.pinLength || 4} digit PIN configured` : 'No PIN configured'}</span>
                </span>
                <ShieldCheck className={enabled ? 'text-success' : 'text-muted'} size={22} />
              </div>
            </div>
          </div>

          <div className="d-grid gap-2 d-sm-flex mt-4">
            <Button variant="primary" disabled={!enabled || isSaving} onClick={() => openPinFlow('change')}>
              <EyeSlash className="me-2" />
              Change PIN
            </Button>
            <Button variant="outline-primary" disabled={!enabled || isSaving} onClick={lock}>
              <Lock className="me-2" />
              Lock Now
            </Button>
            {enabled && (
              <button type="button" className={`${styles.dangerLink} ms-sm-auto`} onClick={handleDisable} disabled={isSaving}>
                Disable App Lock
              </button>
            )}
          </div>
        </section>
      </div>

      <PinFlowModal show={showPinFlow} mode={pinFlowMode} onHide={() => setShowPinFlow(false)} />
      <AutoLockSelector show={showAutoLock} value={settings?.autoLockAfter ?? 60} onSelect={handleAutoLock} onClose={() => setShowAutoLock(false)} />
    </main>
  );
}

export default SecuritySettings;
