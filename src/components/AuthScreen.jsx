import React, { useState } from "react";
import { auth, googleProvider } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Button, Form, Alert } from "react-bootstrap";
import styles from "../assets/scss/AuthScreen.module.scss";

const AuthScreen = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin && onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin && onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.title}>{isRegister ? "Register" : "Login"}</div>
      <Form onSubmit={handleEmailAuth}>
        <Form.Group className={styles.formGroup}>
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </Form.Group>
        <Form.Group className={styles.formGroup}>
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </Form.Group>
        <div className={styles.buttonRow}>
          <Button type="submit" variant="primary">
            {isRegister ? "Register" : "Login"}
          </Button>
          <Button variant="secondary" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Go to Login" : "Go to Register"}
          </Button>
        </div>
      </Form>
      <button className={styles.googleBtn} onClick={handleGoogleAuth}>
        Sign in with Google
      </button>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </div>
  );
};

export default AuthScreen;