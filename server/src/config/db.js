import { MongoClient } from "mongodb";
import { getLogger } from "#utils/logger.js";
import process from "process";

const logger = getLogger(import.meta.url);

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGO_DB_NAME;

if (!uri || !dbName) {
  logger.error("MongoDB URI or DB name is not set in environment variables.");
  throw new Error("MongoDB configuration missing");
}

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

async function connectDB() {
  if (db) return db;
  try {
    await client.connect();
    db = client.db(dbName);
    logger.info(`✅ Connected to MongoDB: ${dbName}`);
    return db;
  } catch (mongoError) {
    logger.error(`❌ MongoDB connection error: ${mongoError.message}`);
    throw mongoError;
  }
}

export { client, connectDB };
