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

    const getDayStats = (day) => {
        const dayApts = appointments.filter((apt) => {
            const aptDate = new Date(apt.appointmentDate);
            return (
                aptDate.getDate() === day &&
                aptDate.getMonth() === currentDate.getMonth() &&
                aptDate.getFullYear() === currentDate.getFullYear()
            );
        });

        return {
            total: dayApts.length,
            pending: dayApts.filter(a => a.status === 'pending').length,
            approved: dayApts.filter(a => a.status === 'approved').length,
            completed: dayApts.filter(a => a.status === 'completed').length
        };
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
                {calendarDays.map((day, index) => {
                    const stats = day ? getDayStats(day) : null;
                    return (
                        <div
                            key={index}
                            className={`calendar-day-cell ${day === null ? 'empty' : ''} ${day && isToday(day) ? 'today' : ''} ${day && isSelected(day) ? 'selected' : ''}`}
                            onClick={() => day && handleDayClick(day)}
                        >
                            {day && (
                                <>
                                    <span className="day-text">{day}</span>
                                    <div className="day-indicators">
                                        {stats.approved > 0 && (
                                            <div className="indicator approved" title={`${stats.approved} Approved`}>{stats.approved}</div>
                                        )}
                                        {stats.pending > 0 && (
                                            <div className="indicator pending" title={`${stats.pending} Pending`}>{stats.pending}</div>
                                        )}
                                        {stats.completed > 0 && (
                                            <div className="indicator completed" title={`${stats.completed} Completed`}>{stats.completed}</div>
                                        )}
                                    </div>
                                    {stats.total > 0 && (
                                        <div className="apt-badge-total">{stats.total}</div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminCalendar;
