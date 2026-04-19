const PDFDocument = require('pdfkit');
const { pool } = require('../config/db');
const res_ = require('../utils/response');

// ── Repository helpers ────────────────────────────────────
const getMyCertificates = async (student_id) => {
  const [rows] = await pool.query(
    `SELECT cert.*, c.title AS course_title, u.full_name AS instructor_name,
            usr.full_name AS student_name
     FROM certificates cert
     JOIN courses c ON cert.course_id = c.id
     JOIN users u ON c.instructor_id = u.id
     JOIN users usr ON cert.student_id = usr.id
     WHERE cert.student_id = ?
     ORDER BY cert.issued_at DESC`,
    [student_id]
  );
  return rows;
};

const getCertById = async (id) => {
  const [rows] = await pool.query(
    `SELECT cert.*, c.title AS course_title, u.full_name AS instructor_name,
            usr.full_name AS student_name
     FROM certificates cert
     JOIN courses c ON cert.course_id = c.id
     JOIN users u ON c.instructor_id = u.id
     JOIN users usr ON cert.student_id = usr.id
     WHERE cert.id = ?`,
    [id]
  );
  return rows[0] || null;
};

// ── PDF Generator ──────────────────────────────────────────
const generateCertPDF = (cert, res) => {
  const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 72, right: 72 },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="certificate-${cert.id}.pdf"`
  );
  doc.pipe(res);

  const W = doc.page.width;
  const H = doc.page.height;

  // Background
  doc.rect(0, 0, W, H).fill('#0f172a');

  // Gold border
  doc.rect(20, 20, W - 40, H - 40).lineWidth(3).stroke('#d4af37');
  doc.rect(28, 28, W - 56, H - 56).lineWidth(1).stroke('#d4af37');

  // Title
  doc.fillColor('#d4af37')
    .font('Helvetica-Bold')
    .fontSize(42)
    .text('CERTIFICATE OF COMPLETION', 0, 80, { align: 'center' });

  // Subtitle line
  doc.moveTo(100, 140).lineTo(W - 100, 140).lineWidth(1).stroke('#d4af37');

  // "This is to certify that"
  doc.fillColor('#94a3b8')
    .font('Helvetica')
    .fontSize(16)
    .text('This is to certify that', 0, 160, { align: 'center' });

  // Student name
  doc.fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(36)
    .text(cert.student_name, 0, 190, { align: 'center' });

  // "has successfully completed"
  doc.fillColor('#94a3b8')
    .font('Helvetica')
    .fontSize(16)
    .text('has successfully completed the course', 0, 248, { align: 'center' });

  // Course title
  doc.fillColor('#d4af37')
    .font('Helvetica-Bold')
    .fontSize(26)
    .text(cert.course_title, 0, 278, { align: 'center' });

  // Score
  doc.fillColor('#10b981')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(`Score: ${cert.score}%`, 0, 320, { align: 'center' });

  // Divider
  doc.moveTo(100, 355).lineTo(W - 100, 355).lineWidth(1).stroke('#334155');

  // Footer details
  const dateStr = new Date(cert.issued_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const col1 = 130;
  const col2 = W / 2 + 50;
  const rowY = 375;

  doc.fillColor('#64748b').font('Helvetica').fontSize(12)
    .text('Instructor', col1, rowY)
    .text('Date of Completion', col2, rowY);

  doc.fillColor('#e2e8f0').font('Helvetica-Bold').fontSize(14)
    .text(cert.instructor_name, col1, rowY + 18)
    .text(dateStr, col2, rowY + 18);

  // Certificate ID
  doc.fillColor('#334155').font('Helvetica').fontSize(9)
    .text(`Certificate ID: CERT-${String(cert.id).padStart(6, '0')}`, 0, H - 60, { align: 'center' });

  doc.end();
};

// ── Controller ──────────────────────────────────────────
const certController = {
  getMyCerts: async (req, res, next) => {
    try {
      const data = await getMyCertificates(req.user.id);
      res_.success(res, data);
    } catch(e) { next(e); }
  },

  getById: async (req, res, next) => {
    try {
      const cert = await getCertById(req.params.id);
      if (!cert) return res_.notFound(res, 'Certificate not found');
      if (!req.user.is_super_admin && cert.student_id !== req.user.id)
        return res_.forbidden(res, 'Not your certificate');
      res_.success(res, cert);
    } catch(e) { next(e); }
  },

  download: async (req, res, next) => {
    try {
      const cert = await getCertById(req.params.id);
      if (!cert) return res_.notFound(res, 'Certificate not found');
      if (!req.user.is_super_admin && cert.student_id !== req.user.id)
        return res_.forbidden(res, 'Not your certificate');
      generateCertPDF(cert, res);
    } catch(e) { next(e); }
  },
};

module.exports = certController;
