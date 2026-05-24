const express = require('express');
const mongoose = require('mongoose');

const auth    = require('../middleware/authMiddleware');
const Vehicle = require('../models/Vehicle-hybrid');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Carbon Saving Formula
 * ─────────────────────
 * fuelSaved (L) = dist/baseEff − dist/improvedEff
 * co2Saved (kg) = fuelSaved × 2.31   (petrol: 2.31 kg CO₂/L)
 * trees         = co2Saved / 21       (avg tree absorbs 21 kg CO₂/yr)
 * kmEquivalent  = fuelSaved × 12
 */
function calculateCarbonSaving({ distanceKm, baseEfficiency, improvedEfficiency }) {
  const dist     = Number(distanceKm);
  const base     = Number(baseEfficiency);
  const improved = Number(improvedEfficiency);

  if (!dist || !base || !improved || base <= 0 || improved <= 0 || dist <= 0) {
    return { fuelSavedLitres: 0, co2SavedKg: 0, treesEquivalent: 0, kmEquivalent: 0 };
  }

  const fuelSavedLitres = parseFloat((dist / base - dist / improved).toFixed(3));
  const co2SavedKg      = parseFloat((fuelSavedLitres * 2.31).toFixed(2));
  const treesEquivalent = parseFloat((co2SavedKg / 21).toFixed(2));
  const kmEquivalent    = parseFloat((fuelSavedLitres * 12).toFixed(1));

  return { fuelSavedLitres, co2SavedKg, treesEquivalent, kmEquivalent };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VEHICLES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/vehicles
router.get('/', auth, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.user.id });
    res.json(vehicles.map((v) => v.toJSON()));
  } catch (err) {
    console.error('[vehicles/GET]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// GET /api/vehicles/:id  — fetch a single vehicle
router.get('/:id', auth, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid vehicle ID' });
  }
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });
    res.json(vehicle.toJSON());
  } catch (err) {
    console.error('[vehicles/GET/:id]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// POST /api/vehicles
router.post('/', auth, async (req, res) => {
  const { make, model, year, licensePlate, odometer, fuelType, color, lastServiceDate, nextServiceDue, nextServiceKm } = req.body;

  if (!make?.trim() || !model?.trim()) {
    return res.status(400).json({ msg: 'Vehicle make and model are required' });
  }

  const VALID_FUEL = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'Other'];
  if (fuelType && !VALID_FUEL.includes(fuelType)) {
    return res.status(400).json({ msg: `fuelType must be one of: ${VALID_FUEL.join(', ')}` });
  }

  let parsedYear = year ? Number(year) : null;
  if (parsedYear !== null && (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100)) {
    parsedYear = null;
  }
  let parsedOdometer = odometer ? Number(odometer) : 0;
  if (isNaN(parsedOdometer) || parsedOdometer < 0) parsedOdometer = 0;

  let parsedNextServiceKm = nextServiceKm ? Number(nextServiceKm) : null;
  if (parsedNextServiceKm !== null && (isNaN(parsedNextServiceKm) || parsedNextServiceKm < 0)) {
    parsedNextServiceKm = null;
  }

  const parseDateSafe = (d) => {
    if (!d) return null;
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
  };

  try {
    const vehicle = await Vehicle.create({
      userId:          req.user.id,
      make:            make.trim(),
      model:           model.trim(),
      year:            parsedYear,
      licensePlate:    licensePlate?.trim() || 'Pending',
      odometer:        parsedOdometer,
      fuelType:        fuelType || 'Petrol',
      color:           color?.trim() || '',
      lastServiceDate: parseDateSafe(lastServiceDate),
      nextServiceDue:  parseDateSafe(nextServiceDue),
      nextServiceKm:   parsedNextServiceKm,
    });
    res.status(201).json(vehicle.toJSON());
  } catch (err) {
    console.error('[vehicles/POST]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// PUT /api/vehicles/:id  — edit vehicle details
router.put('/:id', auth, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid vehicle ID' });
  }

  const { make, model, year, licensePlate, odometer, fuelType, color, healthStatus, tirePressure, lastServiceDate, nextServiceDue, nextServiceKm } = req.body;

  const VALID_FUEL   = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'Other'];
  const VALID_HEALTH = ['Healthy', 'Warning', 'Critical'];

  if (fuelType   && !VALID_FUEL.includes(fuelType))       return res.status(400).json({ msg: `Invalid fuelType` });
  if (healthStatus && !VALID_HEALTH.includes(healthStatus)) return res.status(400).json({ msg: `Invalid healthStatus` });

  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });

    const parseDateSafe = (d) => {
      if (!d) return null;
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date;
    };

    if (make?.trim())         vehicle.make         = make.trim();
    if (model?.trim())        vehicle.model        = model.trim();
    if (year != null)         vehicle.year         = year ? Number(year) : null;
    if (licensePlate != null) vehicle.licensePlate = licensePlate?.trim() || 'Pending';
    if (odometer != null)     vehicle.odometer     = Number(odometer) || vehicle.odometer;
    if (fuelType)             vehicle.fuelType     = fuelType;
    if (color != null)        vehicle.color        = color?.trim() || '';
    if (healthStatus)         vehicle.healthStatus = healthStatus;
    if (tirePressure != null) vehicle.tirePressure = tirePressure?.trim() || vehicle.tirePressure;
    if (lastServiceDate !== undefined) vehicle.lastServiceDate = parseDateSafe(lastServiceDate);
    if (nextServiceDue  !== undefined) vehicle.nextServiceDue  = parseDateSafe(nextServiceDue);
    if (nextServiceKm   !== undefined) vehicle.nextServiceKm   = nextServiceKm   ? Number(nextServiceKm)     : null;

    await vehicle.save();
    res.json(vehicle.toJSON());
  } catch (err) {
    console.error('[vehicles/PUT]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// DELETE /api/vehicles/:id
router.delete('/:id', auth, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid vehicle ID' });
  }

  try {
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });
    res.json({ msg: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error('[vehicles/DELETE]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// POST /api/vehicles/:id/primary  — set as primary vehicle
router.post('/:id/primary', auth, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid vehicle ID' });
  }

  try {
    // Clear primary flag on all user's vehicles, then set on this one
    await Vehicle.updateMany({ userId: req.user.id }, { isPrimary: false });
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isPrimary: true },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });
    res.json({ msg: 'Primary vehicle updated', vehicle: vehicle.toJSON() });
  } catch (err) {
    console.error('[vehicles/primary]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FUEL LOGS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/vehicles/:id/fuel
router.post('/:id/fuel', auth, async (req, res) => {
  const { amount, cost, odometer } = req.body;

  if (!isValidId(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid vehicle ID' });
  }
  if (amount == null || cost == null) {
    return res.status(400).json({ msg: 'Fuel amount and cost are required' });
  }

  const parsedAmount = Number(amount);
  const parsedCost   = Number(cost);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ msg: 'Amount must be a positive number' });
  }
  if (isNaN(parsedCost) || parsedCost <= 0) {
    return res.status(400).json({ msg: 'Cost must be a positive number' });
  }

  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });

    const currentOdometer = odometer ? Number(odometer) : vehicle.odometer;
    if (currentOdometer > vehicle.odometer) {
      vehicle.odometer = currentOdometer;
    }

    vehicle.fuelLogs.push({ amount: parsedAmount, cost: parsedCost, odometer: currentOdometer });
    await vehicle.save();

    const fuelData = vehicle.fuelLogs[vehicle.fuelLogs.length - 1].toJSON();
    res.json({ msg: 'Fuel log added successfully', fuelData });
  } catch (err) {
    console.error('[vehicles/fuel]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE LOGS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/vehicles/:id/service
router.post('/:id/service', auth, async (req, res) => {
  const { type, description, status, serviceDate } = req.body;

  if (!isValidId(req.params.id)) return res.status(400).json({ msg: 'Invalid vehicle ID' });
  if (!type?.trim()) return res.status(400).json({ msg: 'Service type is required' });

  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });

    const VALID_STATUS = ['Upcoming', 'In Progress', 'Completed', 'Cancelled'];
    const serviceStatus = VALID_STATUS.includes(status) ? status : 'Upcoming';

    vehicle.serviceLogs.push({
      type: type.trim(),
      description: description?.trim() || '',
      status: serviceStatus,
      serviceDate: serviceDate ? new Date(serviceDate) : new Date()
    });
    
    await vehicle.save();
    res.json({ msg: 'Service log added successfully', serviceData: vehicle.serviceLogs[vehicle.serviceLogs.length - 1].toJSON() });
  } catch (err) {
    console.error('[vehicles/service POST]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// PUT /api/vehicles/:id/service/:serviceId
router.put('/:id/service/:serviceId', auth, async (req, res) => {
  const { type, description, status, serviceDate } = req.body;
  
  if (!isValidId(req.params.id) || !isValidId(req.params.serviceId)) {
    return res.status(400).json({ msg: 'Invalid IDs provided' });
  }

  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });

    const log = vehicle.serviceLogs.id(req.params.serviceId);
    if (!log) return res.status(404).json({ msg: 'Service log not found' });

    if (type?.trim()) log.type = type.trim();
    if (description !== undefined) log.description = description?.trim() || '';
    if (status) {
      const VALID_STATUS = ['Upcoming', 'In Progress', 'Completed', 'Cancelled'];
      if (VALID_STATUS.includes(status)) log.status = status;
    }
    if (serviceDate) log.serviceDate = new Date(serviceDate);

    await vehicle.save();
    res.json({ msg: 'Service log updated', serviceData: log.toJSON() });
  } catch (err) {
    console.error('[vehicles/service PUT]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// DELETE /api/vehicles/:id/service/:serviceId
router.delete('/:id/service/:serviceId', auth, async (req, res) => {
  if (!isValidId(req.params.id) || !isValidId(req.params.serviceId)) {
    return res.status(400).json({ msg: 'Invalid IDs provided' });
  }

  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });

    const log = vehicle.serviceLogs.id(req.params.serviceId);
    if (!log) return res.status(404).json({ msg: 'Service log not found' });

    log.deleteOne();
    await vehicle.save();
    res.json({ msg: 'Service log deleted' });
  } catch (err) {
    console.error('[vehicles/service DELETE]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/vehicles/:id/documents
router.post('/:id/documents', auth, async (req, res) => {
  const { title, expiryDate, fileUrl, fileType } = req.body;

  if (!isValidId(req.params.id)) return res.status(400).json({ msg: 'Invalid vehicle ID' });
  if (!title?.trim()) return res.status(400).json({ msg: 'Document title is required' });

  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });

    vehicle.documents.push({ 
      title: title.trim(), 
      expiryDate: expiryDate?.trim() || '',
      fileUrl: fileUrl || '',
      fileType: fileType || 'application/pdf'
    });
    
    await vehicle.save();
    res.json({ msg: 'Document added successfully', documentData: vehicle.documents[vehicle.documents.length - 1].toJSON() });
  } catch (err) {
    console.error('[vehicles/documents POST]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// PUT /api/vehicles/:id/documents/:docId
router.put('/:id/documents/:docId', auth, async (req, res) => {
  const { title, expiryDate, fileUrl, fileType } = req.body;
  
  if (!isValidId(req.params.id) || !isValidId(req.params.docId)) {
    return res.status(400).json({ msg: 'Invalid IDs provided' });
  }

  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });

    const doc = vehicle.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ msg: 'Document not found' });

    if (title?.trim()) doc.title = title.trim();
    if (expiryDate !== undefined) doc.expiryDate = expiryDate?.trim() || '';
    if (fileUrl !== undefined) doc.fileUrl = fileUrl;
    if (fileType !== undefined) doc.fileType = fileType;

    await vehicle.save();
    res.json({ msg: 'Document updated', documentData: doc.toJSON() });
  } catch (err) {
    console.error('[vehicles/documents PUT]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// DELETE /api/vehicles/:id/documents/:docId
router.delete('/:id/documents/:docId', auth, async (req, res) => {
  if (!isValidId(req.params.id) || !isValidId(req.params.docId)) {
    return res.status(400).json({ msg: 'Invalid IDs provided' });
  }

  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });

    const doc = vehicle.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ msg: 'Document not found' });

    doc.deleteOne();
    await vehicle.save();
    res.json({ msg: 'Document deleted' });
  } catch (err) {
    console.error('[vehicles/documents DELETE]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ECO IMPACT
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/vehicles/:id/eco
router.post('/:id/eco', auth, async (req, res) => {
  const { distanceKm, baseEfficiency, improvedEfficiency, serviceType, note } = req.body;

  if (!isValidId(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid vehicle ID' });
  }
  if (!distanceKm || !baseEfficiency || !improvedEfficiency) {
    return res.status(400).json({ msg: 'distanceKm, baseEfficiency, and improvedEfficiency are required' });
  }
  if (Number(baseEfficiency) <= 0 || Number(improvedEfficiency) <= 0 || Number(distanceKm) <= 0) {
    return res.status(400).json({ msg: 'All numeric values must be positive' });
  }
  if (Number(improvedEfficiency) <= Number(baseEfficiency)) {
    return res.status(400).json({ msg: 'improvedEfficiency must be greater than baseEfficiency' });
  }

  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });

    const impact = calculateCarbonSaving({ distanceKm, baseEfficiency, improvedEfficiency });

    vehicle.ecoLogs.push({
      distanceKm:         Number(distanceKm),
      baseEfficiency:     Number(baseEfficiency),
      improvedEfficiency: Number(improvedEfficiency),
      serviceType:        serviceType?.trim() || 'General Service',
      note:               note?.trim() || '',
      ...impact,
    });
    await vehicle.save();

    const ecoEntry = vehicle.ecoLogs[vehicle.ecoLogs.length - 1].toJSON();

    const totals = vehicle.ecoLogs.reduce(
      (acc, e) => ({
        totalCo2Saved:  parseFloat((acc.totalCo2Saved  + (e.co2SavedKg      || 0)).toFixed(2)),
        totalTrees:     parseFloat((acc.totalTrees     + (e.treesEquivalent || 0)).toFixed(2)),
        totalFuelSaved: parseFloat((acc.totalFuelSaved + (e.fuelSavedLitres || 0)).toFixed(3)),
      }),
      { totalCo2Saved: 0, totalTrees: 0, totalFuelSaved: 0 }
    );

    const ecoScore = Math.min(
      100,
      vehicle.ecoLogs.length * 10 + (vehicle.serviceLogs?.length || 0) * 5
    );

    res.json({ msg: 'Eco impact logged successfully', ecoEntry, totals, ecoScore });
  } catch (err) {
    console.error('[vehicles/eco POST]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// GET /api/vehicles/:id/eco
router.get('/:id/eco', auth, async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid vehicle ID' });
  }

  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user.id });
    if (!vehicle) return res.status(404).json({ msg: 'Vehicle not found' });

    const ecoLogs = vehicle.ecoLogs.map((e) => e.toJSON());

    const totals = ecoLogs.reduce(
      (acc, e) => ({
        totalCo2Saved:  parseFloat((acc.totalCo2Saved  + (e.co2SavedKg      || 0)).toFixed(2)),
        totalTrees:     parseFloat((acc.totalTrees     + (e.treesEquivalent || 0)).toFixed(2)),
        totalFuelSaved: parseFloat((acc.totalFuelSaved + (e.fuelSavedLitres || 0)).toFixed(3)),
      }),
      { totalCo2Saved: 0, totalTrees: 0, totalFuelSaved: 0 }
    );

    const ecoScore = Math.min(
      100,
      ecoLogs.length * 10 + (vehicle.serviceLogs?.length || 0) * 5
    );

    let badge = null;
    if (ecoScore >= 80)      badge = { label: 'Eco Champion 🏆', color: '#004f53' };
    else if (ecoScore >= 50) badge = { label: 'Green Driver 🌿',  color: '#1a6b2f' };
    else if (ecoScore >= 20) badge = { label: 'Eco Starter 🌱',   color: '#2e7d32' };

    res.json({ ecoLogs, totals, ecoScore, badge });
  } catch (err) {
    console.error('[vehicles/eco GET]', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
