import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { useUserCategories } from '../hooks/useUserCategories';

function CategorySelectDropdown({
    children,
    value,
    onChange,
    isMulti = false,
    showOnlyEnabled = true,
    placeholder = 'Select a category...'
}) {
    const { fetchCategories, fetchEnabledCategories } = useUserCategories();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = showOnlyEnabled
                ? await fetchEnabledCategories()
                : await fetchCategories();

            // Transform for react-select
            const options = data.map((cat) => ({
                value: cat.id,
                label: `${cat.emoji} ${cat.name}`,
                categoryId: cat.id,
                categoryName: cat.name,
                emoji: cat.emoji,
            }));

            setCategories(options);
        } catch (error) {
            toast.error('Failed to load categories');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

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

    if (loading) {
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
                        options={categories}
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
    showOnlyEnabled: PropTypes.bool,
    placeholder: PropTypes.string,
};

export default CategorySelectDropdown;
