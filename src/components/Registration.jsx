import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Form, Button, Card, Alert } from "react-bootstrap";

const Registration = ({ onRegistered }) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            // Store extra info in Firestore
            await setDoc(doc(db, "users", user.uid), {
                username,
                email,
                createdAt: new Date()
            });
            setLoading(false);
            onRegistered && onRegistered();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <Card style={{ maxWidth: 400, margin: "40px auto", padding: "1rem" }}>
            <Card.Body>
                <h4 className="mb-3 text-center">Create Account</h4>
                <Form onSubmit={handleRegister}>
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            placeholder="Enter your username"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </Form.Group>
                    <Button type="submit" variant="primary" disabled={loading} className="w-100">
                        {loading ? "Creating..." : "Register"}
                    </Button>
                </Form>
                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            </Card.Body>
        </Card>
    );
};

export default Registration;