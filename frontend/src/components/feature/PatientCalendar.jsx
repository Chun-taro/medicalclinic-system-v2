import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './PatientCalendar.css';

const PatientCalendar = ({ appointments = [] }) => {
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
                        className={`day ${day === null ? 'empty' : ''} ${day && isToday(day) ? 'today' : ''}`}
                    >
                        {day && (
                            <>
                                <span className="day-number">{day}</span>
                                {getAppointmentCount(day) > 0 && (
                                    <div className="appointment-dot"></div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PatientCalendar;
