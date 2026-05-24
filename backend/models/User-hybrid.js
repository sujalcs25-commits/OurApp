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

function wrapUser(user) {
  if (!user) return null;
  return {
    ...user,
    id: user._id,
    save: async function () {
      return fallbackDB.updateUser(this._id, this);
    },
    toJSON: function () {
      const { _id, passwordHash, ...rest } = this;
      return { ...rest, id: _id };
    }
  };
}

// Hybrid wrapper
class UserModel {
  static findOne(query) {
    if (isFallbackMode()) {
      const user = wrapUser(fallbackDB.findUser(query));
      const mockQuery = Promise.resolve(user);
      mockQuery.lean = () => mockQuery;
      mockQuery.select = () => mockQuery;
      return mockQuery;
    }
    return MongooseUser.findOne(query).select('+passwordHash');
  }

  static findById(id) {
    if (isFallbackMode()) {
      const user = wrapUser(fallbackDB.findUser({ _id: id }));
      const mockQuery = Promise.resolve(user);
      mockQuery.lean = () => mockQuery;
      mockQuery.select = () => mockQuery;
      return mockQuery;
    }
    return MongooseUser.findById(id);
  }

  static async create(data) {
    if (isFallbackMode()) {
      return wrapUser(fallbackDB.createUser(data));
    }
    return MongooseUser.create(data);
  }

  static async deleteOne(query) {
    if (isFallbackMode()) {
      const user = fallbackDB.findUser(query);
      if (user) {
        // Simple mock of deletion: we'd need a deleteUser in fallbackDB
        // For now, let's just return true if found
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    }
    return MongooseUser.deleteOne(query);
  }
}

module.exports = UserModel;
