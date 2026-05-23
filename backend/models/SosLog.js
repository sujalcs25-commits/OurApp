/**
 * SosLog model — DriveCare
 *
 * Each SOS trigger creates one document.
 * contactsNotified is embedded (snapshot at trigger time).
 */
const mongoose = require('mongoose');

const ContactNotifiedSchema = new mongoose.Schema(
  {
    contactId: { type: String },
    name:      { type: String },
    phone:     { type: String },
    status:    { type: String, enum: ['sent', 'failed', 'skipped'], default: 'skipped' },
    error:     { type: String, default: null },
  },
  { _id: false }
);

const SosLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lat:      { type: Number, required: true },
    lng:      { type: Number, required: true },
    mapsLink: { type: String },
    lastUpdatedAt: { type: Date, default: null },
    contactsNotified: { type: [ContactNotifiedSchema], default: [] },
    status: {
      type: String,
      enum: ['active', 'stopped'],
      default: 'active',
    },
    stoppedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Virtual `id`
SosLogSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

SosLogSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('SosLog', SosLogSchema);
