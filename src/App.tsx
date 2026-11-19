import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Home } from './pages/Home';
import { ThemeProvider } from './context/ThemeContext';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
