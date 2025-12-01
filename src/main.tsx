import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode disabled due to concurrent rendering issues with hooks
// This is a known issue in React 18 development mode
createRoot(document.getElementById('root')!).render(<App />)
