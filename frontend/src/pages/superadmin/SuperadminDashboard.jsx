import React, { useEffect, useState } from "react";
import axios from "axios";
import SuperadminLayout from "./SuperadminLayout";
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
import "./Style/medical-calendar.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Modern Medical Calendar Component
const MedicalCalendar = ({ appointments, selectedDate, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAppointmentCount = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return appointments.filter(
      (app) => new Date(app.appointmentDate).toDateString() === date.toDateString()
    ).length;
  };

  const isToday = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === new Date().toDateString();
  };

  const isSelected = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleDayClick = (day) => {
    onDateChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="medical-calendar-container">
      <div className="medical-calendar-header">
        <button className="calendar-nav-btn" onClick={prevMonth}>
          ‹
        </button>
        <h3 className="calendar-month-year">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button className="calendar-nav-btn" onClick={nextMonth}>
          ›
        </button>
      </div>

      <div className="medical-calendar">
        <div className="calendar-weekdays">
          {dayNames.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="calendar-day empty"></div>;
            }

            const count = getAppointmentCount(day);
            const today = isToday(day);
            const selected = isSelected(day);

            return (
              <div
                key={day}
                className={`calendar-day ${today ? "today" : ""} ${selected ? "selected" : ""} ${
                  count > 0 ? "has-appointments" : ""
                }`}
                onClick={() => handleDayClick(day)}
              >
                <div className="day-number">{day}</div>
                {count > 0 && (
                  <div className="appointment-badge">
                    <span className="appointment-count-badge">{count}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default function SuperadminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalUsers: 0,
    todayAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState('');

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

    const fetchWeather = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/weather?city=Malaybalay');
        setWeather(res.data.weather);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setWeatherError('Failed to load weather');
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchData();
    fetchWeather();
  }, []);

  const appointmentsForDate = appointments.filter(
    (app) =>
      new Date(app.appointmentDate).toDateString() === selectedDate.toDateString()
  );


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
      <SuperadminLayout>
        <p className="loading-text">Loading dashboard...</p>
      </SuperadminLayout>
    );
  }

  return (
    <SuperadminLayout>
      <div className="admin-dashboard-container">
        {/* Top: Cards and Calendar */}
        <div className="dashboard-top">
          <h2 className="dashboard-heading">📊 Dashboard Overview</h2>
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
            <div className="stat-card purple">
              <h3>Weather</h3>
              {weatherLoading ? (
                <p>Loading...</p>
              ) : weatherError ? (
                <p style={{ color: 'red', fontSize: '12px' }}>{weatherError}</p>
              ) : weather ? (
                <div>
                  <p>{Math.round(weather.main.temp)}°C</p>
                  <p style={{ fontSize: '12px' }}>{weather.weather[0].description}</p>
                </div>
              ) : (
                <p>No data</p>
              )}
            </div>
          </div>
          <div className="calendar-card">
            <h2 className="dashboard-heading">📅 Calendar</h2>
            <MedicalCalendar
              appointments={appointments}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
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
    </SuperadminLayout>
  );
}