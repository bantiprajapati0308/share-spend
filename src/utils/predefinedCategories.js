/**
 * Category utility helpers — work with the live `categories[]` array fetched from the server.
 *
 * The authoritative list of predefined categories lives in ONE place only:
 *   server/src/controllers/categoriesController.js  →  PREDEFINED_CATEGORIES
 *
 * The server seeds Firestore on first login and returns every category (with
 * `noDeletable`, `isEnable`, `type`, etc.) via GET /api/categories.
 * Never duplicate that list here — derive everything from the fetched data.
 */

/**
 * Returns true if a category's id or name is in the fetched categories list.
 * @param {string} categoryName
 * @param {Array}  categories   — live array from CategoryContext
 */
export const isPredefinedCategory = (categoryName, categories = []) =>
    categories.some(cat => cat.name === categoryName);

/**
 * Returns the category object matching the given name, or null.
 * @param {string} categoryName
 * @param {Array}  categories   — live array from CategoryContext
 */
export const getPredefinedCategory = (categoryName, categories = []) =>
    categories.find(cat => cat.name === categoryName) || null;

/**
 * Filter categories by type ('spend' | 'income').
 * @param {string} type
 * @param {Array}  categories — live array from CategoryContext
 */
export const getCategoriesByType = (type, categories = []) =>
    categories.filter(cat => cat.type === type);


