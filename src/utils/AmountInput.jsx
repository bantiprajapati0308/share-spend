import PropTypes from 'prop-types';
import { evaluateAmountExpression } from './amountExpression';

function AmountInput({
    value,
    onValueChange,
    onInvalidExpression,
    onBlur,
    ...inputProps
}) {
    const handleChange = (event) => {
        onValueChange(event.target.value);
    };

    const handleBlur = (event) => {
        const trimmedValue = String(value ?? '').trim();

        if (trimmedValue) {
            try {
                const evaluatedAmount = evaluateAmountExpression(trimmedValue);
                onValueChange(String(evaluatedAmount));
            } catch (error) {
                onInvalidExpression(error.message || 'Invalid amount expression.');
            }
        }

        if (onBlur) {
            onBlur(event);
        }
    };

    return (
        <input
            {...inputProps}
            type="text"
            inputMode="text"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
        />
    );
}

AmountInput.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onValueChange: PropTypes.func.isRequired,
    onInvalidExpression: PropTypes.func,
    onBlur: PropTypes.func,
};

AmountInput.defaultProps = {
    value: '',
    onInvalidExpression: () => { },
    onBlur: undefined,
};

export default AmountInput;