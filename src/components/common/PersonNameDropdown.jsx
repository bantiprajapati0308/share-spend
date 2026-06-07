import { useMemo } from 'react';
import PropTypes from 'prop-types';
import CreatableSelect from 'react-select/creatable';
import { useLendingTransactions } from '../../modules/BorrowLend/hooks/useLendingTransactions';

function PersonNameDropdown({ value, onChange, placeholder = "Select or type person name...", isDisabled = false, className = "" }) {
    const { getUniquePersonNames, loading: lendingLoading } = useLendingTransactions();

    const options = useMemo(() => {
        const personNames = getUniquePersonNames();
        return personNames.map(name => ({
            value: name,
            label: name
        }));
    }, [getUniquePersonNames]);

    const handleChange = (selectedOption) => {
        const personName = selectedOption ? selectedOption.value : '';
        onChange(personName);
    };

    const handleCreate = (inputValue) => {
        const newOption = {
            value: inputValue,
            label: inputValue
        };
        handleChange(newOption);
    };

    const selectedOption = value ? { value, label: value } : null;

    return (
        <CreatableSelect
            isClearable
            isDisabled={isDisabled || lendingLoading}
            isLoading={lendingLoading}
            onChange={handleChange}
            onCreateOption={handleCreate}
            options={options}
            value={selectedOption}
            placeholder={placeholder}
            className={className}
            classNamePrefix="react-select"
            formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
            noOptionsMessage={() => "Type to add a new person"}
            styles={{
                control: (provided, state) => ({
                    ...provided,
                    border: '2px solid #e9ecef',
                    borderRadius: '0.75rem',
                    padding: '0.25rem 0',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    borderColor: state.isFocused ? '#007bff' : '#e9ecef',
                    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : 'none',
                    '&:hover': {
                        borderColor: '#007bff'
                    }
                }),
                menu: (provided) => ({
                    ...provided,
                    zIndex: 10,
                    borderRadius: '0.75rem',
                    boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
                }),
                option: (provided, state) => ({
                    ...provided,
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: state.isSelected
                        ? '#007bff'
                        : state.isFocused
                            ? 'rgba(0, 123, 255, 0.1)'
                            : 'white',
                    color: state.isSelected ? 'white' : '#333'
                }),
                placeholder: (provided) => ({
                    ...provided,
                    color: '#6c757d'
                }),
                singleValue: (provided) => ({
                    ...provided,
                    color: '#495057'
                })
            }}
        />
    );
}

PersonNameDropdown.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    isDisabled: PropTypes.bool,
    className: PropTypes.string
};

export default PersonNameDropdown;