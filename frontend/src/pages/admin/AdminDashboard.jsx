import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./Style/admindashboard1.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalUsers: 0,
    todayAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [appointmentsRes, usersRes, statsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/appointments", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/appointments/reports", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const today = new Date().toDateString();
        const todayAppointments = appointmentsRes.data.filter(
          (apt) => new Date(apt.appointmentDate).toDateString() === today
        ).length;

        setStats({
          totalAppointments:
            statsRes.data.totalAppointments || appointmentsRes.data.length,
          totalUsers: usersRes.data.length,
          todayAppointments:
            statsRes.data.todayAppointments || todayAppointments,
        });

        setAppointments(appointmentsRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const appointmentsForDate = appointments.filter(
    (app) =>
      new Date(app.appointmentDate).toDateString() === selectedDate.toDateString()
  );

  const highlightDates = ({ date, view }) => {
    if (view === "month") {
      const hasAppointment = appointments.some(
        (app) =>
          new Date(app.appointmentDate).toDateString() === date.toDateString()
      );
      return hasAppointment ? "has-appointment" : null;
    }
  };

  const chartData = {
    labels: ["Total Appointments", "Total Users", "Today's Appointments"],
    datasets: [
      {
        label: "System Metrics",
        data: [
          stats.totalAppointments,
          stats.totalUsers,
          stats.todayAppointments,
        ],
        backgroundColor: ["#4e79a7", "#59a14f", "#f28e2b"],
      },
    ],
  };

  if (loading) {
    return (
      <AdminLayout>
        <p className="loading-text">Loading dashboard...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-dashboard-container">
        {/* Top: Cards and Calendar */}
        <div className="dashboard-top">
          <h2 className="dashboard-heading">📊 Dashboard Overview</h2>
          <div className="top-row">
            <div className="stats-grid">
              <div className="stat-card blue">
                <h3>Total Appointments</h3>
                <p>{stats.totalAppointments}</p>
              </div>
              <div className="stat-card green">
                <h3>Total Users</h3>
                <p>{stats.totalUsers}</p>
              </div>
              <div className="stat-card yellow">
                <h3>Today's Appointments</h3>
                <p>{stats.todayAppointments}</p>
              </div>
            </div>
            <div className="calendar-card">
              <h2 className="dashboard-heading">📅 Calendar</h2>
              <Calendar
                value={selectedDate}
                onChange={setSelectedDate}
                className="styled-calendar"
                tileClassName={highlightDates}
              />
            </div>
          </div>
        </div>

        {/* Bottom: Graph and Appointments */}
        <div className="dashboard-bottom">
          <div className="chart-section">
            <h3>📈 Metrics Graph</h3>
            <Bar data={chartData} />
          </div>
          <div className="appointment-section">
            <h3 className="appointment-title">
              Appointments for {selectedDate.toDateString()}
            </h3>
            <ul className="appointment-list">
              {appointmentsForDate.length === 0 ? (
                <li className="no-appointments">No appointments</li>
              ) : (
                appointmentsForDate.map((app) => (
                  <li key={app._id} className="appointment-item">
                    <div className="appointment-info">
                      <strong>
                        {app.patientId?.firstName || "Unknown"}{" "}
                        {app.patientId?.lastName || ""}
                      </strong>
                      <span className="appointment-time">
                        {new Date(app.appointmentDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="appointment-note">
                      Purpose: {app.purpose || "N/A"}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}