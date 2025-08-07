import { MongoClient } from 'mongodb';

const url = 'mongodb://localhost:27017';
const dbName = 'cineScope';

const client = new MongoClient(url);

async function connect() {
  await client.connect();
  console.log('Connected to MongoDB');
  const db = client.db(dbName);
  return db;
}

export { connect };