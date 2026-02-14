import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Use api instance for data fetching
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { Activity, Search, Filter, Calendar, RefreshCw } from 'lucide-react';
import './SystemLogs.css';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchLogs();

        // Socket.IO connection
        // Use the base URL from API_URL (remove /api)
        const socketUrl = import.meta.env.VITE_API_URL.replace('/api', '');
        const socket = io(socketUrl);

        socket.on('new_log', (newLog) => {
            if (newLog) {
                setLogs(prev => [newLog, ...prev]);
                toast.info(`New Activity: ${newLog.action?.replace(/_/g, ' ')}`);
            }
        });

        return () => socket.disconnect();
    }, []);

    useEffect(() => {
        filterLogs();
    }, [logs, searchQuery, actionFilter, dateRange]);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/logs');
            setLogs(res.data.logs || []);
        } catch (err) {
            toast.error('Failed to load system logs');
        } finally {
            setLoading(false);
        }
    };

    const filterLogs = () => {
        let result = logs;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(log => {
                const adminName = log.adminId ? `${log.adminId.firstName} ${log.adminId.lastName}` : 'System';
                const details = JSON.stringify(log.details || {}).toLowerCase();
                return adminName.toLowerCase().includes(q) || details.includes(q) || log.action.toLowerCase().includes(q);
            });
        }

        if (actionFilter) {
            result = result.filter(log => log.action === actionFilter);
        }

        if (dateRange.start) {
            result = result.filter(log => new Date(log.timestamp) >= new Date(dateRange.start));
        }
        if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59);
            result = result.filter(log => new Date(log.timestamp) <= endDate);
        }

        setFilteredLogs(result);
    };

    const getActionBadge = (action) => {
        const type = action.includes('delete') ? 'danger' :
            action.includes('approve') || action.includes('complete') ? 'success' :
                action.includes('update') ? 'warning' : 'info';
        return <span className={`log-badge badge-${type}`}>{action.replace(/_/g, ' ')}</span>;
    };

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="system-logs-page">
            <div className="page-header">
                <h1><Activity className="header-icon" /> System Logs</h1>
                <p>Real-time monitoring of system activities and user actions.</p>
            </div>

            <div className="controls-panel">
                <div className="search-group">
                    <Search className="icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filters-row">
                    <div className="filter-select">
                        <Filter size={16} className="text-muted" />
                        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                            <option value="">All Actions</option>
                            <option value="user_login">Login</option>
                            <option value="user_signup">Signup</option>
                            <option value="approve_appointment">Approve Appointment</option>
                            <option value="delete_appointment">Delete Appointment</option>
                            <option value="update_user_role">Update Role</option>
                            <option value="complete_consultation">Consultation</option>
                        </select>
                    </div>
                    <div className="date-input">
                        <span className="label">From</span>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                    </div>
                    <div className="date-input">
                        <span className="label">To</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                    </div>
                    <button
                        className="btn-icon"
                        onClick={() => { setSearchQuery(''); setActionFilter(''); setDateRange({ start: '', end: '' }) }}
                        title="Reset Filters"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            <div className="logs-list">
                {filteredLogs.length === 0 ? (
                    <div className="no-data">No logs found matching criteria.</div>
                ) : (
                    filteredLogs.map(log => (
                        <div key={log._id} className="log-item">
                            <div className="log-header">
                                <div className="log-meta">
                                    <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                                    <span className="log-user">
                                        by <strong>{log.adminId ? `${log.adminId.firstName} ${log.adminId.lastName}` : (log.details?.userName || 'System')}</strong>
                                    </span>
                                </div>
                                {getActionBadge(log.action)}
                            </div>
                            <div className="log-details">
                                <div className="detail-row">
                                    <span className="label">Entity Type:</span> {log.entityType}
                                </div>
                                {log.entityId && (
                                    <div className="detail-row">
                                        <span className="label">Entity ID:</span> <span className="mono">{log.entityId}</span>
                                    </div>
                                )}
                                {log.details && (
                                    <div className="json-details">
                                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SystemLogs;
