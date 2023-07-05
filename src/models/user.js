import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    default: true,
  },
  password: {
    type: String,
    required: true,
  },
  loginAttempts: { 
    type: Number,
    default: 0
  },
  lockUntil: { 
    type: Date,
    default: null
  },
  resetPasswordToken: { 
    type: String,
    default: null
  },
  resetPasswordExpires: { 
    type: Boolean,
    default: false
  },
});

export default mongoose.model('User', userSchema);
