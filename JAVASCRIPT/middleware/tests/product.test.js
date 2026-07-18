import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index.js';

describe('Product Endpoints', () => {

    // 1. Connect to DB before running product tests
    beforeAll(async () => {
        if (mongoose.connection.readyState !== 1) {
            const testUri = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/test_db";
            await mongoose.connect(testUri);
        }
    });

    // 2. Close connection after tests
    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should fetch all products as a guest', async () => {
        const res = await request(app).get('/api/products');

        expect(res.statusCode).toEqual(200);
        // Check if products exists in the body (adjust based on your actual API response)
        expect(res.body).toHaveProperty('products');
        expect(Array.isArray(res.body.products)).toBe(true);
    }, 10000); // 3. Increased timeout to 10 seconds for slow DB responses

    it('should return 401 when a guest tries to create a product', async () => {
        const res = await request(app)
            .post('/api/products')
            .send({ name: 'Test Product', price: 100 });

        expect(res.statusCode).toBe(401);
    });
});