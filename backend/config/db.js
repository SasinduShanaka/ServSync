import mongoose from 'mongoose';

export const connectDB = async () => {
  // Check if the MongoDB URI is defined
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not defined in environment variables.");
    process.exit(1);  // 1 code kiynne failure ekk 0 means sucess
  }

  try {
    // Try to connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,  // Avoid deprecation warnings
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log the error and exit with failure code
    console.error(`Error: ${error.message}`);
    process.exit(1);  // Exit the process with failure code
  }
};
