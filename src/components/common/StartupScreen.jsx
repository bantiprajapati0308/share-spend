import PropTypes from 'prop-types';

function StartupScreen({ message = 'Loading your workspace...' }) {
    return (
        <main
            className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light p-4 text-center"
            aria-busy="true"
            aria-live="polite"
        >
            <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading</span>
            </div>
            <h1 className="h5 mb-2">Share &amp; Spend</h1>
            <p className="text-secondary mb-0">{message}</p>
        </main>
    );
}

StartupScreen.propTypes = {
    message: PropTypes.string,
};

export default StartupScreen;
