import React, { useState } from "react";
import { auth, googleProvider } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Button, Form, Alert, Card } from "react-bootstrap";
import { Google, LockFill } from "react-bootstrap-icons";
import styles from "../assets/scss/AuthScreen.module.scss";
import Logo from "../assets/images/logo.png"; // Use your logo
import { Navigate, useNavigate } from "react-router-dom";

const AuthScreen = ({ onRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const navigate = useNavigate();
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingAuth(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate("/share-spend/trip");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/share-spend/trip");
      }
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
      setLoadingAuth(false);
      navigate("/share-spend/trip");
      onLogin && onLogin();
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
            <span className={styles.logoText}>Share <span className={styles.brandAccent}>Spend</span></span>
          </div>
          <div className={styles.title}>{isRegister ? "Create Account" : "Login"}</div>
          <Form onSubmit={handleEmailAuth} className={styles.form}>
            <Form.Group className={styles.formGroup}>
              <Form.Label className={styles.label}>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                onChange={e => setPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="Enter your password"
              />
            </Form.Group>
            <Button type="submit" variant="primary" className={styles.mainBtn} disabled={loadingAuth}>
              <LockFill size={18} className="me-2" />
              {loadingAuth ? "Please wait..." : isRegister ? "Register" : "Login"}
            </Button>
            <Button
              variant="link"
              className={styles.switchBtn}
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
            </Button>
          </Form>
          <div className={styles.divider}><span>OR</span></div>
          <Button
            className={styles.googleBtn}
            onClick={handleGoogleAuth}
            disabled={loadingAuth}
          >
            <Google size={20} className="me-2" />
            Sign in with Google
          </Button>
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AuthScreen;