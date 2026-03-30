import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './i18n'
createRoot(document.getElementById('root')).render(
    <App />
)
