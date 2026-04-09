import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './hooks/useTheme.jsx';
import './i18n/index.js';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          {/* NotificationProvider must be inside AppProvider so it can read user/role */}
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
