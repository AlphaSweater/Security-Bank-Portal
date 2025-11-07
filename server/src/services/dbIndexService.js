import { getDB } from "#config/mongoDBConfig.js";

/**
 * All collection indexes.
 * Keep names stable; MongoDB will skip creating if they already exist.
 */
const INDEX_REGISTRY = {
  users: [
    { key: { email: 1 }, name: "email_unique", unique: true },
    { key: { role: 1 }, name: "role_index" },
    { key: { createdAt: -1 }, name: "created_desc" },
  ],

  transactions: [
    { key: { userId: 1, createdAtEpoch: -1 }, name: "user_created_desc" },
    { key: { status: 1, createdAtEpoch: -1 }, name: "status_created_desc" },
    {
      key: { reviewedBy: 1, createdAtEpoch: -1 },
      name: "reviewer_created_desc",
    },
    {
      key: { createdAtEpoch: -1 },
      name: "pending_created_desc_partial",
      partialFilterExpression: { status: "pending" },
    },
  ],
};

/**
 * Ensures all declared indexes exist (safe to call on every startup).
 */
export async function ensureAllIndexes() {
  const db = getDB();
  console.log("🧩 Ensuring MongoDB indexes...");

  for (const [collectionName, indexes] of Object.entries(INDEX_REGISTRY)) {
    const col = db.collection(collectionName);
    await col.createIndexes(indexes);
    console.log(
      `✅ ${collectionName}: ${indexes.map((i) => i.name).join(", ")}`
    );
  }

  console.log("✨ All indexes ensured successfully!");
}
