import { Route, Routes } from 'react-router-dom'
import './App.css'
import './styles/AppointmentsLayout.css'
import './styles/ScheduleLayout.css'
import './styles/EmployeeLayout.css'
import './styles/ProfileLayout.css'
import './styles/tabletLayout.css'
import './styles/mobileLayout.css'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
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

  // Agar foydalanuvchi employee bo'lsa, faqat EmployeeChatPage ko'rsatamiz
  if (user?.role === 'employee') {
    return (
      <ProtectedRoute requiredRole="employee">
        <EmployeeChatPage />
      </ProtectedRoute>
    );
  }

  // Agar foydalanuvchi admin bo'lsa, barcha sahifalarni ko'rsatamiz
  return (
    <>
      <ProtectedRoute requiredRole="admin">
        <Sidebar/>
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path='/schedule' element={<Schedule/>} />
          <Route path='/employees' element={<Employees/>} />
          <Route path='/chat' element={<EmployeeChatPage/>} />
          <Route path='/profile' element={<Profile/>} />

          <Route path='/employee-chat' element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeChatPage />
            </ProtectedRoute>
          } />
        </Routes>
      </ProtectedRoute>
    </>
  )
}

export default App
