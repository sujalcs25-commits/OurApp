/**
 * User model — Hybrid (works with MongoDB or fallback)
 */
const mongoose = require('mongoose');
const { isFallbackMode } = require('../config/db');
const fallbackDB = require('../config/db-fallback');

const EmergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [25, 'Phone number too long'],
    },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: [25, 'Phone number too long'],
    },
    emergencyContacts: {
      type: [EmergencyContactSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: 'Maximum 5 emergency contacts allowed',
      },
    },
  },
  { timestamps: true }
);

UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

const MongooseUser = mongoose.model('User', UserSchema);

// Hybrid wrapper
class UserModel {
  static async findOne(query) {
    if (isFallbackMode()) {
      const user = fallbackDB.findUser(query);
      if (!user) return null;
      return {
        ...user,
        id: user._id,
        toJSON: () => {
          const { _id, passwordHash, ...rest } = user;
          return { ...rest, id: _id };
        }
      };
    }
    return MongooseUser.findOne(query);
  }

  static async findById(id) {
    if (isFallbackMode()) {
      return this.findOne({ _id: id });
    }
    return MongooseUser.findById(id);
  }

  static async create(data) {
    if (isFallbackMode()) {
      const user = fallbackDB.createUser(data);
      return {
        ...user,
        id: user._id,
        toJSON: () => {
          const { _id, passwordHash, ...rest } = user;
          return { ...rest, id: _id };
        }
      };
    }
    return MongooseUser.create(data);
  }

  static async save(user) {
    if (isFallbackMode()) {
      return fallbackDB.updateUser(user._id, user);
    }
    return user.save();
  }
}

module.exports = UserModel;
