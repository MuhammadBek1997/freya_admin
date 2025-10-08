import React, { useState, useEffect, useRef } from 'react'
import { useI18n } from '../hooks/useI18n'
import { UseGlobalContext } from '../Context'

const BookScheduleModal = (props) => {
  const {
    id,
    salon_id,
    date,
    start_time,
    end_time,
    setEditModal
  } = props

  const { t } = useI18n()
  const { user, employees, fetchEmployees } = UseGlobalContext()

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    employee_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (employees.length === 0) {
      fetchEmployees()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      if (!token) throw new Error(t('tokenNotFound') || 'Token topilmadi')

      const resolvedSalonId = salon_id || user?.salon_id
      if (!resolvedSalonId) throw new Error(t('errors.salonIdMissing') || 'Salon ID topilmadi')

      const scheduleDate = new Date(date)
      const [hours, minutes] = start_time.split(':')
      scheduleDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      const bookingData = {
        salon_id: resolvedSalonId,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        time: scheduleDate.toISOString(),
        employee_id: parseInt(formData.employee_id)
      }

      const response = await fetch('https://freya-salon-backend-cc373ce6622a.herokuapp.com/api/schedules/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` } : {})
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || errorData.message || t('bookingFailed') || 'Booking failed')
      }

      const data = await response.json()
      alert(t('bookingSuccess') || 'Бронирование успешно создано!')
      if (typeof setEditModal === 'function') setEditModal(false)
    } catch (e) {
      console.error('❌ Xatolik:', e)
      setError(e.message || t('savingError') || 'Saqlashda xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(emp => emp.salon_id === (salon_id || user?.salon_id))
  const selectedEmployee = formData.employee_id 
    ? filteredEmployees.find(e => String(e.id) === String(formData.employee_id))
    : null

  return (
    <div className='editSchedule-modal'>
      <div className='editSchedule-modal-cont'>
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
              onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: '10px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
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
                      src={selectedEmployee.photo || selectedEmployee.avatar || '/images/masterImage.png'}
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
                      <span style={{ fontSize: '0.9vw', fontWeight: '500' }}>
                        {selectedEmployee.name || selectedEmployee.employee_name || `${t('employee')} #${selectedEmployee.id}`}
                      </span>
                      {selectedEmployee.profession && (
                        <span style={{ fontSize: '0.75vw', color: '#666' }}>
                          {selectedEmployee.profession}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <span style={{ color: '#999', fontSize: '0.9vw' }}>
                    {t('selectEmployee') || 'Выберите сотрудника'}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '1.2vw' }}>
                {isDropdownOpen ? 
                  <img src="/images/Arrow.png" alt="" style={{transition:"100ms"}} /> :
                  <img src="/images/Arrow.png" alt="" style={{transform:"rotateZ(-90deg)", transition:"200ms"}} />
                }
              </span>
            </div>

            {isDropdownOpen && (
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
                {filteredEmployees.length === 0 ? (
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
                        backgroundColor: employee.id === parseInt(formData.employee_id) ? '#f0f0f0' : 'white',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f8f8'}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = employee.id === parseInt(formData.employee_id) ? '#f0f0f0' : 'white'
                      }}
                    >
                      <img
                        src={employee.photo || employee.avatar || '/images/masterImage.png'}
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
                        <div style={{ fontSize: '0.9vw', fontWeight: '500' }}>
                          {employee.name || employee.employee_name || `${t('employee')} #${employee.id}`}
                        </div>
                        {employee.profession && (
                          <div style={{ fontSize: '0.75vw', color: '#666' }}>
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

          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
            <p style={{ fontSize: '0.8vw', margin: '5px 0' }}>
              <strong>{t('modalDate') || 'Дата'}:</strong> {new Date(date).toLocaleDateString('ru-RU')}
            </p>
            <p style={{ fontSize: '0.8vw', margin: '5px 0' }}>
              <strong>{t('timeLabel') || 'Время'}:</strong> {start_time} - {end_time}
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