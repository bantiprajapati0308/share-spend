const normalizeOperators = (value) => value.replace(/[xX×]/g, '*').replace(/[÷]/g, '/');

const isDigit = (char) => char >= '0' && char <= '9';

class AmountExpressionParser {
    constructor(input) {
        this.input = normalizeOperators(input).replace(/\s+/g, '');
        this.index = 0;
    }

    parse() {
        if (!this.input) {
            throw new Error('Amount is required.');
        }

        const value = this.parseExpression();

        if (this.index !== this.input.length) {
            throw new Error('Invalid amount expression.');
        }

        if (!Number.isFinite(value)) {
            throw new Error('Amount expression produced an invalid number.');
        }

        if (value < 0) {
            throw new Error('Amount cannot be negative.');
        }

        return value;
    }

    current() {
        return this.input[this.index];
    }

    consume() {
        const char = this.input[this.index];
        this.index += 1;
        return char;
    }

    parseExpression() {
        let value = this.parseTerm();

        while (this.current() === '+' || this.current() === '-') {
            const operator = this.consume();
            const right = this.parseTerm();
            value = operator === '+' ? value + right : value - right;
        }

        return value;
    }

    parseTerm() {
        let value = this.parseFactor();

        while (this.current() === '*' || this.current() === '/') {
            const operator = this.consume();
            const right = this.parseFactor();

            if (operator === '/') {
                if (right === 0) {
                    throw new Error('Amount cannot be divided by zero.');
                }
                value /= right;
            } else {
                value *= right;
            }
        }

        return value;
    }

    parseFactor() {
        if (this.current() === '+') {
            this.consume();
            return this.parseFactor();
        }

        if (this.current() === '-') {
            this.consume();
            return -this.parseFactor();
        }

        if (this.current() === '(') {
            this.consume();
            const value = this.parseExpression();
            if (this.current() !== ')') {
                throw new Error('Invalid amount expression.');
            }
            this.consume();
            return value;
        }

        return this.parseNumber();
    }

    parseNumber() {
        const start = this.index;
        let hasDecimal = false;

        while (this.index < this.input.length) {
            const char = this.current();
            if (char === '.') {
                if (hasDecimal) {
                    break;
                }
                hasDecimal = true;
                this.consume();
                continue;
            }

            if (!isDigit(char)) {
                break;
            }

            this.consume();
        }

        if (start === this.index) {
            throw new Error('Invalid amount expression.');
        }

        const value = Number(this.input.slice(start, this.index));
        if (!Number.isFinite(value)) {
            throw new Error('Invalid amount expression.');
        }

        return value;
    }
}

export const evaluateAmountExpression = (value) => {
    const parser = new AmountExpressionParser(String(value ?? ''));
    return parser.parse();
};

export const formatEvaluatedAmount = (value) => {
    const parsedValue = evaluateAmountExpression(value);
    return Number.isInteger(parsedValue) ? String(parsedValue) : String(parsedValue);
};
