import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './PatientCalendar.css';

const PatientCalendar = ({ appointments = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

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

    const handleDayClick = (day) => {
        setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Fill calendar grid
    const calendarDays = Array(firstDayOfMonth).fill(null).concat(
        Array.from({ length: daysInMonth }, (_, i) => i + 1)
    );

    return (
        <div className="calendar-card">
            <div className="calendar-header">
                <h3 className="calendar-title">{monthName}</h3>
                <div className="calendar-nav">
                    <button className="nav-btn" onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
                    <button className="nav-btn" onClick={handleNextMonth}><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="weekdays-grid">
                {weekDays.map((day) => (
                    <div key={day} className="weekday">
                        {day}
                    </div>
                ))}
            </div>

            <div className="days-grid">
                {calendarDays.map((day, index) => (
                    <div
                        key={index}
                        className={`day ${day === null ? 'empty' : ''} ${day && isToday(day) ? 'today' : ''} ${day && isSelected(day) ? 'selected' : ''}`}
                        onClick={() => day && handleDayClick(day)}
                    >
                        {day && (
                            <>
                                <span className="day-number">{day}</span>
                                <div className="day-indicators">
                                    {getDayStats(day).approved > 0 && (
                                        <div className="indicator approved" title={`${getDayStats(day).approved} Approved`}>
                                            {getDayStats(day).approved}
                                        </div>
                                    )}
                                    {getDayStats(day).pending > 0 && (
                                        <div className="indicator pending" title={`${getDayStats(day).pending} Pending`}>
                                            {getDayStats(day).pending}
                                        </div>
                                    )}
                                    {getDayStats(day).completed > 0 && (
                                        <div className="indicator completed" title={`${getDayStats(day).completed} Completed`}>
                                            {getDayStats(day).completed}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PatientCalendar;
