import express from 'express';
import { createPost, getPosts } from '../controllers/post.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/',[verifyToken], createPost);
router.get('/', getPosts);

export default router;
