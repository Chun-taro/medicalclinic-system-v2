import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import AdminCalendar from '../../components/feature/AdminCalendar';
import { Users, Calendar, BarChart2, Sun } from 'lucide-react';
import './AdminDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
    const { isDarkMode } = useTheme();
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weather, setWeather] = useState(null);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        totalUsers: 0,
        todayAppointments: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedNotes, setSelectedNotes] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [aptRes, usersRes, reportsRes] = await Promise.all([
                    api.get('/appointments'),
                    api.get('/users'),
                    api.get('/appointments/reports') // Ensure this endpoint exists or mock it
                ]);

                const overallStats = reportsRes.data;
                const totalApts = overallStats.totalAppointments || aptRes.data.length;
                const todayAptCount = overallStats.todayAppointments || aptRes.data.filter(a => new Date(a.appointmentDate).toDateString() === new Date().toDateString()).length;

                setStats({
                    totalAppointments: totalApts,
                    totalUsers: usersRes.data.length,
                    todayAppointments: todayAptCount
                });
                setAppointments(aptRes.data);
            } catch (err) {
                console.error('Failed to load dashboard data', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchWeather = async () => {
            try {
                const res = await api.get('/weather?city=Malaybalay');
                setWeather(res.data.weather);
            } catch (e) {
                console.error('Weather error:', e);
            }
        };

        fetchData();
        fetchWeather();
    }, []);

    const chartData = {
        labels: ['Total Appointments', 'Total Users', "Today's Appointments"],
        datasets: [
            {
                label: 'System Metrics',
                data: [stats.totalAppointments, stats.totalUsers, stats.todayAppointments],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                borderRadius: 4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: isDarkMode ? '#e2e8f0' : '#475569'
                }
            },
            title: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    color: isDarkMode ? '#e2e8f0' : '#475569'
                }
            },
            x: {
                ticks: {
                    color: isDarkMode ? '#e2e8f0' : '#475569'
                },
                grid: {
                    display: false
                }
            }
        }
    };

    const selectedAppointments = appointments.filter(
        (a) => new Date(a.appointmentDate).toDateString() === selectedDate.toDateString()
    );

    if (loading) return <div className="loading-spinner-container"><div className="loading-spinner"></div></div>;

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <p>Overview of clinic activities and statistics</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-row">
                <div className="stat-card blue">
                    <div className="stat-icon blue"><Calendar size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.totalAppointments}</h3>
                        <p>Total Appointments</p>
                    </div>
                </div>
                <div className="stat-card green"><div className="stat-icon green"><Users size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.totalUsers}</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                <div className="stat-card orange"><div className="stat-icon orange"><BarChart2 size={24} /></div>
                    <div className="stat-info">
                        <h3>{stats.todayAppointments}</h3>
                        <p>Appointments Today</p>
                    </div>
                </div>
                <div className="stat-card purple"><div className="stat-icon purple"><Sun size={24} /></div>
                    <div className="stat-info">
                        <h3>{weather ? `${Math.round(weather.main.temp)}°C` : '--'}</h3>
                        <p>{weather ? weather.weather[0].description : 'Weather'}</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-col-left">
                    <div className="card">
                        <h3>Calendar</h3>
                        <AdminCalendar
                            appointments={appointments}
                            selectedDate={selectedDate}
                            onDateChange={setSelectedDate}
                        />
                    </div>


                </div>

                <div className="dashboard-col-right">
                    <div className="card">
                        <h3>Metrics Overview</h3>
                        <div className="chart-container">
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    <div className="card mt-4">
                        <h3>Appointments for {selectedDate.toDateString()}</h3>
                        {selectedAppointments.length === 0 ? (
                            <p className="text-muted text-center py-4">No appointments scheduled.</p>
                        ) : (
                            <div className="admin-apt-list">
                                {selectedAppointments.map(apt => (
                                    <div key={apt._id} className="admin-apt-item">
                                        <div className="info-col">
                                            <h4>{apt.patientId ? `${apt.patientId.firstName} ${apt.patientId.lastName}` : 'Unknown Patient'}</h4>
                                            <p
                                                className="clickable-purpose"
                                                onClick={() => {
                                                    setSelectedNotes(apt.additionalNotes || 'No additional notes provided.');
                                                    setShowNotesModal(true);
                                                }}
                                                title="View Notes"
                                            >
                                                {apt.purpose}
                                            </p>
                                        </div>
                                        <div className="status-col">
                                            <span className={`status-badge status-${apt.status.toLowerCase()}`}>{apt.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notes Modal */}
            {showNotesModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h3>Appointment Notes</h3>
                            <button className="close-btn" onClick={() => setShowNotesModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="notes-content">
                                {selectedNotes}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-primary" onClick={() => setShowNotesModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
