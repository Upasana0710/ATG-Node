import mongoose from 'mongoose';
import Post from '../models/post.js';
import User from '../models/user.js';
import { encryptData, decryptData, decryptText } from '../middleware/dataEncryption.js';


export const createPost = async (req, res) => {

  try {
    // Validate whether the user is authorized
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }

    const { message, selectedFile, tags } = req.body;

    // Encrypt the post data
    const encryptedMessage = encryptData(message);
    const encryptedSelectedFile = encryptData(selectedFile);
    const encryptedTags = encryptData(tags);

    // Create a new post with encrypted data
    const newPost = new Post({
      message: encryptedMessage,
      selectedFile: encryptedSelectedFile,
      tags: encryptedTags,
      creator: req.user,
    });

    // Save the new post
    await newPost.save();

    // Push the post id into the creator's data
    await User.findByIdAndUpdate(req.user, { $push: { posts: newPost._id } }, { new: true });

    // Decrypt the post data before sending the response
    const decryptedMessage = decryptData(encryptedMessage);
    const decryptedSelectedFile = decryptData(encryptedSelectedFile);
    const decryptedTags = decryptData(encryptedTags);

    res.status(201).json({
      ...newPost.toObject(),
      message: decryptedMessage,
      selectedFile: decryptedSelectedFile,
      tags: decryptedTags,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Pagination
    const page = parseInt(req.query.page) || 1; // Default page is 1
    const limit = parseInt(req.query.limit) || 1; // Default limit is 10

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
      // .sort({ [sortField]: sortOrder })
      .skip(startIndex)
      .limit(limit)
      .populate('creator')
      .populate('likes')
      .populate('comments');

    // Decrypt the post data before sending the response
    const decryptedPosts = posts.map((post) => {
      const [iv, encryptedMessage] = post.message.split(':');
      const decryptedMessage = decryptText(`${iv}:${encryptedMessage}`);

      const [iv2, encryptedSelectedFile] = post.selectedFile.split(':');
      const decryptedSelectedFile = decryptText(`${iv2}:${encryptedSelectedFile}`);

      const decryptedTags = post.tags.map((tag) => {
        const [iv3, encryptedTag] = tag.split(':');
        return decryptText(`${iv3}:${encryptedTag}`);
      });

      return {
        ...post.toObject(),
        message: decryptedMessage,
        selectedFile: decryptedSelectedFile,
        tags: decryptedTags,
      };
    });

    res.status(200).json({ posts: decryptedPosts, pagination });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


export const getPost = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }

    // Find the post by ID
    const post = await Post.findById(id).populate('creator').populate('likes').populate('comments');

    // Handle post not found
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Decrypt the post data
    const decryptedMessage = decryptData(post.message);
    const decryptedSelectedFile = decryptData(post.selectedFile);
    const decryptedTags = decryptData(post.tags);

    // Update the post object with decrypted data
    const decryptedPost = {
      ...post.toObject(),
      message: decryptedMessage,
      selectedFile: decryptedSelectedFile,
      tags: decryptedTags,
    };

    res.status(200).json(decryptedPost);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = req.body;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }

    // Validate the post ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Invalid post ID' });
    }

    // Find the post by ID
    const existingPost = await Post.findById(id);

    // Check if the post exists
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Check if the user is authorized to update the post
    if (existingPost.creator._id.toString() !== req.user) {
      return res.status(403).json({ message: 'Not authorized to update this post.' });
    }

    // Check if the content of req and existing post is the same
    if (
      post.message === existingPost.message &&
      post.selectedFile === existingPost.selectedFile &&
      JSON.stringify(post.tags) === JSON.stringify(existingPost.tags)
    ) {
      return res.status(400).json({ message: 'The provided content is the same as the existing post.' });
    }

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { ...post, id, updatedAt: new Date() },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    //Check if user is authorised
    if (!req.user) return res.json({ message: 'Unauthenticated.' });
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ message: "No post with this id" });
    // Find the specific post
    const existingPost = await Post.findById(id);
    // Check if user is authorised to delete the post
    if (existingPost.creator._id.toString() !== req.user) {
      return res.status(403).json({ message: 'Not authorized to delete this post.' });
    }
    // Post delete
    await Post.findByIdAndRemove(id);

    //Remove the post from the user
    await User.findByIdAndUpdate(
      req.user,
      { $pull: { posts: id } },
      { new: true }
    );

    res.status(200).json({ message: "Deleted succesfully" });
  } catch (error) {
    console.log(error);
    res.json({ message: error.message });
  }

}

export const likePost = async (req, res) => {
  try {
    const postid = req.query.p;
    //Check if user is authorised
    if (!req.user) return res.json({ message: 'Unauthenticated.' });

    if (!mongoose.Types.ObjectId.isValid(req.user))
      return res.status(404).json({ message: 'Invalid post id' });
    // Find the specific post
    const post = await Post.findById(postid);
    if (!post) {
      return res.status(404).json({ message: 'No post found with this id' });
    }
    const user = await User.findById(req.user);
    let updatedPost;
    // If user already likes then pull for dislike else push for like
    if (!post.likes.includes(req.user)) {
      updatedPost = await Post.findByIdAndUpdate(postid, { $push: { likes: req.user } }, { new: true })
    } else {
      updatedPost = await Post.findByIdAndUpdate(postid, { $pull: { likes: req.user } }, { new: true })
    }
    // If post already present in favourites then pull to remove else push to add
    if (!user.favourites.includes(postid)) {
      await User.findByIdAndUpdate(req.user, { $push: { favourites: postid } }, { new: true })
    } else {
      await User.findByIdAndUpdate(req.user, { $pull: { favourites: postid } }, { new: true })
    }

    res.json(updatedPost);
  } catch (error) {
    res.json({ message: error.message });
  }
};




