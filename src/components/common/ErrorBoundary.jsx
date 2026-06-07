import React from 'react';
import { auth } from '../../firebase';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleLogout = () => {
        auth.signOut().finally(() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h2>Something went wrong 😞</h2>
                    <p>{this.state.error?.message}</p>
                    <button
                        onClick={this.handleLogout}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#ff4d4f',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginTop: '20px'
                        }}
                    >
                        Logout & Go to Login
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
