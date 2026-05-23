/**
 * Vehicle model — DriveCare
 *
 * Sub-documents (fuelLogs, serviceLogs, documents, ecoLogs) are embedded
 * because they are always fetched with the vehicle and never queried alone.
 * Each sub-document gets its own _id automatically (used as the entry id).
 */
const mongoose = require('mongoose');

// ─── Sub-document schemas ─────────────────────────────────────────────────────

const FuelLogSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: [0.01, 'Amount must be positive'] },
    cost:   { type: Number, required: true, min: [0.01, 'Cost must be positive'] },
    odometer: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const ServiceLogSchema = new mongoose.Schema(
  {
    type:        { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: ['Upcoming', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Upcoming',
    },
    serviceDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const DocumentSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true, trim: true, maxlength: 200 },
    expiryDate: { type: String, trim: true, default: '' }, // stored as YYYY-MM-DD string
    fileUrl:    { type: String, default: '' },
    fileType:   { type: String, default: 'application/pdf' },
  },
  { timestamps: true }
);

const EcoLogSchema = new mongoose.Schema(
  {
    distanceKm:         { type: Number, required: true, min: 0.01 },
    baseEfficiency:     { type: Number, required: true, min: 0.01 },
    improvedEfficiency: { type: Number, required: true, min: 0.01 },
    serviceType:        { type: String, trim: true, default: 'General Service', maxlength: 100 },
    note:               { type: String, trim: true, default: '', maxlength: 500 },
    // Computed fields stored for fast retrieval
    fuelSavedLitres:  { type: Number, default: 0 },
    co2SavedKg:       { type: Number, default: 0 },
    treesEquivalent:  { type: Number, default: 0 },
    kmEquivalent:     { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ─── Main Vehicle schema ──────────────────────────────────────────────────────

const VehicleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    make:         { type: String, required: true, trim: true, maxlength: 100 },
    model:        { type: String, required: true, trim: true, maxlength: 100 },
    year:         { type: Number, default: null, min: 1900, max: 2100 },
    licensePlate: { type: String, trim: true, default: 'Pending', maxlength: 20 },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'Other'],
      default: 'Petrol',
    },
    color:        { type: String, trim: true, default: '', maxlength: 50 },
    isPrimary:    { type: Boolean, default: false },
    healthStatus: {
      type: String,
      enum: ['Healthy', 'Warning', 'Critical'],
      default: 'Healthy',
    },
    battery:      { type: Number, default: 84, min: 0, max: 100 },
    range:        { type: Number, default: 260, min: 0 },
    tirePressure: { type: String, default: 'OK', maxlength: 50 },
    odometer:     { type: Number, default: 0, min: 0 },

    // Service scheduling
    lastServiceDate: { type: Date, default: null },
    nextServiceDue:  { type: Date, default: null },
    nextServiceKm:   { type: Number, default: null, min: 0 },

    fuelLogs:    { type: [FuelLogSchema],    default: [] },
    serviceLogs: { type: [ServiceLogSchema], default: [] },
    documents:   { type: [DocumentSchema],   default: [] },
    ecoLogs:     { type: [EcoLogSchema],     default: [] },
  },
  { timestamps: true }
);

// Virtual `id` for backward compatibility
VehicleSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Virtual `id` on sub-documents
[FuelLogSchema, ServiceLogSchema, DocumentSchema, EcoLogSchema].forEach((s) => {
  s.virtual('id').get(function () { return this._id.toHexString(); });
  s.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => { delete ret._id; delete ret.__v; return ret; },
  });
});

VehicleSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
