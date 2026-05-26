import { StrictMode } from 'react'                    
import { createRoot } from 'react-dom/client'         
import { BrowserRouter } from 'react-router-dom'      
import './styles/index.css'                           
import App from './App.jsx'                           
import { ToastProvider } from './components/Toast.jsx'

// This right here the entry point fam — where the whole app kick off
// We finna find that <div id="root"></div> in index.html and bring this React heat to it

createRoot(document.getElementById('root')).render(
  <StrictMode>                                        
    <BrowserRouter>                                   
      <ToastProvider>
        <App />                                         
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)