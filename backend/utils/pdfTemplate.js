const PDFDocument = require('pdfkit');
const crypto = require('crypto');

/**
 * Reusable PDF Template for Clinic Reports
 */
const createBaseDoc = (title, subtitle = '', options = {}) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4', ...options });
  const buffers = [];

  doc.on('data', chunk => buffers.push(chunk));

  const primaryColor = '#2563eb'; // Blue-600
  const textColor = '#1e293b'; // Slate-800
  const lightGray = '#f8fafc'; // Slate-50
  const borderColor = '#e2e8f0'; // Slate-200

  // Header Background
  doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
  
  // Title
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(title, 40, 35);
  
  // Subtitle / Date
  doc.fontSize(10).font('Helvetica').text(subtitle || `Generated on: ${new Date().toLocaleString()}`, 40, 65);
  
  const reportId = `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  doc.text(`Doc ID: ${reportId}`, doc.page.width - 200, 65, { align: 'right', width: 160 });

  doc.moveDown(4);

  // Helper to draw a section header
  const drawSectionHeader = (text, y) => {
    const currentY = y || doc.y;
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text(text, 40, currentY);
    doc.lineWidth(1.5).strokeColor(primaryColor).moveTo(40, currentY + 15).lineTo(150, currentY + 15).stroke();
    doc.moveDown(1.5);
    return doc.y;
  };

  // Helper to draw a data field (Label: Value)
  const drawField = (label, value, x = 40, y = null, width = 250) => {
    const startY = y || doc.y;
    doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text(label.toUpperCase(), x, startY);
    doc.fillColor(textColor).fontSize(10).font('Helvetica').text(value || 'N/A', x, startY + 12, { width: width });
    return startY + 30;
  };

  // Helper for footer
  const drawFooter = (pageNumber, totalPages) => {
    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;
    const footerY = pageHeight - 60;

    doc.lineWidth(0.5).strokeColor(borderColor).moveTo(40, footerY).lineTo(pageWidth - 40, footerY).stroke();
    doc.fillColor('#94a3b8').fontSize(8).text('BukSU Medical Clinic Management System', 40, footerY + 10);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2 - 50, footerY + 10, { width: 100, align: 'center' });
    doc.text('Confidential Document', pageWidth - 140, footerY + 10, { width: 100, align: 'right' });
  };

  return {
    doc,
    buffers,
    colors: { primaryColor, textColor, lightGray, borderColor },
    helpers: { drawSectionHeader, drawField, drawFooter }
  };
};

module.exports = { createBaseDoc };
