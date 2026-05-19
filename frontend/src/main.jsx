
import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/index.css';
import App from './App';

import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 1. QueryClient ko yahan create karein
const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));

// 2. Saare Providers ko ek sath nest (ek ke andar ek) karein
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

