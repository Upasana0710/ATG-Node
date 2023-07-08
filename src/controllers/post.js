import mongoose from 'mongoose';
import Post from '../models/post.js';
import User from '../models/user.js';
import { validationResult } from 'express-validator';

export const createPost = async (req, res) => {
  try {
    //Validate whether user is authorised
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }
    //Create new post
    const newPost = new Post({ ...req.body, creator: req.user });
    // Save the new post
    await newPost.save();

    await User.findByIdAndUpdate(req.user, {$push: {posts: newPost._id}}, {new:true});

    res.status(201).json(newPost);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const getPosts = async (req, res) => {
    try {
      // Pagination
      const page = parseInt(req.query.page) || 1; // Default page is 1
      const limit = parseInt(req.query.limit) || 10; // Default limit is 10
  
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
  
      const totalPosts = await Post.countDocuments();
  
      const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      };
  
      // Sorting
      const sortField = req.query.sortField || 'createdAt'; // Default sort field is 'createdAt'
      const sortOrder = req.query.sortOrder || 'desc'; // Default sort order is 'desc'
  
      const posts = await Post.find()
        .sort({ [sortField]: sortOrder })
        .skip(startIndex)
        .limit(limit)
        .populate('creator');
  
      res.status(200).json({ posts, pagination });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };


  
