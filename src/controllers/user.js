import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

import User from '../models/user.js'

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAILID,
        pass: process.env.PASSWORD
    },
    port: 465,
    host: 'smtp.gmail.com'
});

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

  export const forgotPassword = async (req, res) => {
    const { username } = req.body;
  
    try {
      const existingUser = await User.findOne({ username });
  
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Generate a random reset token
      const resetToken = generateRandomToken();
  
      // Set the reset token and expiration time in the user's document
      existingUser.resetPasswordToken = resetToken;// Token valid for 1 hour (3600000 milliseconds)
      await existingUser.save();
  
      // Construct the reset password link
      const resetLink = `https://node-g6t2.onrender.com/user/verifyReset?id=${existingUser._id}&token=${resetToken}`; // Example reset link URL
  
      // Create the email content
      const emailContent = `
        Hello ${existingUser.username},
  
        You have requested to reset your password. Please click the link below to reset your password:
  
        ${resetLink}
  
        If you did not initiate this request, please ignore this email.
  
        Best regards,
        Your App Team
      `;
      console.log(process.env.EMAILID)

      // Send the password reset email
      let info = await transporter.sendMail({
        from: process.env.EMAILID, // Replace with your email address
        to: existingUser.email,
        subject: 'Password Reset Request',
        text: emailContent,
      });
  
      res.status(200).json(info);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Function to generate a random token
  function generateRandomToken() {
    const tokenBytes = randomBytes(16);
    return tokenBytes.toString('hex');
  }

export const verifyReset = async (req, res) => {
    const id = req.query.id;
    const token = req.query.token;

    try{

        const user = await User.findOne({ _id: id });

        if(user.resetPasswordToken === token){
            user.resetPasswordToken=undefined;
            user.resetPasswordExpires=true;
            await user.save();
        }
        if(user.resetPasswordExpires){
            res.json("You can update your password now.");
        }
    }catch(error){
        res.json({ message: error.message });
    }

}

export const resetPassword = async (req, res) => {
  const { id, password, confirmPassword } = req.body;

  try {
    // Find the user by the reset token and check if it's still valid
    const user = await User.findOne({
      _id: id,
      resetPasswordExpires: true,
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token. Please try again.' });
    }

    // Check if the new password matches the confirmed password
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          'Password must have at least 8 characters, including uppercase and lowercase letters, digits, and special characters.',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password and reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = false;

    // Save the updated user
    await user.save();

    // Generate a new JWT token
    const token = jwt.sign({ email: user.email, id: user._id }, 'test', { expiresIn: '1h' });

    res.status(200).json({ message: 'Password reset successful', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

  

