import express from 'express';
import { signup, signin, forgotPassword, verifyReset, resetPassword, getUserById } from '../controllers/user.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/forgotPassword', forgotPassword);
router.get('/verifyReset', verifyReset);
router.patch('/resetPassword', resetPassword);
router.get('/:id', [verifyToken], getUserById);

export default router;
