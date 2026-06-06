import { useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Button, Form, Alert, Card } from "react-bootstrap";
import { Google, LockFill } from "react-bootstrap-icons";
import styles from "../assets/scss/AuthScreen.module.scss";
import Logo from "../assets/images/logo.png";
import { useNavigate } from "react-router-dom";
import { updateLastLogin } from "../hooks/useUserProfile";
import { authApi } from "../services/api/authApi";
import DatePickerInput from "../utils/DatePickerInput";
import RegisterFields from "./RegisterFields";

const AuthScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [mobile, setMobile] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const navigate = useNavigate();

  // Max DOB = 10 years ago
  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 10);
  const maxDobStr = maxDob.toISOString().split('T')[0];

  const resetRegisterFields = () => {
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
    setMobile("");
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    if (isRegister && !dateOfBirth) {
      setError("Date of Birth is required.");
      return;
    }
    setLoadingAuth(true);
    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;

      if (isRegister) {
        await authApi.register({ email: user.email, firstName, lastName, dateOfBirth: dateOfBirth || null, mobile, authProvider: 'email' });
      } else {
        await updateLastLogin();
      }

      navigate("/daily-expenses");
      setLoadingAuth(false);
    } catch (err) {
      setError(err.message);
      setLoadingAuth(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setLoadingAuth(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in App.jsx will now await ensureUserProfile (profile creation
      // + category seeding) before rendering the app — no extra call needed here.
      setLoadingAuth(false);
      navigate("/daily-expenses");
    } catch (err) {
      setError(err.message);
      setLoadingAuth(false);
    }
  };

  return (
    <div className={styles.authBg}>
      <Card className={styles.authCard}>
        <Card.Body>
          <div className={styles.logoRow}>
            <img src={Logo} alt="Share Spend" className={styles.logoImg} />
            <span className={styles.logoText}>
              Share <span className={styles.brandAccent}>Spend</span>
            </span>
          </div>
          <div className={styles.title}>
            {isRegister ? "Create Account" : "Login"}
          </div>
          <Form onSubmit={handleEmailAuth} className={styles.form}>
            {isRegister && (
              <RegisterFields
                firstName={firstName} setFirstName={setFirstName}
                lastName={lastName} setLastName={setLastName}
                dateOfBirth={dateOfBirth} setDateOfBirth={setDateOfBirth}
                mobile={mobile} setMobile={setMobile}
                maxDobStr={maxDobStr}
              />
            )}
            <Form.Group className={styles.formGroup}>
              <Form.Label className={styles.label}>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
                placeholder="Enter your email"
              />
            </Form.Group>
            <Form.Group className={styles.formGroup}>
              <Form.Label className={styles.label}>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="Enter your password"
              />
            </Form.Group>
            <Button
              type="submit"
              variant="primary"
              className={styles.mainBtn}
              disabled={loadingAuth}
            >
              <LockFill size={18} className="me-2" />
              {loadingAuth
                ? "Please wait..."
                : isRegister
                  ? "Register"
                  : "Login"}
            </Button>
            <Button
              variant="link"
              className={styles.switchBtn}
              onClick={() => { setIsRegister(!isRegister); resetRegisterFields(); setError(""); }}
            >
              {isRegister
                ? "Already have an account? Login"
                : "Don't have an account? Register"}
            </Button>
          </Form>
          <div className={styles.divider}>
            <span>OR</span>
          </div>
          <Button
            className={styles.googleBtn}
            onClick={handleGoogleAuth}
            disabled={loadingAuth}
          >
            <Google size={20} className="me-2" />
            Sign in with Google
          </Button>
          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AuthScreen;
