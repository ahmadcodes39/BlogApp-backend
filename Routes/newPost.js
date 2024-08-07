import express from "express";
import multer from "multer";
import fs from "fs";
import Posts from "../Models/blogPost.js";
import jwt from "jsonwebtoken";

const uploadMiddleware = multer({ dest: "uploads/" });
const postRouter = express.Router();

// collecting post data when user create new post
postRouter.post( "/createPost", uploadMiddleware.single("file"), async (req, res) => {
    try {
      res.json({file:req.file})
      const { originalname, path } = req.file;
      const parts = originalname.split(".");
      const extension = parts[parts.length - 1];
      const newPath = path + "." + extension;
      fs.renameSync(path, newPath);
      const token = req.cookies.blogToken;
      
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }
      
      jwt.verify(token, process.env.Secret_Key, async (err, info) => {
        if (err) {
          console.error("JWT verification failed:", err.message);
          return res.status(401).json({ message: "Invalid token" });
        }
        const { title, summary, content } = req.body;
        const postDoc = await Posts.create({
          title,
          summary,
          content,
          coverImage: newPath,
          author: info.id,
        });
        
        // res.json(postDoc);
      });
    } catch (error) {
      console.error("Server error:", error.message);
      console.log("Cookies:", req.cookies.blogToken);

      return res.status(500).json({ message: "Internal server error" });
    }
  }
);
// getting and displaying all posts on index page
postRouter.get( "/createPost", uploadMiddleware.single("file"), async (req, res) => {
    const post = await Posts.find()
    .sort({ createdAt: -1 })
    .populate('author', ['name'])
    .limit(40);  
    res.json(post);
  }
);

// on successful update page 
postRouter.put("/blogPost/:id",uploadMiddleware.single("file"),async (req, res) => {
    try {
      let newPath = null;
      const { id } = req.params;

      if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split(".");
        const extension = parts[parts.length - 1];
        newPath = path + "." + extension;
        fs.renameSync(path, newPath);
      }

      const token = req.cookies.blogToken;

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      jwt.verify(token, process.env.Secret_Key, async (err, info) => {
        if (err) {
          console.error("JWT verification failed:", err.message);
          return res.status(401).json({ message: "Invalid token" });
        }

        const { title, summary, content } = req.body;
        const postDocs = await Posts.findById(id);

        if (!postDocs) {
          return res.status(404).json({ message: "Post not found" });
        }

        const isAuthor = postDocs.author.toString() === info.id;

        if (!isAuthor) {
          return res
            .status(403)
            .json({ message: "You are not the author of this post" });
        }

        await Posts.findByIdAndUpdate(
          id,
          {
            title,
            summary,
            content,
            coverImage: newPath ? newPath : postDocs.coverImage,
          },
        );

        const updatedPost = await Posts.findById(id);
        res.json(updatedPost);
      });
    } catch (error) {
      console.error("Server error:", error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// getting post when we go to edit post page
postRouter.get("/blogPost/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await Posts.findById(id).populate("author", ["name"]);
    if (response) {
      res.status(200).json(response);
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

postRouter.delete('/blogPost/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await Posts.findByIdAndDelete(id);

    if (response) {
      res.status(200).json({ message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default postRouter;
