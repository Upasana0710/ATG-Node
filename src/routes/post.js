import express from 'express';
import { createPost, getPosts, getPost, updatePost, deletePost, likePost } from '../controllers/post.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/',[verifyToken], createPost);
router.get('/', getPosts);
router.get('/:id', [verifyToken], getPost);
router.patch('/like', [verifyToken], likePost);
router.patch('/:id', [verifyToken], updatePost);
router.delete('/:id', [verifyToken], deletePost);

export default router;
