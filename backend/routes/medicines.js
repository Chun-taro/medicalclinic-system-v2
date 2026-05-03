const express = require('express');
const router = express.Router();
const {
  getAllMedicines,
  createMedicine,
  dispenseCapsules,
  deductMedicines,
  deleteMedicine,
  getDispenseHistory,
  getAllDispenseHistory,
  generateDispenseHistoryPDF
} = require('../controllers/medicineController');

const { auth, requireRole } = require('../middleware/auth');
const { validateCreateMedicine, validateDispenseMedicine } = require('../middleware/validators');

router.get('/', auth, requireRole('admin', 'doctor', 'superadmin'), getAllMedicines);
router.post('/', auth, requireRole('admin', 'doctor', 'superadmin'), validateCreateMedicine, createMedicine);
router.post('/deduct', auth, requireRole('admin', 'doctor', 'superadmin'), deductMedicines);
router.delete('/:id', auth, requireRole('admin', 'doctor', 'superadmin'), deleteMedicine);
router.post('/:id/dispense', auth, requireRole('admin', 'doctor', 'superadmin'), validateDispenseMedicine, dispenseCapsules);
router.get('/:id/history', auth, requireRole('admin', 'doctor', 'superadmin'), getDispenseHistory);
router.get('/history', auth, requireRole('admin', 'doctor', 'superadmin'), getAllDispenseHistory);
router.get('/history/pdf', generateDispenseHistoryPDF);

module.exports = router;
