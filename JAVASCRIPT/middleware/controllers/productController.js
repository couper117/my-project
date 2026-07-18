import Product from '../models/Product.js';
import { v2 as cloudinary } from 'cloudinary';

// 1. GET ALL PRODUCTS (With Search & Pagination)
export const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 6, search = "" } = req.query;

        const query = search
            ? { name: { $regex: search, $options: "i" } }
            : {};

        const products = await Product.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await Product.countDocuments(query);

        res.json({
            products,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. SEARCH PRODUCTS (Specific endpoint)
export const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;
        const results = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. GET PRODUCT BY ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. CREATE PRODUCT (Admin Only)
export const createProduct = async (req, res) => {
    try {
        console.log("Create Product Request Body:", req.body);
        const { name, price, category, stock, description, image } = req.body;

        const newProduct = new Product({
            name,
            price,
            category,
            stock,
            description,
            image // Optional image URL if provided
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Create Product Error:', error); res.status(400).json({ message: error.message });
    }
};

// 5. UPDATE PRODUCT
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Not found" });

        Object.assign(product, req.body);
        const updated = await product.save();
        res.json(updated);
    } catch (error) {
        console.error('Update Product Error:', error); res.status(400).json({ message: error.message });
    }
};

// 6. DELETE PRODUCT
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await product.deleteOne();
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
