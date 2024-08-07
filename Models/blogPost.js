import mongoose, { Schema } from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: String,
    summary: String,
    content: String,
    coverImage: String,
    author: { type: Schema.Types.ObjectId, ref: "blogUser" },
  },
  {
    timestamps: true,
  }
);
const Posts = new mongoose.model("Posts", postSchema);
export default Posts;
