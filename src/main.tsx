import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Log version for debugging
console.log('🚀 Wise Task Manager - Version:', new Date().toISOString());
console.log('📱 Mobile optimized version loaded');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
