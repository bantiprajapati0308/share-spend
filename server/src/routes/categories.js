const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCategories, addCategory, updateCategory, deleteCategory, initializeCategories } = require('../controllers/dailySpends/categoriesController');

router.use(auth);

router.get('/', getCategories);
router.post('/', addCategory);
router.post('/initialize', initializeCategories);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
