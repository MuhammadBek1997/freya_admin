import { Route, Routes } from 'react-router-dom'
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
import Profile from './pages/Profile'
import "react-datepicker/dist/react-datepicker.css";

function App() {

  return (
    <>
      {/* <Login/> */}
      <Sidebar/>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/schedule' element={<Schedule/>} />
        <Route path='/employees' element={<Employees/>} />
        <Route path='/profile' element={<Profile/>} />
      </Routes>

      
    </>
  )
}

export default App
