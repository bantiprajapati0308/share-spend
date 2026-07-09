import PropTypes from 'prop-types';
import { PlusLg } from 'react-bootstrap-icons';
import styles from './FloatingActionButton.module.scss';

function FloatingActionButton({
    onClick,
    ariaLabel = 'Add',
    children = null,
    fixed = false,
    expanded = false,
    className = '',
}) {
    const classNames = [
        styles.button,
        fixed ? styles.fixed : '',
        expanded ? styles.expanded : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button type="button" className={classNames} onClick={onClick} aria-label={ariaLabel}>
            {children || <PlusLg size={22} />}
        </button>
    );
}

FloatingActionButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    ariaLabel: PropTypes.string,
    children: PropTypes.node,
    fixed: PropTypes.bool,
    expanded: PropTypes.bool,
    className: PropTypes.string,
};

export default FloatingActionButton;
