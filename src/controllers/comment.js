import mongoose from 'mongoose';
import Comment from '../models/comment.js';
import Post from '../models/post.js';

// Create comment
export const createComment = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthenticated.' });
        }
        const { content } = req.body;
        const postId = req.params.id;

        // Validate the post ID
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(404).json({ message: 'No post with this ID.' });
        }

        const newComment = new Comment({ content: content, creator: req.user });

        await newComment.save();

        // Push the comment in the post data
        const post = await Post.findByIdAndUpdate(
            postId,
            { $push: { comments: newComment._id } },
            { new: true }
        ).populate('comments');

        res.status(200).json(post);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

export const getComments = async (req, res) => {
    try {
        // Get the id of the post
        const { id } = req.params;

        // Find comments of the specific post
        const comments = await Post.findById(id).populate("comments");

        res.status(200).json(comments.comments);

    } catch (error) {
        console.log(error);
        res.status(404).json({ message: error.message });
    }
}

export const createReply = async (req, res) => {
    try {

        // Check if user is authorised
        if (!req.user) return res.json({ message: 'Unauthenticated.' });

        const { content } = req.body;

        const commentId = req.params;
        // Check if id is valid
        if (!mongoose.Types.ObjectId.isValid(commentId)) return res.status(404).json({ message: "No comment with this id" });
        // Create new reply
        const newReply = new Comment({ content: content, creator: req.user });

        await newReply.save();

        const id = new mongoose.Types.ObjectId(commentId);
        //Push the reply to comment
        const comment = await Comment.findByIdAndUpdate(id, { $push: { replies: newReply._id } }, { new: true }).populate('replies');

        res.status(200).json(comment);
    } catch (error) {
        console.log(error);
        res.json({ message: error.message });
    }
}

export const updateComment = async (req, res) => {
    try {
      if (!req.user) {
        return res.json({ message: 'Unauthenticated.' });
      }
  
      const { id } = req.params;
      const { content } = req.body;
  
      // Validate the comment ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ message: 'No comment with this ID.' });
      }
  
      const comment = await Comment.findById(id);
  
      // Check if the comment exists
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found.' });
      }
  
      // Check if the user is authorized to update the comment
      if (comment.creator._id.toString() !== req.user) {
        return res.status(403).json({ message: 'Not authorized to update this comment.' });
      }
  
      // Check if the content is the same
      if (comment.content === content) {
        return res.status(400).json({ message: 'The provided content is the same as the existing comment.' });
      }
  
      // Update the comment content
      comment.content = content;
      const updatedComment = await comment.save();
  
      res.status(200).json(updatedComment);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  };
  



export const deleteComment = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user) return res.json({ message: 'Unauthenticated.' });

        const { postId, commentId } = req.query;
        // Find the specific post
        const post = await Post.findById(postId);

        if (!post) {
            return res.json({ message: 'No post with this ID.' });
        }
        // Find the specidfic comment
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.json({ message: 'Comment does not exist.' });
        }
        // Check if req.user is the creator of the comment
        if (comment.creator._id.toString() !== req.user) {
            return res.status(403).json({ message: 'Not authorized to delete this comment.' });
        }
        //Remove the comment from the post
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { $pull: { comments: commentId } },
            { new: true }
        );
        
        // Delete comment
        await Comment.findByIdAndRemove(commentId);

        res.json(updatedPost);
    } catch (error) {
        console.log(error);
        res.json({ message: error.message });
    }
};
