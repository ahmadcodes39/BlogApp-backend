import express from "express";
import { body, cookie, validationResult } from "express-validator";
import blogUser from "../Models/user.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();

const validate = [
  body("name")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long"),
  body("password")
    .isLength({ min: 5 })
    .withMessage("Password must be at least 5 characters long"),
  body("email").isEmail().withMessage("Email must be valid"),
];

router.post("/register", validate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const user = await blogUser.findOne({ email });
    if (user) {
      return res
        .status(401)
        .json({ message: "User with this email already exists" });
    }

    const saltRound = Number(process.env.SALTSROUND);
    const salt = await bcrypt.genSalt(saltRound);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = await blogUser.create({
      name,
      email,
      password: hashPassword,
    });
    if (newUser) {
      return res.status(200).json({ message: "User saved successfully" });
    } else {
      return res
        .status(500)
        .json({ message: "User not saved, internal server error" });
    }
  } catch (error) {
    return res.status(501).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const foundUser = await blogUser.findOne({ email });
    if (!foundUser) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }
    const confirmPass = await bcrypt.compare(password, foundUser.password);
    if (!confirmPass) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }
    const payload = {
      id: foundUser._id,
      email: foundUser.email,
      name: foundUser.name,
    };
    const secret = process.env.Secret_Key;
    const token = jwt.sign(payload, secret, { expiresIn: "15d" });
     res.cookie("blogToken", token, {
      httpOnly: true,
      maxAge: 1.296e9,
    });
    // 66b3cb02ba4ccf4699390bbe
    // 66b3cb02ba4ccf4699390bbe
    // 66b2755c70317372e3557206
    return res.status(200).json({
      id: foundUser._id,
      name:foundUser.name
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error " + error });
  }
});

router.post("/forgotPassword", async (req, res) => {
  try {
    const { email } = req.body;
    const foundUser = await blogUser.findOne({ email });
    if (!foundUser) {
      return res
        .status(400)
        .json({ message: "User with this Email not exist" });
    }

    const payload = {
      id: foundUser._id,
      email: foundUser.email,
    };
    const secret = process.env.Secret_Key;
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    var mailOptions = {
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Reset Password Request",
      text: `${process.env.EMAIL_MSG}/${foundUser._id}/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.status(500).json({ message: "Email not sent: " + error });
      } else {
        return res.status(200).json({ message: "Email sent successfully" });
      }
    });
  } catch (error) {
    return res.status(400).json({ message: "forgot password not working" });
  }
});

router.post("/resetPassword/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    jwt.verify(token, process.env.Secret_Key);

    const saltRound = Number(process.env.SALTSROUND);
    const salt = await bcrypt.genSalt(saltRound);
    const hashPassword = await bcrypt.hash(password, salt);

    const response = await blogUser.findByIdAndUpdate(id, {
      password: hashPassword,
    });

    if (response) {
      return res.status(200).json({ message: "Password successfully updated" });
    } else {
      return res.status(500).json({ message: "Password not updated" });
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token expired" });
    } else {
      return res
        .status(500)
        .json({ message: "Internal server error: " + error.message });
    }
  }
});

router.get("/profile", (req, res) => {
  try {
    const token = req.cookies.blogToken;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    jwt.verify(token, process.env.Secret_Key, (err, info) => {
      if (err) {
        console.error("JWT verification failed:", err.message);
        return res.status(401).json({ message: "Invalid token" });
      }

      res.json(info);
    });
  } catch (error) {
    console.error("Server error:", error.message);
    console.log("Cookies:", req.cookies.blogToken);

    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const response = res.clearCookie("blogToken");
    if (response) {
      return res.status(200).json({ message: "User logout successfully" });
    }
    return res.status(400).json({ message: "Fails to logout" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error " + error });
  }
});

export default router;
