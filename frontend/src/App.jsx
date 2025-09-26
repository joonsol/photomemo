
import './App.scss'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AdminAuthPanel from "./components/AdminAuthPanel"
import Landing from './pages/Landing'
function App() {

  return (
    <div className='page'>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/admin/login' element={<AdminAuthPanel />} />
      </Routes>

    </div>
  )
}

export default App
