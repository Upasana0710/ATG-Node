import express from 'express';
import { createComment, getComments } from '../controllers/comment.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/:id', [verifyToken], createComment);
router.get('/:id', getComments);

export default router;
