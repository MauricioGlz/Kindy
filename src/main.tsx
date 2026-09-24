import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DebugProvider } from './context/DebugContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DebugProvider>
      <App />
    </DebugProvider>
  </StrictMode>,
);
