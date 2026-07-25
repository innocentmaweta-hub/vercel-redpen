import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
    if (isConnected) {
        return mongoose.connection;
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set');
    }

    try {
        const conn = await mongoose.connect(mongoUri, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        console.log('✅ MongoDB connected successfully');
        return conn;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        throw error;
    }
}

export function getDB() {
    if (!isConnected) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return mongoose.connection;
}
