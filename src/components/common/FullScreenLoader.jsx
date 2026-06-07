import React from "react";
import styles from "../../assets/scss/FullScreenLoader.module.scss";

function FullScreenLoader() {
    return (
        <div className={styles.loaderOverlay}>
            <div className={styles.spinner}>
                <div className={styles.doubleBounce1}></div>
                <div className={styles.doubleBounce2}></div>
            </div>
            <div className={styles.loaderText}>Loading...</div>
        </div>
    );
}

export default FullScreenLoader;