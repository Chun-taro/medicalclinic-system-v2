import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'sanitize.css';
import 'sanitize.css/forms.css';
import 'sanitize.css/typography.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
