import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './AdminCalendar.css';

const AdminCalendar = ({ appointments = [], selectedDate, onDateChange }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const getAppointmentCount = (day) => {
        return appointments.filter((apt) => {
            const aptDate = new Date(apt.appointmentDate);
            return (
                aptDate.getDate() === day &&
                aptDate.getMonth() === currentDate.getMonth() &&
                aptDate.getFullYear() === currentDate.getFullYear()
            );
        }).length;
    };

    const isToday = (day) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear()
        );
    };

    const isSelected = (day) => {
        return (
            day === selectedDate.getDate() &&
            currentDate.getMonth() === selectedDate.getMonth() &&
            currentDate.getFullYear() === selectedDate.getFullYear()
        );
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleDayClick = (day) => {
        onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const calendarDays = Array(firstDayOfMonth).fill(null).concat(
        Array.from({ length: daysInMonth }, (_, i) => i + 1)
    );

    return (
        <div className="admin-calendar">
            <div className="calendar-header">
                <button className="nav-btn" onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
                <span className="month-display">{monthName}</span>
                <button className="nav-btn" onClick={handleNextMonth}><ChevronRight size={20} /></button>
            </div>

            <div className="weekdays-row">
                {weekDays.map((day) => (
                    <div key={day} className="weekday-label">
                        {day}
                    </div>
                ))}
            </div>

            <div className="days-matrix">
                {calendarDays.map((day, index) => (
                    <div
                        key={index}
                        className={`calendar-day-cell ${day === null ? 'empty' : ''} ${day && isToday(day) ? 'today' : ''} ${day && isSelected(day) ? 'selected' : ''}`}
                        onClick={() => day && handleDayClick(day)}
                    >
                        {day && (
                            <>
                                <span className="day-text">{day}</span>
                                {getAppointmentCount(day) > 0 && (
                                    <div className="apt-badge">{getAppointmentCount(day)}</div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminCalendar;
