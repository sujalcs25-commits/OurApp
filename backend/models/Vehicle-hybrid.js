/**
 * Vehicle model — Hybrid (works with MongoDB or fallback)
 */
const mongoose = require('mongoose');
const { isFallbackMode } = require('../config/db');
const fallbackDB = require('../config/db-fallback');

const FuelLogSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  cost:   { type: Number, required: true },
  odometer: { type: Number, default: 0 },
});

const ServiceLogSchema = new mongoose.Schema({
  type: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, default: 'Upcoming' },
  serviceDate: { type: Date, default: Date.now },
});

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  expiryDate: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileType: { type: String, default: 'application/pdf' },
});

const EcoLogSchema = new mongoose.Schema({
  distanceKm: { type: Number, required: true },
  baseEfficiency: { type: Number, required: true },
  improvedEfficiency: { type: Number, required: true },
  serviceType: { type: String, default: 'General Service' },
  fuelSavedLitres: { type: Number, default: 0 },
  co2SavedKg: { type: Number, default: 0 },
  treesEquivalent: { type: Number, default: 0 },
  kmEquivalent: { type: Number, default: 0 },
});

const VehicleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, default: null },
  licensePlate: { type: String, default: 'Pending' },
  fuelType: { type: String, default: 'Petrol' },
  color: { type: String, default: '' },
  isPrimary: { type: Boolean, default: false },
  healthStatus: { type: String, default: 'Healthy' },
  odometer: { type: Number, default: 0 },
  lastServiceDate: { type: Date, default: null },
  nextServiceDue: { type: Date, default: null },
  nextServiceKm: { type: Number, default: null },
  fuelLogs: [FuelLogSchema],
  serviceLogs: [ServiceLogSchema],
  documents: [DocumentSchema],
  ecoLogs: [EcoLogSchema],
});

VehicleSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toHexString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const MongooseVehicle = mongoose.model('Vehicle', VehicleSchema);

function wrapVehicle(v) {
  if (!v) return null;
  const wrapped = {
    ...v,
    id: v._id,
    save: async function() {
      return fallbackDB.updateVehicle(this._id, this);
    },
    toJSON: function() {
      const { _id, ...rest } = this;
      return { ...rest, id: _id };
    }
  };

  // Ensure nested arrays also have 'id' for the frontend
  ['fuelLogs', 'serviceLogs', 'documents', 'ecoLogs'].forEach(key => {
    if (Array.isArray(wrapped[key])) {
      wrapped[key] = wrapped[key].map(item => ({
        ...item,
        id: item.id || item._id
      }));
    }
  });

  return wrapped;
}

class VehicleModel {
  static find(query) {
    if (isFallbackMode()) {
      const results = fallbackDB.findVehicles(query).map(wrapVehicle);
      const mockQuery = Promise.resolve(results);
      mockQuery.sort = () => mockQuery;
      mockQuery.limit = () => mockQuery;
      mockQuery.lean = () => mockQuery;
      return mockQuery;
    }
    return MongooseVehicle.find(query);
  }

  static findOne(query) {
    if (isFallbackMode()) {
      const v = wrapVehicle(fallbackDB.findVehicle(query));
      const mockQuery = Promise.resolve(v);
      mockQuery.lean = () => mockQuery;
      return mockQuery;
    }
    return MongooseVehicle.findOne(query);
  }

  static findById(id) {
    return this.findOne({ _id: id });
  }

  static async create(data) {
    if (isFallbackMode()) {
      return wrapVehicle(fallbackDB.createVehicle(data));
    }
    return MongooseVehicle.create(data);
  }

  static findOneAndDelete(query) {
    if (isFallbackMode()) {
      const v = fallbackDB.findVehicle(query);
      if (v) fallbackDB.deleteVehicle(v._id);
      return Promise.resolve(wrapVehicle(v));
    }
    return MongooseVehicle.findOneAndDelete(query);
  }

  static async updateMany(query, update) {
    if (isFallbackMode()) {
      const vehicles = fallbackDB.findVehicles(query);
      vehicles.forEach(v => fallbackDB.updateVehicle(v._id, update));
      return { modifiedCount: vehicles.length };
    }
    return MongooseVehicle.updateMany(query, update);
  }

  static findOneAndUpdate(query, update, options) {
    if (isFallbackMode()) {
      const v = fallbackDB.findVehicle(query);
      if (!v) return Promise.resolve(null);
      const updated = fallbackDB.updateVehicle(v._id, update);
      return Promise.resolve(wrapVehicle(updated));
    }
    return MongooseVehicle.findOneAndUpdate(query, update, options);
  }
}

module.exports = VehicleModel;
