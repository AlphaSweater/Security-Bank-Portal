import { getDB } from "#config/mongoDBConfig.js";
import { ObjectId } from "mongodb";
import { epochSecondsNow } from "#utils/timeUtil.js";

const collection = () => getDB().collection("transactions");

// Insert a new transaction (expects validated fields)
export async function insertTransaction(doc) {
  // Canonical timestamps: server "now" in UTC epoch seconds
  const createdAtEpoch = epochSecondsNow();
  const statusUpdatedAtEpoch = createdAtEpoch;

  const transaction = {
    ...doc,
    userId: ObjectId.createFromHexString(String(doc.userId)),
    status: "pending",
    createdAtTimeZone: doc.createdAtTimeZone, // IANA zone for display
    createdAtEpoch,
    statusUpdatedAtEpoch,
  };
  return await collection().insertOne(transaction);
}

// Get all transactions for a user (by userId as string)
export async function getTransactionsByUserId(userId) {
  return await collection()
    .find({ userId: ObjectId.createFromHexString(userId) })
    .toArray();
}

// Get all pending transactions
export async function getPendingTransactions() {
  return await collection().find({ status: "pending" }).toArray();
}

// Update transaction status and metadata
export async function updateTransactionStatus(
  id,
  status,
  employeeId,
  reviewReason
) {
  const nowEpoch = epochSecondsNow();
  return await collection().updateOne(
    { _id: ObjectId.createFromHexString(id) },
    {
      $set: {
        status,
        statusUpdatedAtEpoch: nowEpoch,
        reviewedBy: employeeId
          ? ObjectId.createFromHexString(employeeId)
          : null,
        reviewReason: reviewReason ?? null,
      },
    }
  );
}

// Transaction Document (simplified)
// {
//   _id: ObjectId,
//   userId: ObjectId,
//   amount: Number,
//   currencyCode: String, // e.g., "USD"
//   beneficiaryType: "Individual" | "Business",
//   beneficiaryFullName: String,
//   beneficiaryNote?: String,
//   destinationCountryCode: String, // e.g., "US"
//   destinationBankName: String,
//   destinationBankSwift: String,
//   destinationAccountNumber: String,
//   status: "pending" | "approved" | "rejected",
//   createdAtEpoch: Number, // UTC seconds
//   statusUpdatedAtEpoch: Number, // UTC seconds
//   createdAtTimeZone?: String, // IANA zone for display
//   reviewedBy?: ObjectId,
// }
