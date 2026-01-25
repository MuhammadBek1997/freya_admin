import React, { useState, useEffect, useRef } from 'react'
import { useI18n } from '../hooks/useI18n'
import { UseGlobalContext, getAuthToken } from '../Context'
import { mobileEmployeesAvailableUrl } from '../apiUrls'

const BookScheduleModal = (props) => {
  const {
    salon_id,
    date,
    start_time,
    end_time,
    name,
    service_duration,
    employee_list,
    whole_day,
    setEditModal
  } = props

  const { t } = useI18n()
  const { user, employeesBySalon, fetchEmployees, services, fetchServices, getAvailableSlots, createBooking, ts, combinedAppointments, calculateAvailableSlots, checkEmployeeBusyInterval } = UseGlobalContext()

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    employee_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false)
  const timeDropdownRef = useRef(null)
  const [availableEmployees, setAvailableEmployees] = useState(null)
  const [availLoading, setAvailLoading] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const isWholeDay = (Boolean(whole_day) || (String(start_time || '').substring(0,5) === '00:00' && String(end_time || '').substring(0,5) === '23:59'))
  const isEmployeeRole = String(user?.role) === 'employee'
  const loggedEmployeeId = String(user?.id || user?.employee_id || '')
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 480 : false

  useEffect(() => {
    if (!employeesBySalon || employeesBySalon.length === 0) {
      if (user?.salon_id) {
        fetchEmployees(user.salon_id)
      } else {
        fetchEmployees()
      }
    }
    if (!services || services.length === 0) {
      fetchServices()
    }
  }, [])

  useEffect(() => {
    if (isEmployeeRole && loggedEmployeeId) {
      setFormData(prev => ({ ...prev, employee_id: loggedEmployeeId }))
    }
  }, [isEmployeeRole, loggedEmployeeId])

  useEffect(() => {
    if (!services || services.length === 0) return
    const salonFilter = String(salon_id || user?.salon_id)
    const list = services.filter(s => String(s.salon_id) === salonFilter)
    let auto = null
    if (name) {
      const nm = String(name).trim().toLowerCase()
      auto = list.find(s => String(s.name || '').trim().toLowerCase() === nm)
    }
    if (!auto && service_duration) {
      auto = list.find(s => Number(s.duration) === Number(service_duration))
    }
    if (auto) setSelectedServiceId(String(auto.id))
    const schedEmpIds = Array.isArray(employee_list) ? employee_list.map(id => String(id)) : []
    if (schedEmpIds.length === 1) {
      setFormData(prev => ({ ...prev, employee_id: schedEmpIds[0] }))
    }
  }, [services, name, service_duration, salon_id, user?.salon_id])

  useEffect(() => {
    setAvailableEmployees(null)
    setAvailLoading(false)
    if (Boolean(whole_day) || (String(start_time || '').substring(0,5) === '00:00' && String(end_time || '').substring(0,5) === '23:59')) return
    if (isEmployeeRole) return
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
          throw new Error(await resp.text())
        }
        const data = await resp.json()
        const items = data?.data || []
        const normalized = items.map(it => ({ id: it.id, name: it.name, avatar: it.avatar, profession: it.workType }))
        setAvailableEmployees(normalized)
      } catch {
        setAvailableEmployees([])
      } finally {
        setAvailLoading(false)
      }
    }
    run()
  }, [user?.salon_id, date, start_time, end_time])

  useEffect(() => {
    if (isWholeDay) return
    setAvailableSlots([])
    if (!formData.employee_id || !date) return
    ;(async () => {
      const res = await getAvailableSlots(formData.employee_id, date)
      const data = Array.isArray(res?.data) ? res.data : []
      const svc = selectedServiceId ? data.find(d => String(d.service_id) === String(selectedServiceId)) : null
      const slots = svc ? (svc.slots || []) : []
      const booked = (combinedAppointments || []).filter(a => String(a.employee_id) === String(formData.employee_id) && String(a.date) === String(date))
      const bookedSet = new Set(booked.map(a => String(a.time || a.application_time || '').substring(0, 5)))
      const filtered = slots.filter(s => !bookedSet.has(String(s.start).substring(0, 5)))
      setAvailableSlots(filtered)
    })()
  }, [formData.employee_id, date, selectedServiceId, isWholeDay])

  useEffect(() => {
    if (!isWholeDay) return
    setAvailableSlots([])
    if (!formData.employee_id || !date) return
    const empObj = (employeesBySalon || []).find(e => String(e.id) === String(formData.employee_id)) || {}
    const workStart = empObj.work_start_time || '09:00'
    const workEnd = empObj.work_end_time || '20:00'
    const employeeAppointments = (combinedAppointments || []).filter(
      a => String(a.employee_id) === String(formData.employee_id) && String(a.date) === String(date)
    ).map(a => ({
      application_time: String((a.time || a.application_time || '')).substring(0, 5),
      service_duration: Number(a.service_duration || a.duration || 60)
    }))
    const calc = calculateAvailableSlots(workStart, workEnd, [], employeeAppointments, Number(service_duration) || 60)
    const converted = (calc || []).map(s => ({ start: s.start_time, end: s.end_time }))
    setAvailableSlots(converted)
  }, [isWholeDay, formData.employee_id, date, service_duration, employeesBySalon, combinedAppointments])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    const handleKeyDown = (e) => { if (e.key === 'Escape' && !isWholeDay) setIsTimeDropdownOpen(false) }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isWholeDay])

  useEffect(() => {
    if (isWholeDay && formData.employee_id && availableSlots.length > 0) {
      setIsTimeDropdownOpen(true)
    }
  }, [isWholeDay, formData.employee_id, availableSlots])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEmployeeSelect = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      employee_id: employeeId
    }))
    setIsDropdownOpen(false)
  }

  const handleServiceSelect = (e) => {
    setSelectedServiceId(e.target.value)
  }

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      setError(t('validation.required') || 'Iltimos, ismni kiriting')
      return
    }
    if (!formData.phone.trim()) {
      setError(t('phoneRequired') || 'Iltimos, telefon raqamini kiriting')
      return
    }
    if (!formData.employee_id) {
      setError(t('selectEmployeeRequired') || 'Iltimos, xodimni tanlang')
      return
    }
    if ((Boolean(whole_day) || (String(start_time || '').substring(0,5) === '00:00' && String(end_time || '').substring(0,5) === '23:59')) && !formData.selected_slot_start) {
      setError(t('startTimeRequired') || 'Время начала обязательно')
      return
    }

    setError('')
    setLoading(true)

    try {
      const resolvedSalonId = salon_id || user?.salon_id
      if (!resolvedSalonId) throw new Error(t('errors.salonIdMissing') || 'Salon ID topilmadi')

      const scheduleDate = new Date(date)
      const picked = formData.selected_slot_start || start_time
      const [hours, minutes] = String(picked).split(':')
      scheduleDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      const startHHMM = String(picked).substring(0, 5)
      let endHHMM = ''
      if (formData.selected_slot_start) {
        const sl = (availableSlots || []).find(s => String(s.start) === String(formData.selected_slot_start))
        if (sl && sl.end) {
          endHHMM = String(sl.end).substring(0, 5)
        } else {
          const parts = String(formData.selected_slot_start).split(':').map(Number)
          const add = Number(service_duration) || 60
          const total = parts[0] * 60 + parts[1] + add
          const eh = Math.floor(total / 60)
          const em = total % 60
          endHHMM = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
        }
      } else {
        if (end_time) {
          endHHMM = String(end_time).substring(0, 5)
        } else {
          const parts = String(picked).split(':').map(Number)
          const add = Number(service_duration) || 60
          const total = parts[0] * 60 + parts[1] + add
          const eh = Math.floor(total / 60)
          const em = total % 60
          endHHMM = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
        }
      }

      const intervalBusy = await checkEmployeeBusyInterval(
        String(formData.employee_id),
        String(date),
        startHHMM,
        endHHMM
      )
      if (intervalBusy) {
        const empObj = (employeesBySalon || []).find(e => String(e.id) === String(formData.employee_id)) || {}
        const empName = empObj?.name || t('schedule.employee')
        const msg = `${empName}: ${t('employeeBusy') || 'Tanlangan xodim bu vaqtda band'} (${startHHMM}-${endHHMM})`
        throw new Error(msg)
      }

      const bookingData = {
        salon_id: resolvedSalonId,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        time: `${String(date)}T${startHHMM}:00`,
        employee_id: String(formData.employee_id)
      }

      await createBooking(bookingData)
      alert(t('bookingSuccess') || 'Бронирование успешно создано!')
      if (typeof setEditModal === 'function') setEditModal(false)
    } catch (e) {
      setError(e.message || t('savingError') || 'Saqlashda xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const scheduleEmployeeIds = Array.isArray(employee_list) ? employee_list.map(id => String(id)) : []
  const filteredEmployeesBase = (employeesBySalon || []).filter(e =>
    scheduleEmployeeIds.length === 0 ? true : scheduleEmployeeIds.includes(String(e.id))
  )
  const filteredEmployeesUnlocked = Array.isArray(availableEmployees) && availableEmployees.length > 0
    ? filteredEmployeesBase.filter(e => availableEmployees.some(a => String(a.id) === String(e.id)))
    : filteredEmployeesBase
  const filteredEmployees = isEmployeeRole
    ? (employeesBySalon || []).filter(e => String(e.id) === loggedEmployeeId)
    : filteredEmployeesUnlocked
  const selectedEmployee = formData.employee_id 
    ? filteredEmployees.find(e => String(e.id) === String(formData.employee_id))
    : null

  const displayStart = formData.selected_slot_start || start_time
  const displayEnd = (() => {
    if (formData.selected_slot_start) {
      const sl = (availableSlots || []).find(s => String(s.start) === String(formData.selected_slot_start))
      if (sl && sl.end) return sl.end
      const parts = String(formData.selected_slot_start).split(':').map(Number)
      const add = Number(service_duration) || 60
      const total = parts[0] * 60 + parts[1] + add
      const eh = Math.floor(total / 60)
      const em = total % 60
      return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
    }
    return end_time
  })()

  return (
    <div className='editSchedule-modal'>
      <div className='editSchedule-modal-cont'>
        {(Boolean(whole_day) || (String(start_time || '').substring(0,5) === '00:00' && String(end_time || '').substring(0,5) === '23:59')) ? (
          <div style={{ position: 'absolute', top: '12px', left: '16px', background: '#FFF', color: '#9C2BFF', border: '1px solid #9C2BFF', borderRadius: isMobile ? '4vw' : '12px', padding: isMobile ? '0.8vh 2.8vw' : '4px 10px', fontSize: isMobile ? '3.2vw' : '0.8vw' }}>
            {t('schedule.wholeDay') || 'Whole day'}
          </div>
        ) : null}
        <h2>{t('book') || 'Забронировать'}</h2>

        {error && (
          <div style={{
            backgroundColor: '#ff000020',
            color: '#ff0000',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '10px'
          }}>
            {error}
          </div>
        )}

        <div className='schedule-modal-form'>
          {name ? (
            <>
              <label htmlFor='schedule_lesson'>{t('schedule.lesson') || 'Занятие'}</label>
              <input
                type='text'
                id='schedule_lesson'
                className='form-inputs'
                value={name}
                disabled
              />
            </>
          ) : (
            <>
              <label htmlFor='service_id'>{t('service') || 'Услуга'}</label>
              <select
                id='service_id'
                className='form-inputs'
                value={selectedServiceId}
                onChange={handleServiceSelect}
                disabled={loading}
              >
                <option value=''>{t('selectService') || 'Выберите услугу'}</option>
                {services.filter(s => String(s.salon_id) === String(salon_id || user?.salon_id)).map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
                ))}
              </select>
            </>
          )}
          <label htmlFor='full_name'>{t('fullName') || 'Полное имя'} *</label>
          <input
            type='text'
            name='full_name'
            id='full_name'
            placeholder={t('enterFullName') || "Введите полное имя"}
            className='form-inputs'
            value={formData.full_name}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label htmlFor='phone'>{t('phoneLabel') || 'Номер телефона'} *</label>
          <input
            type='tel'
            name='phone'
            id='phone'
            className='form-inputs'
            placeholder="+998 90 123 45 67"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={loading}
          />

          <label>{t('selectEmployeeLabel') || 'Выберите сотрудника'} *</label>
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div
              onClick={() => (!loading && !isEmployeeRole) && setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                cursor: (loading || isEmployeeRole) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: '45px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                {selectedEmployee ? (
                  <>
                    <img
                      src={selectedEmployee.avatar_url || selectedEmployee.avatar || selectedEmployee.profile_image || selectedEmployee.photo || '/images/masterImage.png'}
                      alt={selectedEmployee.name}
                      style={{
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #9C2BFF'
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: isMobile ? '4vw' : '0.9vw', fontWeight: '500' }}>
                        {selectedEmployee.name || selectedEmployee.employee_name || `${ts('schedule.employee','Сотрудник')} #${selectedEmployee.id}`}
                      </span>
                      {selectedEmployee.profession && (
                        <span style={{ fontSize: isMobile ? '3.4vw' : '0.75vw', color: '#666' }}>
                          {selectedEmployee.profession}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <span style={{ color: '#999', fontSize: isMobile ? '4vw' : '0.9vw' }}>
                    {t('selectEmployee') || 'Выберите сотрудника'}
                  </span>
                )}
              </div>
              {!isEmployeeRole && (
                <span style={{ fontSize: '1.2vw' }}>
                  {isDropdownOpen ? 
                    <img src="/images/Arrow.png" alt="" style={{transition:"100ms"}} /> :
                    <img src="/images/Arrow.png" alt="" style={{transform:"rotateZ(-90deg)", transition:"200ms"}} />
                  }
                </span>
              )}
            </div>

            {isDropdownOpen && !isEmployeeRole && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginTop: '5px',
                maxHeight: '250px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                {availLoading ? (
                  <div style={{ padding: '15px', textAlign: 'center', color: '#999' }}>Loading...</div>
                ) : filteredEmployees.length === 0 ? (
                  <div style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                    {t('noEmployees') || 'Сотрудники не найдены'}
                  </div>
                ) : (
                  filteredEmployees.map(employee => (
                    <div
                      key={employee.id}
                      onClick={() => handleEmployeeSelect(employee.id)}
                      style={{
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        backgroundColor: String(employee.id) === String(formData.employee_id) ? '#f0f0f0' : 'white',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f8f8'}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = String(employee.id) === String(formData.employee_id) ? '#f0f0f0' : 'white'
                      }}
                    >
                      <img
                        src={employee.avatar_url || employee.avatar || employee.profile_image || employee.photo || '/images/masterImage.png'}
                        alt={employee.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #eee'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: isMobile ? '4vw' : '0.9vw', fontWeight: '500' }}>
                          {employee.name || employee.employee_name || `${t('employee')} #${employee.id}`}
                        </div>
                        {employee.profession && (
                          <div style={{ fontSize: isMobile ? '3.4vw' : '0.75vw', color: '#666' }}>
                            {employee.profession}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {availableSlots.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <label>{t('availableSlots') || 'Доступные слоты'}</label>
              <div ref={timeDropdownRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => setIsTimeDropdownOpen(true)}
                  style={{
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '45px'
                  }}
                >
                  <span style={{ fontSize: isMobile ? '4vw' : '0.9vw' }}>
                    {formData.selected_slot_start
                      ? `${formData.selected_slot_start}`
                      : (t('selectTime') || 'Выберите время')}
                  </span>
                  <span style={{ fontSize: '1.2vw' }}>
                    {isTimeDropdownOpen ? 
                      <img src="/images/Arrow.png" alt="" style={{transition:"100ms"}} /> :
                      <img src="/images/Arrow.png" alt="" style={{transform:"rotateZ(-90deg)", transition:"200ms"}} />
                    }
                  </span>
                </div>
                {isTimeDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    marginTop: '5px',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}
                  onWheel={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  >
                    {availableSlots.map((s, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, selected_slot_start: s.start }))
                          setIsTimeDropdownOpen(false)
                        }}
                        style={{
                          padding: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          cursor: 'pointer',
                          backgroundColor: (formData.selected_slot_start === s.start ? '#f0f0f0' : 'white'),
                          borderBottom: '1px solid #f0f0f0',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f8f8'}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = (formData.selected_slot_start === s.start ? '#f0f0f0' : 'white')
                        }}
                      >
                        <span style={{ fontSize: isMobile ? '4vw' : '0.9vw' }}>{String(s.start || '').substring(0,5)} - {String(s.end || '').substring(0,5)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
            <p style={{ fontSize: isMobile ? '3.6vw' : '0.8vw', margin: '5px 0' }}>
              <strong>{t('modalDate') || 'Дата'}:</strong> {new Date(date).toLocaleDateString('ru-RU')}
            </p>
            <p style={{ fontSize: isMobile ? '3.6vw' : '0.8vw', margin: '5px 0' }}>
              <strong>{t('timeLabel') || 'Время'}:</strong> {String(displayStart || '').substring(0,5)} - {String(displayEnd || '').substring(0,5)}
            </p>
          </div>
        </div>

        <div className='schedule-modal-btns'>
          <button
            onClick={() => setEditModal && setEditModal(false)}
            disabled={loading}
          >
            {t('cancel') || 'Отмена'}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (t('booking') || 'Бронирование...') : (t('save') || 'Забронировать')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookScheduleModal
