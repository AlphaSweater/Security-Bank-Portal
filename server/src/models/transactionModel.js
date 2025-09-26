import { getDB } from "#config/db.js";
import { ObjectId } from "mongodb";

const collection = () => getDB().collection("transactions");

export async function insertTransaction(doc) {
  return await collection().insertOne(doc);
}

export async function findTransactionsByUserId(userId) {
  return await collection()
    .find({ userId: ObjectId.createFromHexString(userId) })
    .toArray();
}

export async function findPendingTransactions() {
  return await collection().find({ status: "pending" }).toArray();
}

export async function updateTransactionStatus(id, status, employeeId) {
  return await collection().updateOne(
    { _id: ObjectId.createFromHexString(id) },
    {
      $set: {
        status,
        reviewedBy: employeeId
          ? ObjectId.createFromHexString(employeeId)
          : null,
        reviewedAt: new Date(),
      },
    }
  );
}

// ------------------------------
// Transaction Document Structure
// ------------------------------
// {
//   _id: ObjectId,
//   userId: ObjectId (FK to users collection),
//   amount: Number,
//   currency: "ZAR",
//   destination: String,
//   status: "pending" | "approved" | "rejected",
//   createdAt: ISODate,
//   reviewedBy: ObjectId (FK employeeId, nullable),
//   reviewedAt: ISODate (nullable)
// }
