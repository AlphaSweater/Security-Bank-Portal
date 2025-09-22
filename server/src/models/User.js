import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

const collection = () => getDB().collection("users");

export async function insertUser(doc) {
  return await collection().insertOne(doc);
}

export async function findUserByEmail(email) {
  return await collection().findOne({ email });
}

export async function findUserById(id) {
  return await collection().findOne({ _id: new ObjectId(id) });
}
