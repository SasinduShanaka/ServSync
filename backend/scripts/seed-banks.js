import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/db.js';
import Bank from '../models/bank.model.js';

const BANKS = [
  'Amana Bank PLC',
  'Bank of Ceylon',
  'Bank of China Ltd',
  'Cargills Bank PLC',
  'Citibank N.A.',
  'Commercial Bank of Ceylon PLC',
  'Deutsche Bank AG',
  'DFCC Bank PLC',
  'Habib Bank Ltd',
  'Hatton National Bank PLC',
  'Indian Bank',
  'Indian Overseas Bank',
  'MCB Bank Ltd',
  'National Development Bank PLC',
  'Nations Trust Bank PLC',
  'Pan Asia Banking Corporation PLC',
  'People’s Bank',
  'Public Bank Berhad',
  'Sampath Bank PLC',
  'Seylan Bank PLC',
  'Standard Chartered Bank',
  'State Bank of India',
  'Union Bank of Colombo PLC'
];

async function main(){
  await connectDB();
  console.log(`Seeding ${BANKS.length} banks...`);
  const ops = BANKS.map((name) => {
    const nameUpper = String(name).trim().toUpperCase();
    return {
      updateOne: {
        filter: { nameUpper },
        update: { $set: { name, active: true } },
        upsert: true
      }
    };
  });
  const result = await Bank.bulkWrite(ops, { ordered: false });
  console.log('Done:', JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch((e)=>{
  console.error('Seed failed', e);
  process.exit(1);
});
