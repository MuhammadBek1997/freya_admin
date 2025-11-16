import React, { useState, useEffect } from 'react'
import { UseGlobalContext, getAuthToken } from '../Context'
import { mobileEmployeesAvailableUrl } from '../apiUrls'

const SelectEmployeeModal = ({ setSelectEmploy, onEmployeeSelect, date, start_time, end_time, initialSelected = [] }) => {
  const { employees, employeesBySalon, fetchEmployees, user, ts, fetchEmployeeBusySlots, calculateAvailableSlots, combinedAppointments, schedules } = UseGlobalContext()
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [availableEmployees, setAvailableEmployees] = useState(null)
  const [availLoading, setAvailLoading] = useState(false)
  const [availError, setAvailError] = useState('')
  const [filteredEmployees, setFilteredEmployees] = useState(null)

  useEffect(() => {
    if (Array.isArray(initialSelected) && initialSelected.length > 0) {
      setSelectedEmployees(initialSelected.map(id => String(id)))
    }
  }, [initialSelected])

  useEffect(() => {
    if (user?.salon_id) {
      fetchEmployees(user.salon_id)
    }
  }, [user?.salon_id])

  useEffect(() => {
    setAvailError('')
    setAvailableEmployees(null)
    if (!user?.salon_id) return
    if (!date || !start_time || !end_time) return
    const token = getAuthToken()
    const qs = new URLSearchParams({
      salon_id: String(user.salon_id),
      date_str: String(date),
      start_time: String(start_time),
      end_time: String(end_time),
      page: '1',
      limit: '200'
    }).toString()
    const url = `${mobileEmployeesAvailableUrl}?${qs}`
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
    const run = async () => {
      setAvailLoading(true)
      try {
        const resp = await fetch(url, { method: 'GET', headers })
        if (!resp.ok) {
          let msg = `HTTP ${resp.status}`
          try {
            const j = await resp.json()
            msg = j?.message || j?.detail || msg
          } catch (e1) {
            try { msg = await resp.text() } catch { msg = e1 && e1.message ? e1.message : msg }
          }
          throw new Error(msg)
        }
        const data = await resp.json()
        const items = data?.data || []
        const normalized = items.map(it => ({
          id: it.id,
          employee_name: it.name,
          name: it.name,
          position: it.workType,
          avatar_url: it.avatar
        }))
        setAvailableEmployees(normalized)
      } catch (e) {
        setAvailError(e?.message || 'Xatolik')
        setAvailableEmployees([])
      } finally {
        setAvailLoading(false)
      }
    }
    run()
  }, [user?.salon_id, date, start_time, end_time])

  useEffect(() => {
    const base = availableEmployees && Array.isArray(availableEmployees) && availableEmployees.length > 0
      ? availableEmployees
      : (employeesBySalon || []);
    if (!base || base.length === 0) {
      setFilteredEmployees([])
      return
    }
    if (!date || !start_time || !end_time) {
      setFilteredEmployees(base)
      return
    }
    const run = async () => {
      const [sh, sm] = String(start_time).split(':').map(Number)
      const [eh, em] = String(end_time).split(':').map(Number)
      const duration = (eh * 60 + em) - (sh * 60 + sm) || 60
      const results = []
      for (const emp of base) {
        try {
          const busySlots = await fetchEmployeeBusySlots(emp.id, date)
          const employeeAppointments = (combinedAppointments || []).filter(
            apt => String(apt.employee_id) === String(emp.id) && apt.date === date
          )
          const employeeSchedules = (schedules || []).filter(s =>
            String(s.date) === String(date) &&
            Array.isArray(s.employee_list) &&
            s.employee_list.map(id => String(id)).includes(String(emp.id))
          )
          const scheduleBusySlots = employeeSchedules.map(s => ({ start_time: String(s.start_time), end_time: String(s.end_time) }))
          const allBusySlots = [...(busySlots || []), ...scheduleBusySlots]
          const slots = calculateAvailableSlots(
            emp.work_start_time || '09:00',
            emp.work_end_time || '20:00',
            allBusySlots,
            employeeAppointments,
            duration
          )
          const ok = slots.some(s => s.start_time === start_time && s.end_time === end_time)
          if (ok) results.push(emp)
        } catch (e) {
          const _ = e
        }
      }
      setFilteredEmployees(results)
    }
    run()
  }, [availableEmployees, employees, date, start_time, end_time, combinedAppointments, fetchEmployeeBusySlots, calculateAvailableSlots])

 
  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployees(prev => {
      const key = String(employeeId)
      const next = prev.includes(key)
        ? prev.filter(id => id !== key)
        : [...prev, key]
      if (onEmployeeSelect) onEmployeeSelect(next)
      return next
    })
  }

  const handleConfirmSelection = () => {
    if (onEmployeeSelect) {
      onEmployeeSelect(selectedEmployees)
    }
    setSelectEmploy(false)
  }

  const listToRender = (
    filteredEmployees && Array.isArray(filteredEmployees)
      ? filteredEmployees
      : (
          availableEmployees && Array.isArray(availableEmployees)
            ? availableEmployees
            : (employeesBySalon || [])
        )
  )
  return (
    <div className='select-employModal'>
      <div className='select-employModal-cont'>
        <div className='select-employModal-top'>
          <button onClick={() => setSelectEmploy(false)}>
            <img src="/images/arrowLeft.png" alt="" />
          </button>
          <h3>{ts('selectEmployee','Выберите персонал')}</h3>
        </div>
        
        <div className='select-employModal-body' style={{
          alignItems: "start",
          rowGap: "0",
          columnGap: "0",
          gap: "1vw",
        }}>
          {availLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{ts('loading','Yuklanmoqda...')}</p>
            </div>
          ) : listToRender && listToRender.length > 0 ? (
            listToRender.map((employee) => {
              const isSelected = selectedEmployees.includes(String(employee.id))
              return (
                <div className='select-employModal-body-item' key={employee.id}>
                  <div className='select-employModal-body-item-top'>
                    <img src={employee.avatar_url || employee.avatar || '/images/masterImage.png'} alt="" />
                    <div>
                      <h4>{employee.employee_name || employee.name}</h4>
                      <p>{employee.position || ts('schedule.employee','Сотрудник')}</p>
                      <div className='select-employModal-body-item-rating'>
                        <img src="/images/Star1.png" alt="" />
                        <p>4.8 (13 {ts('profileReviews','отзывов')})</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    id='select-employModal-body-item-btn'
                    onClick={() => handleEmployeeToggle(employee.id)}
                    style={{
                      backgroundColor: isSelected ? '#9C2BFF' : '#C3A3D1',
                      color: '#fff',
                      borderRadius: '10px',
                      height: '32px',
                      minWidth: '190px',
                      boxShadow: '0 10px 10px rgba(0,0,0,0.2)'
                    }}
                  >
                    {isSelected ? ts('selected','Tanlangan') : ts('select','Выбрать')}
                  </button>
                </div>
              )
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{availError ? availError : ts('noEmployees','Сотрудники не найдены')}</p>
            </div>
          )}
        </div>
        
        {/* No confirm button per design */}
      </div>
    </div>
  )
}

export default SelectEmployeeModal
