import React from 'react';
import styles from '../assets/scss/Footer.module.scss'; // Import SCSS for styling

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <p className={styles.contact}>
                    Manage all your trip and party expenses effortlessly. Contact us at:
                    <a href="mailto:bantiprajapati30@gmail.com">bantiprajapati30@gmail.com</a>
                </p>
                <p className={styles.copyright}>Powered by Banti Prajapati &copy; 2024 All Rights Reserved</p>
            </div>
        </footer>
    );
};

export default Footer;