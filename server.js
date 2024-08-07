import express from "express";
import connectToMongo from "./db.js";
import router from "./Routes/auth.js";
import cors from 'cors';
import cookieParser from 'cookie-parser'
import postRouter from "./Routes/newPost.js";


connectToMongo(); 
const port = process.env.PORT || 5000;

const app = express();
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));


// routes
app.use('/auth', router);
app.use('/api',postRouter);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
