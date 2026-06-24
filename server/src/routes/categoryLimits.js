const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getCategoryLimits, addCategoryLimit, updateCategoryLimit, deleteCategoryLimit } = require('../controllers/dailySpends/categoryLimitsController');

router.use(auth);

router.get('/', getCategoryLimits);
router.post('/', addCategoryLimit);
router.put('/:id', updateCategoryLimit);
router.delete('/:id', deleteCategoryLimit);

module.exports = router;
