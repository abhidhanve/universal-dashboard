import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import {BrowserRouter} from "react-router-dom"
import UserContext from './context/UserContext.jsx'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

createRoot(rootElement).render(
<BrowserRouter>
<UserContext>
    <App />
  </UserContext>
  </BrowserRouter>
 
)
