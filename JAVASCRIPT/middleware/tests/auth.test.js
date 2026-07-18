import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index.js';
import User from '../models/User.js';

describe('Auth Endpoints', () => {
    beforeAll(async () => {
        // Disconnect any existing connections from index.js
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        // Connect to the Test Database
        const testUri = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/test_db";
        await mongoose.connect(testUri);
        await User.deleteMany();
    });

    afterAll(async () => {
        // Essential: Close connection so Jest can exit
        await mongoose.connection.close();
    });

    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Admin',
                email: 'admin@test.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
    });

    it('should fail login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@test.com',
                password: 'wrongpassword'
            });
        expect(res.statusCode).toEqual(401);
    });
});