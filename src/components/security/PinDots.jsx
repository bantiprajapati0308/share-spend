/* eslint-disable react/prop-types */
import styles from './Security.module.scss';

function PinDots({ value, length = 4 }) {
  return (
    <div className={styles.pinDots} aria-label={`${value.length} of ${length} PIN digits entered`}>
      {Array.from({ length }).map((_, index) => (
        <span
          key={index}
          className={`${styles.dot} ${index < value.length ? styles.dotFilled : ''}`}
        />
      ))}
    </div>
  );
}

export default PinDots;
