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

import { UseGlobalContext } from './Context'
import "react-datepicker/dist/react-datepicker.css";

function App() {
  const { isAuthenticated, user, authLoading } = UseGlobalContext();
  const location = useLocation();

  // Debug loglar - har render'da ko'rsatish
  console.log('🔍 APP.jsx DEBUG: authLoading:', authLoading);
  console.log('🔍 APP.jsx DEBUG: isAuthenticated:', isAuthenticated);
  console.log('🔍 APP.jsx DEBUG: user object:', user);
  console.log('🔍 APP.jsx DEBUG: user.role:', user?.role);
  console.log('🔍 APP.jsx DEBUG: user.role type:', typeof user?.role);
  console.log('🔍 APP.jsx DEBUG: current location:', location.pathname);
  console.log('🔍 APP.jsx DEBUG: localStorage authToken:', localStorage.getItem('authToken'));
  console.log('🔍 APP.jsx DEBUG: localStorage userData:', localStorage.getItem('userData'));
  
  // Role comparison debugging
  if (user?.role) {
    console.log('🔍 APP.jsx DEBUG: Role comparisons:');
    console.log('  - user.role === "employee":', user.role === 'employee');
    console.log('  - user.role === "admin":', user.role === 'admin');
    console.log('  - user.role === "salon_admin":', user.role === 'salon_admin');
    console.log('  - user.role === "private_salon_admin":', user.role === 'private_salon_admin');
    console.log('  - user.role === "superadmin":', user.role === 'superadmin');
  }

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

  // Agar foydalanuvchi tizimga kirmagan bo'lsa, faqat Login sahifasini ko'rsatamiz
  if (!isAuthenticated) {
    return <Login />;
  }

  // EMPLOYEE ROLE - faqat employee-chat sahifasi
  if (user?.role === 'employee') {
    console.log('🟢 EMPLOYEE ROLE: Showing employee chat page');
    return (
      <div style={{ width: '100%', height: '100vh' }}>
        <Routes>
          <Route path="/employee-chat" element={<EmployeeChatPage />} />
          <Route path="*" element={<Navigate to="/employee-chat" replace />} />
        </Routes>
      </div>
    );
  }

  // SALON ADMIN ROLE - barcha admin sahifalari
  if (user?.role === 'admin' || user?.role === 'salon_admin') {
    console.log('🟢 SALON ADMIN ROLE: Showing admin pages with sidebar');
    return (
      <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/schedule' element={<Schedule />} />
            <Route path='/employees' element={<Employees />} />
            <Route path='/chat' element={<EmployeeChatPage />} />
            <Route path='/profile' element={<Profile />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  // PRIVATE SALON ADMIN ROLE - cheklangan admin sahifalari
  if (user?.role === 'private_salon_admin') {
    console.log('🟡 PRIVATE SALON ADMIN ROLE: Showing limited admin pages');
    return (
      <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/schedule' element={<Schedule />} />
            <Route path='/chat' element={<EmployeeChatPage />} />
            <Route path='/profile' element={<Profile />} />
            {/* Private salon admin employees sahifasiga kira olmaydi */}
            <Route path='/employees' element={<Navigate to='/' replace />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  // SUPERADMIN ROLE - barcha sahifalar
  if (user?.role === 'superadmin') {
    console.log('🔴 SUPERADMIN ROLE: Showing all pages');
    return (
      <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/schedule' element={<Schedule />} />
            <Route path='/employees' element={<Employees />} />
            <Route path='/chat' element={<EmployeeChatPage />} />
            <Route path='/profile' element={<Profile />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  // Agar role aniqlanmagan bo'lsa, login sahifasiga yo'naltirish
  console.log('❌ UNKNOWN ROLE: Redirecting to login');
  return <Login />;
}

export default App
