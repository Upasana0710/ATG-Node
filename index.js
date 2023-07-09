import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './src/routes/user.js';
import postRoutes from './src/routes/post.js';
import commentRoutes from './src/routes/comment.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

app.use('/user', userRoutes);
app.use('/post', postRoutes);
app.use('/comment', commentRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.DATABASE_URL)
  .then(() => app.listen(PORT, () => {
    console.log(`Node server is running on port ${PORT}`);
  }))
  .catch((err) => console.log(err));