import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import './styles/AppointmentsLayout.css'
import './styles/ScheduleLayout.css'
import './styles/EmployeeLayout.css'
import './styles/ProfileLayout.css'
import './styles/tabletLayout.css'
import './styles/mobileLayout.css'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Home from './pages/Home'
import Schedule from './pages/Schedule'
import Employees from './pages/Employees'
import EmployeeChatPage from './pages/EmployeeChatPage'
import Profile from './pages/Profile'
import Privacy from './pages/Privacy'

import { UseGlobalContext } from './Context.jsx'
import "react-datepicker/dist/react-datepicker.css";

function App() {
  const { isAuthenticated, user, authLoading } = UseGlobalContext();
  const location = useLocation();


  // Agar authentication yuklanayotgan bo'lsa, loading ko'rsatamiz
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // Agar foydalanuvchi tizimga kirmagan bo'lsa, Login va public sahifalarni ko'rsatamiz
  if (!isAuthenticated) {
    return (
      <div style={{ width: '100%', height: '100vh' }}>
        <Routes>
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    );
  }

  // EMPLOYEE ROLE - faqat employee-chat sahifasi
  if (user?.role === 'employee') {
    return (
      <div style={{ width: '100%', height: '100vh' }}>
        <Routes>
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/employee-chat" element={<EmployeeChatPage />} />
          <Route path="*" element={<Navigate to="/employee-chat" replace />} />
        </Routes>
      </div>
    );
  }

  // SALON ADMIN ROLE - barcha admin sahifalari
  if (user?.role === 'admin' || user?.role === 'salon_admin') {
    return (
      <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
        <Sidebar />
        <div className="app-content" style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/schedule' element={<Schedule />} />
            <Route path='/employees' element={<Employees />} />
            <Route path='/profile' element={<Profile />} />
            <Route path='/privacy' element={<Privacy />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  // PRIVATE SALON ADMIN ROLE - cheklangan admin sahifalari
  if (user?.role === 'private_salon_admin' || user?.role === 'private_admin') {

    return (
      <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
        <Sidebar />
        <div className="app-content" style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/schedule' element={<Schedule />} />
            <Route path='/profile' element={<Profile />} />
            <Route path='/chat' element={<EmployeeChatPage />} />
            <Route path='/privacy' element={<Privacy />} />
            <Route path='/employees' element={<Navigate to='/' replace />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  // SUPERADMIN ROLE - barcha sahifalar
  if (user?.role === 'superadmin') {
    return (
      <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
        <Sidebar />
        <div className="app-content" style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/schedule' element={<Schedule />} />
            <Route path='/employees' element={<Employees />} />
            <Route path='/chat' element={<EmployeeChatPage />} />
            <Route path='/profile' element={<Profile />} />
            <Route path='/privacy' element={<Privacy />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  // Agar role aniqlanmagan bo'lsa, login sahifasiga yo'naltirish
  return <Login />;

}

export default App
