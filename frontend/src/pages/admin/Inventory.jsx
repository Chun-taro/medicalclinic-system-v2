import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './Style/Inventory.css';

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    quantityInStock: '',
    unit: '',
    expiryDate: ''
  });
  const [dispenseForm, setDispenseForm] = useState({ medId: '', quantity: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  //  Modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [dispenseHistory, setDispenseHistory] = useState([]);
  // History filters
  const [historyNameFilter, setHistoryNameFilter] = useState('');
  const [historyStartDateFilter, setHistoryStartDateFilter] = useState('');
  const [historyEndDateFilter, setHistoryEndDateFilter] = useState('');

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/medicines', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicines(res.data);
    } catch (err) {
      console.error('Error fetching inventory:', err.message);
      setError('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDispenseHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/medicines/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDispenseHistory(res.data);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Error fetching dispense history:', err.message);
      setError('Failed to load dispense history.');
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        quantityInStock: parseInt(form.quantityInStock)
      };

      await axios.post('http://localhost:5000/api/medicines', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setForm({ name: '', quantityInStock: '', unit: '', expiryDate: '' });
      fetchInventory();
    } catch (err) {
      console.error('Error adding medicine:', err.message);
      setError('Failed to add medicine.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated. Please log in.');
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/medicines/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInventory();
    } catch (err) {
      console.error('Error deleting medicine:', err);
      setError('Delete failed.');
    }
  };

  const handleDispense = async e => {
    e.preventDefault();
    if (!dispenseForm.medId || !dispenseForm.quantity) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/medicines/${dispenseForm.medId}/dispense`,
        { quantity: parseInt(dispenseForm.quantity) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Medicine dispensed successfully');
      setDispenseForm({ medId: '', quantity: '' });
      fetchInventory();
    } catch (err) {
      console.error('Error dispensing medicine:', err.message);
      alert('Failed to dispense medicine');
    }
  };

  const handlePrintReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (historyStartDateFilter) params.append('startDate', historyStartDateFilter);
      if (historyEndDateFilter) params.append('endDate', historyEndDateFilter);
      if (historyNameFilter) params.append('medicineName', historyNameFilter);

      const response = await axios.get(`http://localhost:5000/api/medicines/history/pdf?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dispense-history-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error generating PDF:', err.message);
      alert('Failed to generate PDF report');
    }
  };

  const getStatus = medicine => {
    if (medicine.quantityInStock <= 0) return 'Out of Stock';
    if (medicine.expiryDate && new Date(medicine.expiryDate) < new Date()) return 'Expired';
    return 'Available';
  };

  // Filter dispense history
  const filteredDispenseHistory = dispenseHistory.filter(record => {
    // Name filter
    if (historyNameFilter) {
      const q = historyNameFilter.toLowerCase();
      if (!record.medicineName.toLowerCase().includes(q)) return false;
    }

    // Date filters
    if (historyStartDateFilter) {
      const start = new Date(historyStartDateFilter);
      const recordDate = new Date(record.dispensedAt);
      if (recordDate < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
    }
    if (historyEndDateFilter) {
      const end = new Date(historyEndDateFilter);
      const recordDate = new Date(record.dispensedAt);
      if (recordDate > new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)) return false;
    }

    return true;
  });

  return (
    <AdminLayout>
      <div className="inventory-container">
        <h2>Medicine Inventory</h2>
        <p>Track capsules and expiry dates. Dispense to walk-in patients.</p>

        {/*  View History Button */}
        <button className="history-btn" onClick={fetchDispenseHistory}>
          View Dispense History
        </button>

        {/* Add Medicine */}
        <form className="medicine-form" onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Medicine Name" value={form.name} onChange={handleChange} required />
          <input type="number" name="quantityInStock" placeholder="Capsules in Stock" value={form.quantityInStock} onChange={handleChange} required min="0" />
          <input type="text" name="unit" placeholder="Unit (e.g. pcs, bottles)" value={form.unit} onChange={handleChange} required />
          <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} />
          <button type="submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add Medicine'}</button>
        </form>

        {/* Dispense Medicine */}
        <form className="dispense-form" onSubmit={handleDispense}>
          <select value={dispenseForm.medId} onChange={e => setDispenseForm({ ...dispenseForm, medId: e.target.value })} required>
            <option value="">Select Medicine</option>
            {medicines.map(med => (
              <option key={med._id} value={med._id}>
                {med.name} ({med.quantityInStock} left)
              </option>
            ))}
          </select>
          <input type="number" placeholder="Quantity to dispense" value={dispenseForm.quantity} onChange={e => setDispenseForm({ ...dispenseForm, quantity: e.target.value })} required min="1" />
          <button type="submit">Dispense</button>
        </form>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {loading ? (
          <p>Loading inventory...</p>
        ) : medicines.length === 0 ? (
          <p>No medicines found.</p>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Capsules</th>
                <th>Unit</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map(med => (
                <tr key={med._id}>
                  <td>{med.name}</td>
                  <td>{med.quantityInStock}</td>
                  <td>{med.unit}</td>
                  <td>{med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : '—'}</td>
                  <td className={getStatus(med).toLowerCase()}>{getStatus(med)}</td>
                  <td>
                    <button onClick={() => handleDelete(med._id)} className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal for Dispense History */}
        {showHistoryModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Dispense History</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="close-btn" onClick={() => setShowHistoryModal(false)}>Close</button>
                <button onClick={handlePrintReport} style={{ padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Print PDF</button>
              </div>

              {/* History Filters */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search by medicine name..."
                  value={historyNameFilter}
                  onChange={e => setHistoryNameFilter(e.target.value)}
                  style={{ padding: '8px', minWidth: '180px' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  From <input type="date" value={historyStartDateFilter} onChange={e => setHistoryStartDateFilter(e.target.value)} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  To <input type="date" value={historyEndDateFilter} onChange={e => setHistoryEndDateFilter(e.target.value)} />
                </label>
                <button onClick={() => { setHistoryNameFilter(''); setHistoryStartDateFilter(''); setHistoryEndDateFilter(''); }}>Clear</button>
              </div>

              {filteredDispenseHistory.length === 0 ? (
                <p>No dispense records found.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="history-table">
                   <thead>
  <tr>
    <th>Medicine</th>
    <th>Quantity</th>
    <th>Dispensed At</th>
    <th>Source</th>
  </tr>
</thead>
<tbody>
  {filteredDispenseHistory
    .slice()
    .sort((a, b) => new Date(b.dispensedAt) - new Date(a.dispensedAt))
    .map((record, index) => (
      <tr key={index}>
        <td>{record.medicineName}</td>
        <td>{record.quantity}</td>
        <td>{new Date(record.dispensedAt).toLocaleString()}</td>
        <td>{record.source}</td>
      </tr>
    ))}
</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}