import { useState } from 'react';
import AuthLayout from './components/AuthLayout';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import SocialAuthButtons from './components/SocialAuthButtons';
import AuthFooter from './components/AuthFooter';

/**
 * Main Auth module entry point.
 * Manages which auth view is active and owns the shared error state.
 * Replaces the old AuthScreen + Registration components.
 *
 * Views: 'login' | 'register' | 'forgot-password'
 */
export default function AuthModule() {
    const [view, setView] = useState('login');
    const [error, setError] = useState('');

    const switchView = (v) => { setView(v); setError(''); };

    const isRegisterView = view === 'register';
    const showSocial = view !== 'forgot-password';

    return (
        <AuthLayout error={error} onDismissError={() => setError('')}>

            {view === 'login' && (
                <LoginForm
                    onRegister={() => switchView('register')}
                    onForgotPassword={() => switchView('forgot-password')}
                    onError={setError}
                />
            )}

            {view === 'register' && (
                <RegisterForm
                    onLogin={() => switchView('login')}
                    onError={setError}
                />
            )}

            {view === 'forgot-password' && (
                <ForgotPasswordForm onBack={() => switchView('login')} />
            )}

            {showSocial && (
                <>
                    <SocialAuthButtons onError={setError} />
                    <AuthFooter showTerms={isRegisterView} />
                </>
            )}

        </AuthLayout>
    );
}
