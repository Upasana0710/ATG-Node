import mongoose from 'mongoose';
import Comment from '../models/comment.js';
import Post from '../models/post.js';

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
    try{
        const {id} = req.params;

        const comments = await Post.findById(id).populate("comments");

        res.status(200).json(comments.comments);

    }catch(error){
        console.log(error);
        res.status(404).json({message: error.message});
    }
} 

export const createReply = async (req, res) => {
    try{
        if(!req.user) return res.json({message: 'Unauthenticated.'});

        const {content} = req.body;

        const commentId = req.params;

        if(!mongoose.Types.ObjectId.isValid(commentId)) return res.status(404).json({message: "No comment with this id"});

        const newReply = new Comment({content: content, creator: req.user });

        await newReply.save();

        const id = new mongoose.Types.ObjectId(commentId);

        const comment = await Comment.findByIdAndUpdate(id, {$push: {replies: newReply._id}}, {new:true}).populate('replies');

        res.status(200).json(comment);
    }catch(error){
        console.log(error);
        res.json({message: error.message});
    }
}
  
