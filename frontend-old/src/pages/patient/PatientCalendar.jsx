import { useState } from 'react';

export default function PatientCalendar({ appointments = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

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
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="patient-calendar">
      <div className="calendar-header">
        <button className="nav-btn prev-btn" onClick={handlePrevMonth}>
          ‹
        </button>
        <h3 className="month-year">{monthName}</h3>
        <button className="nav-btn next-btn" onClick={handleNextMonth}>
          ›
        </button>
      </div>

      <div className="weekdays">
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
            className={`day ${day === null ? 'empty' : ''} ${isToday(day) ? 'today' : ''} ${
              isSelected(day) ? 'selected' : ''
            }`}
            onClick={() => day !== null && handleDayClick(day)}
          >
            {day && (
              <>
                <div className="day-number">{day}</div>
                {getAppointmentCount(day) > 0 && (
                  <div className="appointment-badge">{getAppointmentCount(day)}</div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
