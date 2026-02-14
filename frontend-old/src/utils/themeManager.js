/**
 * Theme utility module
 * Applies role-based theme CSS to the document
 */

export const THEME_MAP = {
  superadmin: 'theme-superadmin',
  admin: 'theme-admin',
  doctor: 'theme-admin',
  patient: 'theme-patient',
  nurse: 'theme-admin'
};

/**
 * Apply theme to document based on user role
 * @param {string} role - User role (superadmin, admin, doctor, patient, nurse)
 */
export const applyTheme = (role) => {
  const themeName = THEME_MAP[role] || 'theme-patient';
  
  // Remove all existing theme classes
  Object.values(THEME_MAP).forEach(theme => {
    document.documentElement.classList.remove(theme);
  });
  
  // Add the new theme
  document.documentElement.classList.add(themeName);
  localStorage.setItem('appTheme', themeName);
};

/**
 * Initialize theme from localStorage or user role
 * @param {string} role - User role
 */
export const initializeTheme = (role) => {
  const savedTheme = localStorage.getItem('appTheme');
  if (savedTheme) {
    document.documentElement.classList.add(savedTheme);
  } else {
    applyTheme(role);
  }
};

/**
 * Get current theme
 * @returns {string} Current theme class
 */
export const getCurrentTheme = () => {
  return localStorage.getItem('appTheme') || Object.values(THEME_MAP)[0];
};

/**
 * Reset theme to default
 */
export const resetTheme = () => {
  localStorage.removeItem('appTheme');
  Object.values(THEME_MAP).forEach(theme => {
    document.documentElement.classList.remove(theme);
  });
};

const ThemeManager = { applyTheme, initializeTheme, getCurrentTheme, resetTheme };

export default ThemeManager;
