import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET
});

// Named export for 'storage'
export const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'supermarket_products',
        allowed_formats: ['jpg', 'png', 'jpeg']
    }
});

// Named export for 'cloudinary' (This is what the error is looking for)
export { cloudinary };