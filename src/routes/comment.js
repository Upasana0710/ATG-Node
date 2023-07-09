import express from 'express';
import { createComment, getComments, createReply } from '../controllers/comment.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/:id', [verifyToken], createComment);
router.get('/:id', getComments);
router.post('/reply/:id', [verifyToken], createReply);

export default router;
