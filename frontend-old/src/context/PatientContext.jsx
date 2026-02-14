import { createContext, useContext, useState, useEffect } from 'react';

const PatientContext = createContext();

export function usePatient() {
  return useContext(PatientContext);
}

export function PatientProvider({ children }) {
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          console.warn('Token expired or invalid, logging out');
          localStorage.removeItem('token');
          setPatient(null);
          return;
        }

        const data = await res.json();
        if (res.ok) {
          setPatient(data);
          localStorage.setItem('profileImage', data.avatar || '');
          localStorage.setItem('firstName', data.firstName || '');
          localStorage.setItem('middleName', data.middleName || '');
          localStorage.setItem('lastName', data.lastName || '');
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };

    fetchProfile();
  }, []);

  return (
    <PatientContext.Provider value={{ patient, setPatient }}>
      {children}
    </PatientContext.Provider>
  );
}