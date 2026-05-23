/**
 * User model — DriveCare
 *
 * Stores account credentials and emergency contacts.
 * Emergency contacts are embedded (max 5) because they are always
 * fetched together with the user and never queried independently.
 */
const mongoose = require('mongoose');

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
      select: false, // never returned in queries by default
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

// Virtual `id` so existing code using user.id keeps working
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash; // never leak hash
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
