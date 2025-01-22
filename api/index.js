// const { PORT, mongoDB_URI } = require('./secret');
// const mongoose = require('mongoose');
// const User = require('./models/User')
// const cors = require('cors');
// const bcrypt = require('bcryptjs');
// const express = require('express');
import express, { json } from "express";
import cors from "cors";
import mongoose, { Schema } from "mongoose";
const app = express();
import { PORT, mongoDB_URI } from "./secret.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "./models/User.js";
import PostModel from "./models/Post.js";
import cookieParser from "cookie-parser";
import multer from "multer";
const uploadMiddleware = multer({ dest: "uploads/" });
import fs from "fs";
import path from "path";

const salt = bcrypt.genSaltSync(10);
const secretSalt = "erqwpy49qpcq9839coO";

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);
app.use(express.json());
app.use(cookieParser());

const __dirname = path.resolve();
app.use("/uploads", express.static(__dirname + "/uploads"));

mongoose
  .connect(mongoDB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

console.log("working bebe");

app.get("/", (req, res) => res.json("Server is running!"));

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await UserModel.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (error) {
    res.status(400).json(error);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await UserModel.findOne({ username });
  const passOk = bcrypt.compareSync(password, userDoc.password);
  // res.json(passOk)
  if (passOk) {
    jwt.sign({ username, id: userDoc._id }, secretSalt, {}, (err, token) => {
      if (err) throw err;
      res.cookie("token", token).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json("wrong creds baby");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secretSalt, {}, (error, info) => {
    if (error) throw error;
    res.json(info);
  });
  // res.json(req.cookies);
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("now ok");
});

app.post("/post", uploadMiddleware.single("file"), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const extention = parts[parts.length - 1];
  const newPath = path + "." + extention;
  fs.renameSync(path, newPath);
  // res.json({extention})
  const { token } = req.cookies;

  jwt.verify(token, secretSalt, {}, async (error, info) => {
    if (error) throw error;
    const { title, summary, content } = req.body;
    const postDoc = await PostModel.create({
      title,
      summary,
      content,
      cover: newPath,
      author: info.id,
    });
    res.json(postDoc);
  });

  // res.json({title, summary, content})
});

app.get("/post", async (req, res) => {
  const posts = await PostModel.find()
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .limit(10);
  res.json(posts);
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await PostModel.findById(id).populate("author", ["username"]);
  res.json(postDoc);
});

app.put("/post", uploadMiddleware.single("file"), async (req, res) => {
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const extention = parts[parts.length - 1];
    newPath = path + "." + extention;
    fs.renameSync(path, newPath);
  }
  const { token } = req.cookies;
  jwt.verify(token, secretSalt, {}, async (error, info) => {
    if (error) throw error;
    const { id, title, summary, content } = req.body;
    const postDoc = await PostModel.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);

    if (!isAuthor) {
      return res.status(400).json("invalid author");
    }

    postDoc.set({
      title,
      summary,
      content,
      cover: newPath ? newPath : postDoc.cover,
    });

    await postDoc.save();

    res.json(postDoc);
  });
});

app.listen(PORT, (req, res) => {
  console.log(`running on ${PORT}`);
});
