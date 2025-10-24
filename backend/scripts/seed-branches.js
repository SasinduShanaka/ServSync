import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/db.js';
import Bank from '../models/bank.model.js';
import BankBranch from '../models/bankBranch.model.js';

// Raw list provided; includes province headers. We'll ignore headers and only take place names.
const RAW = `Western Province

Colombo

Dehiwala-Mount Lavinia

Moratuwa

Negombo

Kaduwela

Maharagama

Kesbewa

Kalutara

Panadura

Wattala

Ja-Ela

Kelaniya

Peliyagoda

Gampaha

Homagama

Ragama

Minuwangoda

Nugegoda

Piliyandala

Maharagama

Boralesgamuwa

Homagama

Biyagama

Kelaniya

Kadawatha

Central Province

Kandy

Nuwara Eliya

Matale

Gampola

Hatton

Bandarawela

Balangoda

Kegalle

Nawalapitiya

Ambagamuwa

Southern Province

Galle

Matara

Hambantota

Ratnapura

Ambalangoda

Weligama

Beruwala

Kalutara

Bentota

Hikkaduwa

Unawatuna

Dikwella

Tangalle

Eastern Province

Trincomalee

Batticaloa

Kalmunai

Ampara

Kattankudy

Eravur

Valvettithurai

Point Pedro

Chavakachcheri

Northern Province

Jaffna

Vavuniya

Kilinochchi

Mannar

Mulaittivu

Puttalam

Uva Province

Badulla

Monaragala

Mahiyanganaya

Diyatalawa

Haputale

North Western Province

Kurunegala

Puttalam

Chilaw

Wennappuwa

Kuliyapitiya

Marawila

Madampe

North Central Province

Anuradhapura

Polonnaruwa

Habarana

Dambulla

Kekirawa

Mihintale`;

const PROVINCE_HEADERS = new Set([
  'WESTERN PROVINCE',
  'CENTRAL PROVINCE',
  'SOUTHERN PROVINCE',
  'EASTERN PROVINCE',
  'NORTHERN PROVINCE',
  'UVA PROVINCE',
  'NORTH WESTERN PROVINCE',
  'NORTH CENTRAL PROVINCE'
]);

function parseBranchNames(){
  const lines = RAW.split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => !PROVINCE_HEADERS.has(s.toUpperCase()));
  // De-duplicate by uppercase name
  const seen = new Set();
  const list = [];
  for (const name of lines){
    const key = name.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(name);
  }
  return list;
}

async function main(){
  await connectDB();
  const names = parseBranchNames();
  console.log(`Seeding ${names.length} branch names for each bank...`);

  // Optional filter: set BANK_FILTER env to seed only banks containing this text
  const filter = process.env.BANK_FILTER ? { nameUpper: { $regex: String(process.env.BANK_FILTER).trim().toUpperCase() } } : {};
  const banks = await Bank.find(filter).lean();
  console.log(`Target banks: ${banks.length}`);
  if (!banks.length){
    console.log('No banks found. Seed banks first or adjust BANK_FILTER.');
    process.exit(0);
  }

  for (const bank of banks){
    const ops = names.map((n) => {
      const name = n; // use place name as branch name
      const nameUpper = n.toUpperCase();
      return {
        updateOne: {
          filter: { bank: bank._id, nameUpper },
          update: { $set: { bank: bank._id, name, city: '', active: true } },
          upsert: true
        }
      };
    });
    const result = await BankBranch.bulkWrite(ops, { ordered: false });
    console.log(`Bank ${bank.name}: upserted=${result?.upsertedCount ?? 0}, modified=${result?.modifiedCount ?? 0}`);
  }

  console.log('Branch seeding completed.');
  process.exit(0);
}

main().catch((e)=>{
  console.error('Seed branches failed', e);
  process.exit(1);
});
