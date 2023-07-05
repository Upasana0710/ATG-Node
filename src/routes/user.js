import express from 'express';
import { signup, signin, forgotPassword, verifyReset, resetPassword } from '../controllers/user.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/forgotPassword', forgotPassword);
router.get('/verifyReset', verifyReset);
router.patch('/resetPassword', resetPassword);

export default router;
