import { Buffer } from 'buffer';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = Buffer;
  (window as any).process = (window as any).process || { env: {} };
}

createRoot(document.getElementById('root')!).render(<App />);
