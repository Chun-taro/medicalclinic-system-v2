const express = require('express');
const router = express.Router();
const {
  getAllMedicines,
  createMedicine,
  dispenseCapsules,
  deductMedicines,
  deleteMedicine,
  getDispenseHistory ,
  getAllDispenseHistory,
  generateDispenseHistoryPDF
} = require('../controllers/medicineController');

const { auth } = require('../middleware/auth');

router.get('/', auth, getAllMedicines);
router.post('/', auth, createMedicine);
router.post('/deduct', auth, deductMedicines);
router.delete('/:id', auth, deleteMedicine);
router.post('/:id/dispense', auth, dispenseCapsules);
router.get('/:id/history', auth, getDispenseHistory);
router.get('/history', auth, getAllDispenseHistory);
router.get('/history/pdf', generateDispenseHistoryPDF);

module.exports = router;
