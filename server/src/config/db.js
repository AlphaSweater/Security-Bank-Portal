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
    logger.info("🌐 Attempting to ping DB ...");
    await db.command({ ping: 1 });
    logger.info("🏓 Ping to DB successful!");
    return db;
  } catch (mongoError) {
    logger.error(`❌ MongoDB connection error: ${mongoError.message}`);
    throw mongoError;
  }
}

async function closeDB() {
  try {
    await client.close();
    logger.info("🛑 MongoDB connection closed.");
  } catch (closeError) {
    logger.error(`❌ Error closing MongoDB connection: ${closeError.message}`);
    throw closeError;
  }
}

export { client, connectDB, closeDB };
