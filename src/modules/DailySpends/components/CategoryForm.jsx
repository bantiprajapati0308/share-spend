import { useState } from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Form } from 'react-bootstrap';
import { Plus } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import styles from '../styles/DailySpends.module.scss';

function CategoryForm({ onCategoryAdded }) {
    const [categoryName, setCategoryName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('📌');

    const emojiOptions = ['📌', '🎯', '⭐', '🔔', '🎨', '🎭', '🎪', '🎸', '📚', '🏃', '⚽', '🎮', '🍕', '☕', '🎂'];

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!categoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        onCategoryAdded(categoryName.trim(), selectedEmoji);
        setCategoryName('');
        setSelectedEmoji('📌');
    };

    return (
        <div className={styles.addCategorySection}>
            <h5 className={styles.sectionTitle}>Add New Category</h5>
            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Category Name *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g., Groceries, Subscriptions"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                maxLength={30}
                            />
                            <small className={styles.charCounter}>
                                {categoryName.length}/30 characters
                            </small>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Select Emoji</Form.Label>
                            <div className={styles.emojiGrid}>
                                {emojiOptions.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        className={`${styles.emojiBtn} ${selectedEmoji === emoji ? styles.emojiActive : ''}`}
                                        onClick={() => setSelectedEmoji(emoji)}
                                        title={emoji}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </Form.Group>
                    </Col>
                </Row>

                <button type="submit" className={styles.submitCategoryBtn}>
                    <Plus size={18} className="me-2" />
                    Add Category
                </button>
            </Form>
        </div>
    );
}

CategoryForm.propTypes = {
    onCategoryAdded: PropTypes.func.isRequired,
};

export default CategoryForm;
