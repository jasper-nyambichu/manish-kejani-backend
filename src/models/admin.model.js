// src/models/admin.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
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
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: 8,
      select:    false,
    },
    refreshToken: {
      type:   String,
      select: false,
    },
    lastLogin: {
      type: Date,
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
        return ret;
      },
    },
  }
);

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;