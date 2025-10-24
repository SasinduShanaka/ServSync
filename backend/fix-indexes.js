// fix-indexes.js - Drop problematic indexes and recreate proper ones
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const appointmentsCollection = db.collection('appointments');
    
    // List current indexes
    console.log('Current indexes on appointments collection:');
    const indexes = await appointmentsCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index)}`);
    });
    
    // Drop the problematic reference_1 index if it exists
    try {
      await appointmentsCollection.dropIndex('reference_1');
      console.log('✓ Dropped reference_1 index');
    } catch (e) {
      console.log('reference_1 index not found or already dropped:', e.message);
    }
    
    // Ensure bookingCode index exists and is unique
    try {
      await appointmentsCollection.createIndex({ bookingCode: 1 }, { unique: true });
      console.log('✓ Created/ensured bookingCode unique index');
    } catch (e) {
      console.log('bookingCode index already exists:', e.message);
    }
    
    console.log('✅ Index fix completed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixIndexes();