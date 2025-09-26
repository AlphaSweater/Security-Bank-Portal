/**
 * @typedef {Object} User
 * @property {string|ObjectId} _id - MongoDB ObjectId
 * @property {string} email
 * @property {string} passwordHash
 * @property {"user"|"employee"} role
 * @property {Date} createdAt
 */
import { getDB } from "#config/mongoDBConfig.js";
import { ObjectId } from "mongodb";

const collection = () => getDB().collection("users");

export async function insertUser(doc) {
  return await collection().insertOne(doc);
}

export async function findUserByEmail(email) {
  return await collection().findOne({ email });
}

export async function findUserById(id) {
  return await collection().findOne({ _id: ObjectId.createFromHexString(id) });
}

// ------------------------
// User Document Structure
// ------------------------
// {
//   _id: ObjectId,
//   email: String,
//   passwordHash: String,
//   role: "user" | "employee",
//   createdAt: ISODate
// }
