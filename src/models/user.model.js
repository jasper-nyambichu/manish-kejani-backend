// src/models/user.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  [true, 'Username is required'],
      unique:    true,
      trim:      true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type:      String,
      minlength: 6,
      select:    false,
    },
    refreshToken: {
      type:   String,
      select: false,
    },
    authProvider: {
      type:    String,
      enum:    ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type:   String,
      sparse: true,
      unique: true,
    },
    isVerified: {
      type:    Boolean,
      default: false,
    },
    verificationToken: {
      type:   String,
      select: false,
    },
    verificationExpiry: {
      type:   Date,
      select: false,
    },
    resetCode: {
      type:   String,
      select: false,
    },
    resetCodeExpiry: {
      type:   Date,
      select: false,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'Product',
      },
    ],
    lastLogin: {
      type: Date,
    },
    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.refreshToken;
        delete ret.verificationToken;
        delete ret.verificationExpiry;
        delete ret.resetCode;
        delete ret.resetCodeExpiry;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;