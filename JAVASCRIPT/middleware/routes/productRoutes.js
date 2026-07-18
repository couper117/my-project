import express from 'express';
import multer from 'multer';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts
} from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { storage } from '../config/cloudinary.js';

const router = express.Router();
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Product management endpoints
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with pagination and filtering
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Successfully retrieved products
 */
router.get('/', getAllProducts);

router.get('/search', searchProducts);

router.get('/:id', getProductById);

router.post('/', protect, adminOnly, createProduct);

router.put('/:id', protect, adminOnly, updateProduct);

router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;