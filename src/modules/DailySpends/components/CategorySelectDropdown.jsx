import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Select from 'react-select';
import useCategoryContext from '../hooks/useCategoryContext';

/**
 * Category Select Dropdown Component
 * Displays categories filtered by transaction type (spend/income)
 * Uses global CategoryContext to avoid fetching on every mount
 * Supports children (like add category button)
 */
function CategorySelectDropdown({
    children,
    value,
    onChange,
    isMulti = false,
    type = 'spend', // 'spend' or 'income' - filter categories by type
    placeholder = 'Select a category...'
}) {
    const { categories, loading, isInitialized } = useCategoryContext();

    // Filter categories by type and enabled status using useMemo for performance
    const filteredCategories = useMemo(() => {
        if (!categories.length) return [];

        return categories
            .filter(cat => cat.isEnabled && cat.type === type)
            .map((cat) => ({
                value: cat.id,
                label: `${cat.emoji} ${cat.name}`,
                categoryId: cat.id,
                categoryName: cat.name,
                emoji: cat.emoji,
            }));
    }, [categories, type]);

    const customStyles = {
        control: (base) => ({
            ...base,
            minHeight: '40px',
            borderRadius: '0.75rem',
            borderColor: '#dee2e6',
            '&:hover': {
                borderColor: '#1e62d0',
            },
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#1e62d0' : state.isFocused ? '#f8f9fa' : 'white',
            color: state.isSelected ? 'white' : '#333',
        }),
    };

    // Show loading state only on first initialization
    if (loading && !isInitialized) {
        return (
            <Form.Group>
                <Form.Label>Category</Form.Label>
                <div className="d-flex align-items-center">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Loading categories...</span>
                </div>
            </Form.Group>
        );
    }

    return (
        <Form.Group>
            <Form.Label>Category</Form.Label>
            <div className='d-flex gap-2 align-items-center justify-content-between'>
                <div className='w-100'>
                    <Select
                        options={filteredCategories}
                        value={value}
                        onChange={onChange}
                        isMulti={isMulti}
                        placeholder={placeholder}
                        styles={customStyles}
                        isClearable={true}
                        isSearchable={true}
                        noOptionsMessage={() => 'No categories available'}
                    />
                </div>
                {children}
            </div>
        </Form.Group>
    );
}

CategorySelectDropdown.propTypes = {
    children: PropTypes.node,
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    isMulti: PropTypes.bool,
    type: PropTypes.oneOf(['spend', 'income']),
    placeholder: PropTypes.string,
};

CategorySelectDropdown.defaultProps = {
    isMulti: false,
    type: 'spend',
    placeholder: 'Select a category...',
};

export default CategorySelectDropdown;
