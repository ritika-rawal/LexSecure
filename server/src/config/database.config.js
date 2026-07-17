import mongoose from 'mongoose';

import { appConfig } from './app.config.js';

export const connectDatabase = async () => {
  if (!appConfig.mongodbUri) {
    throw new Error('MONGODB_URI is required to start the LexSecure API.');
  }

  try {
    const connection = await mongoose.connect(appConfig.mongodbUri);

    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('MongoDB connection failed.');
    throw error;
  }
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};
