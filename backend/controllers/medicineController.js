const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logActivity = require('../utils/logActivity');
const { optimisticUpdate } = require('../utils/concurrencyControl');

// Get all medicines (admin or superadmin only)
const getAllMedicines = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'doctor' && req.user.role !== 'nurse') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const medicines = await Medicine.find().sort({ name: 1, expiryDate: 1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new medicine
const createMedicine = async (req, res) => {
  try {
    const { name, quantityInStock, unit, expiryDate } = req.body;

    if (!name || !quantityInStock || !unit || !expiryDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const expiry = new Date(expiryDate);
    const startOfDay = new Date(expiry);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(expiry);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existing = await Medicine.findOne({
      name,
      expiryDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existing) {
      existing.quantityInStock += parseInt(quantityInStock);
      existing.available = existing.quantityInStock > 0;
      await existing.save();
      return res.status(200).json(existing);
    }

    const newMedicine = new Medicine({
      name,
      quantityInStock: parseInt(quantityInStock),
      unit,
      expiryDate: expiry,
      available: parseInt(quantityInStock) > 0
    });

    await newMedicine.save();

    // Log the activity
    await logActivity(
      req.user.userId,
      `${req.user.firstName} ${req.user.lastName}`,
      req.user.role,
      'create_medicine',
      'medicine',
      newMedicine._id,
      {
        medicineName: name,
        quantity: quantityInStock,
        unit,
        expiryDate
      }
    );

    res.status(201).json(newMedicine);
  } catch (err) {
    console.error('Create medicine error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Dispense capsules using :id
const dispenseCapsules = async (req, res) => {
  try {
    const { id } = req.params;
    let { quantity, appointmentId, recipientName } = req.body;
    quantity = parseInt(quantity);

    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    // Fetch medicine to check stock
    const med = await Medicine.findById(id);
    if (!med) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    if (med.quantityInStock < quantity) {
      return res.status(400).json({ error: 'Not enough stock' });
    }

    // Update using aggregation pipeline
    const updatedMed = await Medicine.findOneAndUpdate(
      { _id: id },
      [
        {
          $set: {
            quantityInStock: { $subtract: ['$quantityInStock', quantity] },
            version: { $add: ['$version', 1] },
            available: { $gt: [{ $subtract: ['$quantityInStock', quantity] }, 0] }
          }
        }
      ],
      { new: true }
    );

    if (!updatedMed) {
      return res.status(500).json({ error: 'Failed to update medicine' });
    }

    // Log dispense history
    updatedMed.dispenseHistory = updatedMed.dispenseHistory || [];
    updatedMed.dispenseHistory.push({
      appointmentId: appointmentId ? new mongoose.Types.ObjectId(appointmentId) : null,
      quantity,
      dispensedBy: req.user?.userId || req.user?.id || null,
      dispensedAt: new Date(),
      source: appointmentId ? 'consultation' : 'manual',
      recipientName: recipientName || null
    });

    await updatedMed.save();

    // Log the activity
    await logActivity(
      req.user?.userId || req.user?.id,
      req.user?.name || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || 'Admin',
      req.user?.role || 'admin',
      'dispense_medicine',
      'medicine',
      updatedMed._id,
      {
        medicineName: updatedMed.name,
        quantity,
        appointmentId,
        recipientName
      }
    );

    res.json({ message: 'Medicine dispensed', medicine: updatedMed, version: updatedMed.version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Deduct multiple medicines (used in consultation) with pessimistic locking via transaction
const deductMedicines = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { prescribed } = req.body;

    if (!Array.isArray(prescribed)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid prescribed list' });
    }

    const Appointment = mongoose.model('Appointment');

    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.warn('Token decode failed:', err.message);
      }
    }

    for (const item of prescribed) {
      const med = await Medicine.findById(item.medicineId).session(session);
      if (!med) continue;

      const qty = parseInt(item.quantity);
      if (!qty || qty <= 0) {
        console.warn(`Invalid quantity for ${med.name}:`, item.quantity);
        continue;
      }

      if (med.quantityInStock < qty) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: `Not enough stock for ${med.name}` });
      }

      med.quantityInStock -= qty;
      med.available = med.quantityInStock > 0;

      let patientName = null;
      if (item.appointmentId) {
        const app = await Appointment.findById(item.appointmentId).populate('patientId').session(session);
        if (app && app.patientId) {
          patientName = `${app.patientId.firstName} ${app.patientId.lastName}`.trim();
        } else if (app) {
          patientName = `${app.firstName || ''} ${app.lastName || ''}`.trim();
        }
      }

      med.dispenseHistory = med.dispenseHistory || [];
      med.dispenseHistory.push({
        appointmentId: item.appointmentId ? new mongoose.Types.ObjectId(item.appointmentId) : null,
        quantity: qty,
        dispensedBy: userId ? new mongoose.Types.ObjectId(userId) : null,
        dispensedAt: new Date(),
        source: 'consultation',
        recipientName: patientName
      });

      await med.save({ session });

      // Log the activity for each dispensed medicine
      await logActivity(
        userId,
        req.user?.name || `${req.user?.firstName} ${req.user?.lastName}` || 'Unknown',
        req.user?.role || 'admin',
        'dispense_medicine',
        'medicine',
        med._id,
        {
          medicineName: med.name,
          quantity: qty,
          appointmentId: item.appointmentId
        }
      );
    }

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Deduction error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete medicine
const deleteMedicine = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Medicine.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Medicine not found' });

    return res.json({ message: 'Medicine deleted', id });
  } catch (err) {
    console.error('Delete medicine error:', err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get dispense history for a specific medicine
const getDispenseHistory = async (req, res) => {
  try {
    const med = await Medicine.findById(req.params.id)
      .populate('dispenseHistory.appointmentId', 'firstName lastName appointmentDate')
      .populate('dispenseHistory.dispensedBy', 'firstName lastName');

    if (!med) return res.status(404).json({ error: 'Medicine not found' });

    res.json(med.dispenseHistory);
  } catch (err) {
    console.error('Dispense history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

// Get all dispense history across medicines
const getAllDispenseHistory = async (req, res) => {
  try {
    const medicines = await Medicine.find({}, 'name dispenseHistory')
      .populate('dispenseHistory.appointmentId', 'firstName lastName appointmentDate')
      .populate('dispenseHistory.dispensedBy', 'firstName lastName')
      .populate('dispenseHistory.appointmentId.patientId', 'firstName lastName');

    const allHistory = [];

    medicines.forEach(med => {
      med.dispenseHistory.forEach(record => {
        const sourceLabel =
          record.source === 'consultation'
            ? 'consultation dispence'
            : record.source === 'manual'
              ? 'manual dispence'
              : 'Unknown';

        const dispensedByName = record.dispensedBy
          ? `${record.dispensedBy.firstName} ${record.dispensedBy.lastName}`
          : 'Unknown';

        let recipient = record.recipientName || 'Unknown';
        if (!record.recipientName && record.appointmentId) {
          if (record.appointmentId.patientId) {
            recipient = `${record.appointmentId.patientId.firstName} ${record.appointmentId.patientId.lastName}`.trim();
          } else {
            recipient = `${record.appointmentId.firstName || ''} ${record.appointmentId.lastName || ''}`.trim() || 'Unknown';
          }
        }

        allHistory.push({
          medicineName: med.name,
          quantity: record.quantity,
          dispensedAt: record.dispensedAt,
          dispensedBy: dispensedByName,
          appointmentId: record.appointmentId,
          source: sourceLabel,
          recipientName: recipient
        });
      });
    });

    allHistory.sort((a, b) => new Date(b.dispensedAt) - new Date(a.dispensedAt));

    res.json(allHistory);
  } catch (err) {
    console.error('Global dispense history error:', err.message);
    res.status(500).json({ error: 'Failed to fetch global history' });
  }
};

// Generate PDF report for dispense history
const generateDispenseHistoryPDF = async (req, res) => {
  try {
    const { startDate, endDate, medicineName } = req.query;



    // Optional: Defaults or validation if needed. Removed mandatory filter check to allow "Print All".

    const medicines = await Medicine.find({}, 'name dispenseHistory')
      .populate('dispenseHistory.appointmentId', 'firstName lastName appointmentDate')
      .populate('dispenseHistory.dispensedBy', 'firstName lastName');

    const allHistory = [];
    medicines.forEach(med => {
      med.dispenseHistory.forEach(record => {
        if (medicineName && !med.name.toLowerCase().includes(medicineName.toLowerCase())) return;
        if (startDate) {
          const start = new Date(startDate);
          start.setUTCHours(0, 0, 0, 0);
          if (new Date(record.dispensedAt) < start) return;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setUTCHours(23, 59, 59, 999);
          if (new Date(record.dispensedAt) > end) return;
        }

        const sourceLabel =
          record.source === 'consultation'
            ? 'consultation dispence'
            : record.source === 'manual'
              ? 'manual dispence'
              : 'Unknown';

        const dispensedByName = record.dispensedBy
          ? `${record.dispensedBy.firstName} ${record.dispensedBy.lastName}`
          : 'Unknown';

        let recipient = record.recipientName || 'Unknown';
        if (!record.recipientName && record.appointmentId) {
          if (record.appointmentId.patientId) {
            recipient = `${record.appointmentId.patientId.firstName} ${record.appointmentId.patientId.lastName}`.trim();
          } else {
            recipient = `${record.appointmentId.firstName || ''} ${record.appointmentId.lastName || ''}`.trim() || 'Unknown';
          }
        }

        allHistory.push({
          medicineName: med.name,
          quantity: record.quantity,
          dispensedAt: record.dispensedAt,
          dispensedBy: dispensedByName,
          appointmentId: record.appointmentId,
          source: sourceLabel,
          recipientName: recipient
        });
      });
    });

    allHistory.sort((a, b) => new Date(b.dispensedAt) - new Date(a.dispensedAt));
    const reportId = `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const PDFDocument = require('pdfkit');
    const crypto = require('crypto');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers = [];

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=dispense-history-report.pdf');
      res.send(pdfBuffer);
    });

    const primaryColor = '#2563eb'; // Blue-600
    const textColor = '#334155'; // Slate-700
    const lightGray = '#f1f5f9'; // Slate-100
    const borderColor = '#cbd5e1'; // Slate-300

    // Footer helper
    const drawFooter = (pageNumber, totalPages, isLastPage = false) => {
      const pageHeight = doc.page.height;
      const pageWidth = doc.page.width;
      const footerY = pageHeight - 120;

      doc.lineWidth(1).strokeColor(borderColor).moveTo(40, footerY).lineTo(pageWidth - 40, footerY).stroke();

      doc.fillColor('#64748b').fontSize(8);
      doc.text('BukSU Medical Clinic System - Dispense History Report', 40, footerY + 15, { align: 'left' });
      doc.text('Auto-generated confidential report.', pageWidth - 200, footerY + 15, { width: 160, align: 'right' });
      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2 - 50, footerY + 15, { width: 100, align: 'center' });

      if (isLastPage) {
        const uniqueSignatureId = crypto.randomUUID().split('-')[0].toUpperCase();
        const sigBlockLeft = pageWidth - 240;
        const sigBlockY = footerY - 80;

        doc.fillColor(textColor).fontSize(9);
        doc.text('Verified By:', sigBlockLeft, sigBlockY);
        doc.lineWidth(1).strokeColor(textColor).moveTo(sigBlockLeft, sigBlockY + 40).lineTo(sigBlockLeft + 180, sigBlockY + 40).stroke();
        doc.fillColor('#64748b').fontSize(8);
        doc.text('Digital Signature / Validator', sigBlockLeft, sigBlockY + 45);
        doc.text(`UID: ${uniqueSignatureId}`, sigBlockLeft, sigBlockY + 55);
      }
    };

    // Header
    doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('Dispense History Report', 40, 35);
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, 40, 65);
    doc.text(`Report ID: ${reportId}`, doc.page.width - 200, 65, { align: 'right', width: 160 });

    doc.moveDown(4);

    // Filters Section
    if (startDate || endDate || medicineName) {
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Filter Properties:', 40, doc.y);
      doc.moveDown(0.5);
      doc.fillColor(textColor).fontSize(10).font('Helvetica');

      const filterBoxY = doc.y;
      doc.rect(40, filterBoxY, doc.page.width - 80, 50).fillAndStroke(lightGray, borderColor);

      let filterTextX = 50;
      if (startDate) { doc.fillColor(textColor).text(`From: ${new Date(startDate).toLocaleDateString()}`, filterTextX, filterBoxY + 10); filterTextX += 130; }
      if (endDate) { doc.fillColor(textColor).text(`To: ${new Date(endDate).toLocaleDateString()}`, filterTextX, filterBoxY + 10); filterTextX += 130; }
      if (medicineName) { doc.fillColor(textColor).text(`Medicine: ${medicineName}`, filterTextX, filterBoxY + 10); }

      doc.y = filterBoxY + 70;
    }

    // Table
    let pageCount = 1;

    // Define columns
    const columns = [
      { id: 'medicine', header: 'Medicine Name', x: 40, width: 130 },
      { id: 'qty', header: 'Quantity', x: 170, width: 60 },
      { id: 'date', header: 'Dispense Date', x: 230, width: 120 },
      { id: 'source', header: 'Source', x: 350, width: 80 },
      { id: 'recipient', header: 'Recipient', x: 430, width: 120 }
    ];

    const renderTableHeader = () => {
      doc.fillColor(primaryColor).rect(40, doc.y, doc.page.width - 80, 25).fill();
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
      const startY = doc.y - 18;
      columns.forEach(col => {
        doc.text(col.header, col.x + 5, startY, { width: col.width - 10, align: 'left' });
      });
      doc.y = startY + 25;
    };

    if (allHistory.length === 0) {
      doc.moveDown(2);
      doc.fillColor(textColor).fontSize(12).font('Helvetica-Oblique').text('No dispense history records found for the applied filters.', { align: 'center' });
      drawFooter(pageCount, pageCount, true);
    } else {
      renderTableHeader();
      let y = doc.y;
      const footerReserve = 150;
      let rowIndex = 0;

      allHistory.forEach((record, index) => {
        if (y + 30 > doc.page.height - footerReserve) {
          drawFooter(pageCount, '...');
          doc.addPage();
          pageCount++;

          doc.rect(0, 0, doc.page.width, 60).fill(primaryColor);
          doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('Dispense History Report (Cont.)', 40, 25);
          doc.y = 80;
          renderTableHeader();
          y = doc.y;
          rowIndex = 0;
        }

        // Alternating row colors
        if (rowIndex % 2 === 1) {
          doc.rect(40, y, doc.page.width - 80, 25).fill(lightGray);
        }

        doc.fillColor(textColor).fontSize(9).font('Helvetica');
        const textY = y + 8;

        doc.text(record.medicineName, columns[0].x + 5, textY, { width: columns[0].width - 10, height: 15, ellipsis: true });
        doc.text(record.quantity.toString(), columns[1].x + 5, textY, { width: columns[1].width - 10 });
        doc.text(new Date(record.dispensedAt).toLocaleString(), columns[2].x + 5, textY, { width: columns[2].width - 10 });

        // Stylish pills for source
        const sourceLabel = record.source;
        doc.fillColor('#64748b').text(sourceLabel, columns[3].x + 5, textY, { width: columns[3].width - 10 });

        doc.fillColor(textColor).text(record.recipientName, columns[4].x + 5, textY, { width: columns[4].width - 10, height: 15, ellipsis: true });

        // Row border
        doc.lineWidth(0.5).strokeColor(borderColor).moveTo(40, y + 25).lineTo(doc.page.width - 40, y + 25).stroke();

        y += 25;
        rowIndex++;

        if (index === allHistory.length - 1) {
          drawFooter(pageCount, pageCount, true);
        }
      });
    }

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

module.exports = {
  getAllMedicines,
  createMedicine,
  dispenseCapsules,
  deductMedicines,
  deleteMedicine,
  getDispenseHistory,
  getAllDispenseHistory,
  generateDispenseHistoryPDF
};
