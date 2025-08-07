import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'cineScope';

const getRecommendations = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = new MongoClient(mongoUrl);
  const db = client.db(dbName);
  const moviesCollection = db.collection('movies');

  const userPreferences = req.body;

  // Generate movie recommendations based on user preferences
  const recommendations = await moviesCollection.find({
    // Filter movies based on user preferences
  }).toArray();

  res.json(recommendations);
};

export default getRecommendations;