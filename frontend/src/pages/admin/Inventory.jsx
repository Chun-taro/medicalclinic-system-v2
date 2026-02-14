import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
    Package, Plus, Trash2, Search, Filter, History, Printer,
    AlertTriangle, Check, X, FileText
} from 'lucide-react';
import './Inventory.css';

const Inventory = () => {
    const [medicines, setMedicines] = useState([]);
    const [filteredMedicines, setFilteredMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDispenseModal, setShowDispenseModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Forms
    const [addForm, setAddForm] = useState({ name: '', quantityInStock: '', unit: '', expiryDate: '' });
    const [dispenseForm, setDispenseForm] = useState({ medId: '', quantity: '' });
    const [history, setHistory] = useState([]);
    const [printFilters, setPrintFilters] = useState({ startDate: '', endDate: '' });

    useEffect(() => {
        fetchInventory();
    }, []);

    useEffect(() => {
        filterMedicines();
    }, [medicines, searchQuery]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/medicines');
            setMedicines(res.data);
        } catch (err) {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const filterMedicines = () => {
        if (!searchQuery) {
            setFilteredMedicines(medicines);
            return;
        }
        const q = searchQuery.toLowerCase();
        setFilteredMedicines(medicines.filter(m => m.name.toLowerCase().includes(q)));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/medicines', addForm);
            toast.success('Medicine added');
            setShowAddModal(false);
            setAddForm({ name: '', quantityInStock: '', unit: '', expiryDate: '' });
            fetchInventory();
        } catch (err) {
            toast.error('Failed to add medicine');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this medicine?')) return;
        try {
            await api.delete(`/medicines/${id}`);
            toast.success('Medicine deleted');
            fetchInventory();
        } catch (err) {
            toast.error('Failed to delete medicine');
        }
    };

    const handleDispenseSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/medicines/${dispenseForm.medId}/dispense`, { quantity: parseInt(dispenseForm.quantity) });
            toast.success('Medicine dispensed');
            setShowDispenseModal(false);
            setDispenseForm({ medId: '', quantity: '' });
            fetchInventory();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to dispense');
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get('/medicines/history');
            setHistory(res.data);
            setShowHistoryModal(true);
        } catch (err) {
            toast.error('Failed to load history');
        }
    };

    const handlePrintHistory = async () => {
        try {
            const params = new URLSearchParams();
            if (printFilters.startDate) params.append('startDate', printFilters.startDate);
            if (printFilters.endDate) params.append('endDate', printFilters.endDate);

            const res = await api.get(`/medicines/history/pdf?${params.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error('Failed to generate report');
        }
    };

    const getStatusParams = (med) => {
        if (med.quantityInStock <= 0) return { label: 'Out of Stock', class: 'status-danger' };
        if (med.quantityInStock < 10) return { label: 'Low Stock', class: 'status-warning' };
        if (med.expiryDate && new Date(med.expiryDate) < new Date()) return { label: 'Expired', class: 'status-danger' };
        return { label: 'In Stock', class: 'status-success' };
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="inventory-page">
            <div className="page-header">
                <h1>Inventory Management</h1>
                <p>Track medicine stock and dispensing.</p>
            </div>

            <div className="controls-panel">
                <div className="search-group">
                    <Search className="icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search medicines..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="actions-group">
                    <button className="btn-secondary" onClick={fetchHistory}>
                        <History size={18} /> History
                    </button>
                    <button className="btn-secondary" onClick={() => setShowDispenseModal(true)}>
                        <Package size={18} /> Dispense
                    </button>
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} /> Add Medicine
                    </button>
                </div>
            </div>

            <div className="inventory-grid">
                {filteredMedicines.map(med => {
                    const status = getStatusParams(med);
                    return (
                        <div key={med._id} className="medicine-card">
                            <div className="card-header">
                                <h3>{med.name}</h3>
                                <span className={`status-badge ${status.class}`}>{status.label}</span>
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <span className="label">Stock:</span>
                                    <span className="value">{med.quantityInStock} {med.unit}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Expiry:</span>
                                    <span className="value">{med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : '—'}</span>
                                </div>
                            </div>
                            <div className="card-footer">
                                <button className="btn-icon danger" onClick={() => handleDelete(med._id)} title="Delete">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Add Medicine</h3>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            <div className="modal-body">
                                <input placeholder="Medicine Name" required value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
                                <input type="number" placeholder="Quantity" required value={addForm.quantityInStock} onChange={e => setAddForm({ ...addForm, quantityInStock: e.target.value })} />
                                <input placeholder="Unit (e.g. tablet, bottle)" required value={addForm.unit} onChange={e => setAddForm({ ...addForm, unit: e.target.value })} />
                                <label>Expiry Date</label>
                                <input type="date" value={addForm.expiryDate} onChange={e => setAddForm({ ...addForm, expiryDate: e.target.value })} />
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn-primary">Add Medicine</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Dispense Modal */}
            {showDispenseModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Dispense Medicine</h3>
                            <button className="close-btn" onClick={() => setShowDispenseModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleDispenseSubmit}>
                            <div className="modal-body">
                                <select required value={dispenseForm.medId} onChange={e => setDispenseForm({ ...dispenseForm, medId: e.target.value })}>
                                    <option value="">Select Medicine</option>
                                    {medicines.map(m => (
                                        <option key={m._id} value={m._id}>{m.name} ({m.quantityInStock} left)</option>
                                    ))}
                                </select>
                                <input type="number" placeholder="Quantity" required min="1" value={dispenseForm.quantity} onChange={e => setDispenseForm({ ...dispenseForm, quantity: e.target.value })} />
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn-primary">Dispense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="modal-overlay">
                    <div className="modal-card wide">
                        <div className="modal-header">
                            <h3>Dispense History</h3>
                            <button className="close-btn" onClick={() => setShowHistoryModal(false)}><X size={24} /></button>
                        </div>
                        <div className="history-filters" style={{ padding: '0 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                            <input
                                type="date"
                                value={printFilters.startDate}
                                onChange={e => setPrintFilters({ ...printFilters, startDate: e.target.value })}
                                style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
                            />
                            <span>to</span>
                            <input
                                type="date"
                                value={printFilters.endDate}
                                onChange={e => setPrintFilters({ ...printFilters, endDate: e.target.value })}
                                style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
                            />
                            <button className="btn-secondary" onClick={handlePrintHistory} title="Print Report">
                                <Printer size={18} /> Print
                            </button>
                        </div>
                        <div className="modal-body history-list">
                            {history.length === 0 ? <p>No history found.</p> : (
                                <table className="history-table">
                                    <thead><tr><th>Medicine</th><th>Qty</th><th>Date</th><th>Source</th></tr></thead>
                                    <tbody>
                                        {history.map((h, i) => (
                                            <tr key={i}>
                                                <td>{h.medicineName}</td>
                                                <td>{h.quantity}</td>
                                                <td>{new Date(h.dispensedAt).toLocaleString()}</td>
                                                <td>{h.source}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
