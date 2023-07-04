import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/user.js'

export const signup = async (req, res) => {
  const { email, password, confirmPassword, username } = req.body;

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(404).json({ message: 'User already exists.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          'Password must have at least 8 characters, including uppercase and lowercase letters, digits, and special characters.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await User.create({ email, password: hashedPassword, username });

    const token = jwt.sign({ email: result.email, id: result._id }, 'test', { expiresIn: '1h' });

    res.status(200).json({ result, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const signin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const MAX_LOGIN_ATTEMPTS=5;
    const LOCK_DURATION=30 * 60 * 1000;
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      return res.status(404).json({ message: "User doesn't exist." });
    }

    // Check if account is locked due to too many failed attempts
    if (existingUser.loginAttempts >= MAX_LOGIN_ATTEMPTS && existingUser.lockUntil > Date.now()) {
      return res.status(401).json({ message: 'Account temporarily locked. Please try again later.' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

    if (!isPasswordCorrect) {
      // Incrementing failed login attempts and lock account if necessary
      existingUser.loginAttempts++;
      if (existingUser.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        existingUser.lockUntil = Date.now() + LOCK_DURATION; // Set lock duration, e.g., 30 minutes
      }
      await existingUser.save();

      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Resetting failed login attempts upon successful login
    existingUser.loginAttempts = 0;
    existingUser.lockUntil = null;
    await existingUser.save();

    const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, 'test', { expiresIn: '1h' });

    res.status(200).json({ result: existingUser, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

