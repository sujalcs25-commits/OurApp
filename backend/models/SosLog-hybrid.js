/**
 * SosLog model — Hybrid
 */
const mongoose = require('mongoose');
const { isFallbackMode } = require('../config/db');
const fallbackDB = require('../config/db-fallback');

const SosLogSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lat:              { type: Number, required: true },
  lng:              { type: Number, required: true },
  status:           { type: String, enum: ['active', 'stopped'], default: 'active' },
  mapsLink:         { type: String },
  contactsNotified: { type: Array, default: [] },
  stoppedAt:        { type: Date },
}, { timestamps: true });

SosLogSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

SosLogSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const MongooseSosLog = mongoose.model('SosLog', SosLogSchema);

function wrapSosLog(l) {
  if (!l) return null;
  return {
    ...l,
    id: l._id,
    save: async function() {
      return fallbackDB.updateSosLog(this._id, this);
    },
    toJSON: function() {
      const { _id, ...rest } = this;
      return { ...rest, id: _id };
    }
  };
}

class SosLogModel {
  static async find(query) {
    if (isFallbackMode()) {
       const logs = fallbackDB.findSosLogs(query);
       return {
         sort: () => ({
           limit: () => logs.map(wrapSosLog)
         })
       };
    }
    return MongooseSosLog.find(query);
  }

  static async findOne(query) {
    if (isFallbackMode()) {
      return wrapSosLog(store.sosLogs.find(l => {
        for (let key in query) if (l[key] !== query[key]) return false;
        return true;
      }));
    }
    return MongooseSosLog.findOne(query);
  }

  static async create(data) {
    if (isFallbackMode()) {
      return wrapSosLog(fallbackDB.createSosLog(data));
    }
    return MongooseSosLog.create(data);
  }
}

module.exports = SosLogModel;
