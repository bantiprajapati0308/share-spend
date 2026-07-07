import { useState } from 'react';
import { securityService } from '../services/security/security.service';

export function usePinVerification(uid) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const verifyPin = async (pin) => {
    setIsVerifying(true);
    setError('');
    try {
      const result = await securityService.verifyPin(uid, pin);
      if (!result.success) setError(result.message || 'Incorrect PIN.');
      return result;
    } catch (err) {
      const message = err.message || 'Unable to verify PIN.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsVerifying(false);
    }
  };

  return { verifyPin, isVerifying, error, setError };
}
