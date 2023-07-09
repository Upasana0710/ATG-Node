import express from 'express';
import { createComment, getComments, createReply, deleteComment, updateComment } from '../controllers/comment.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/:id', [verifyToken], createComment);
router.get('/:id', getComments);
router.post('/reply/:id', [verifyToken], createReply);
router.patch('/:id', [verifyToken], updateComment);
router.delete('/', [verifyToken], deleteComment)

export default router;
