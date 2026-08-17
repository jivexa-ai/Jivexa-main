const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    age: {
      type: Number,
      min: 10,
      max: 120
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: String,
      enum: ['PATIENT', 'DOCTOR', 'PHARMACY', 'AMBULANCE_PARTNER', 'ADMIN'],
      default: 'PATIENT'
    },
    verified: {
      type: Boolean,
      default: true
    },
    otp: {
      type: String
    },
    otpExpiresAt: {
      type: Date
    },
    usage: {
      tokenUsed: {
        type: Number,
        default: 0
      },
      tokenLimit: {
        type: Number,
        default: 10000
      },
      resetAt: {
        type: Date,
        default: () => new Date(Date.now() + 5 * 60 * 60 * 1000)
      },
      totalTokenUsed: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook: Hash password before saving to MongoDB using 12 salt rounds
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Helper method: Match entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return clean sanitized public user profile JSON
userSchema.methods.toAuthJSON = function () {
  return {
    id: this._id,
    name: this.name,
    age: this.age,
    email: this.email,
    role: this.role,
    verified: this.verified,
    usage: this.usage,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
