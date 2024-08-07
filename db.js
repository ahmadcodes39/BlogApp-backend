import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const mongooseUri = process.env.MON_ORIGIN;
const connectToMongo = async () => {
  try {
    await mongoose.connect(mongooseUri);
    console.log("Connected to mongo succesfully");
  } catch (error) {
    console.log("Error connected to mongo " + error);
  }
};
export default connectToMongo 
