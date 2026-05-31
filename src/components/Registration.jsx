import React, { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Form, Button, Card, Alert, Row, Col } from "react-bootstrap";
import { authApi } from "../services/api/authApi";
import DatePickerInput from "../utils/DatePickerInput";

const Registration = ({ onRegistered }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!dateOfBirth) {
      setError("Date of Birth is required.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      await authApi.register({ email: user.email, firstName, lastName, dateOfBirth: dateOfBirth || null, mobile, authProvider: 'email' });
      setLoading(false);
      onRegistered && onRegistered();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Max DOB = 10 years ago (youngest reasonable user)
  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 10);
  const maxDobStr = maxDob.toISOString().split('T')[0];

  return (
    <Card style={{ maxWidth: 480, margin: "40px auto", padding: "1rem" }}>
      <Card.Body>
        <h4 className="mb-3 text-center">Create Account</h4>
        <Form onSubmit={handleRegister}>
          <Row>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="First name"
                />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Last name"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <DatePickerInput
                  label="Date of Birth"
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  maxDate={maxDobStr}
                  placeholder="DD/MM/YYYY"
                  required
                />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mobile Number</Form.Label>
                <Form.Control
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  placeholder="e.g. +1 234 567 8900"
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </Form.Group>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-100"
          >
            {loading ? "Creating..." : "Register"}
          </Button>
        </Form>
        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default Registration;
