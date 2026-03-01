import { useState, useEffect, useRef } from "react"
import { UseGlobalContext } from "../Context"
import SelectEmployeeModal from "./SelectEmployeeModal"

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const AddScheduleModal = () => {

    const {
        t,
        setAddSched,
        createSchedule,
        user,
        employees,
        employeesBySalon,
        fetchEmployees,
        fetchEmployeeBusySlots,
        checkEmployeeBusyInterval,
        calculateAvailableSlots,
        combinedAppointments,
        schedules
    } = UseGlobalContext()

    const [selectEmploy, setSelectEmploy] = useState(false)
    const [daysDropdownOpen, setDaysDropdownOpen] = useState(false)
    const daysDropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (daysDropdownRef.current && !daysDropdownRef.current.contains(e.target)) {
                setDaysDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const [formData, setFormData] = useState({
        name: '',
        title: '',
        date: '',
        start_time: '',
        end_time: '',
        service_duration: 60,
        repeat: false,
        repeat_value: '',
        repeat_count: 1,
        whole_day: false,
        employee_list: [],
        price: 0,
        full_pay: 0,
        deposit: 0,
        is_active: true
    })

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (user?.salon_id && (!employees || employees.length === 0)) {
            fetchEmployees(user.salon_id)
        }
    }, [user?.salon_id])

    useEffect(() => {
        if (user?.role === 'employee') {
            const selfId = String(user?.id || user?.employee_id || '')
            if (selfId) {
                setFormData(prev => ({
                    ...prev,
                    employee_list: [selfId]
                }))
            }
        }
    }, [user?.role, user?.id, user?.employee_id])


    // end_time ni avtomatik hisoblash
    useEffect(() => {
        if (formData.whole_day) return
        if (formData.start_time && formData.service_duration) {
            const [hours, minutes] = formData.start_time.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + formData.service_duration;
            const endHours = Math.floor(totalMinutes / 60);
            const endMinutes = totalMinutes % 60;
            const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

            setFormData(prev => ({
                ...prev,
                end_time: endTime
            }));
        }
    }, [formData.start_time, formData.service_duration]);

    // whole_day yoqilganda start/end vaqtlarini tozalash
    useEffect(() => {
        if (formData.whole_day) {
            setFormData(prev => ({
                ...prev,
                start_time: '',
                end_time: ''
            }))
        }
    }, [formData.whole_day])

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleEmployeeSelect = (selectedEmployeeIds) => {
        setFormData(prev => ({
            ...prev,
            employee_list: selectedEmployeeIds
        }))
    }

    const removeEmployee = (employeeId) => {
        setFormData(prev => ({
            ...prev,
            employee_list: prev.employee_list.filter(id => id !== employeeId)
        }))
    }

  const handleSaveSchedule = async () => {
    setError('')
    setLoading(true)

    try {
      if (!formData.name?.trim()) {
        throw new Error(t('validation.required'))
      }
            if (!formData.title?.trim()) {
                throw new Error(t('validation.required'))
            }
            if (!formData.date) {
                throw new Error(t('validation.required'))
            }
            if (!formData.whole_day) {
                if (!formData.start_time) {
                    throw new Error(t('validation.required'))
                }
                if (!formData.end_time) {
                    throw new Error(t('validation.required'))
                }
            }
            if (!user?.salon_id) {
                throw new Error(t('errors.salonIdMissing'))
            }

            const loggedEmployeeId = String(user?.id || user?.employee_id || '');
            const selectedEmployees = (Array.isArray(formData.employee_list) && formData.employee_list.length > 0)
              ? formData.employee_list.map(id => String(id))
              : (loggedEmployeeId ? [loggedEmployeeId] : []);

            const scheduleData = {
                salon_id: String(user.salon_id),
                name: String(formData.name).trim(),
                title: String(formData.title).trim(),
                date: String(formData.date),
                start_time: String(formData.whole_day ? '00:00' : formData.start_time),
                end_time: String(formData.whole_day ? '23:59' : formData.end_time),
                service_duration: Number(formData.service_duration),
                repeat: Boolean(formData.repeat),
                repeat_value: String(formData.repeat_value || ''),
                repeat_count: Number(formData.repeat_count) || 1,
                whole_day: Boolean(formData.whole_day),
                employee_list: selectedEmployees,
                price: Number(formData.price) || 0,
                full_pay: Number(formData.full_pay) || 0,
                deposit: Number(formData.deposit) || 0,
                is_active: true
            }

            // Validate each selected employee is free at given time (backend interval check + local slots)
            // whole_day bo'lsa, vaqt bo'yicha tekshiruv o'tkazilmaydi
            if (!formData.whole_day && Array.isArray(formData.employee_list) && formData.employee_list.length > 0) {
                for (const empId of formData.employee_list) {
                    const empObj = (employeesBySalon || employees || []).find(e => String(e.id) === String(empId)) || {}
                    const workStart = empObj.work_start_time || '09:00'
                    const workEnd = empObj.work_end_time || '20:00'
                    // Backend interval tekshiruviga mos (agar endpoint muvaffaqiyatli bo'lsa band deb qabul qilamiz)
                    const intervalBusy = await checkEmployeeBusyInterval(
                        String(empId),
                        String(formData.date),
                        String(formData.start_time),
                        String(formData.end_time)
                    )
                    if (intervalBusy) {
                        const empName = empObj?.name || t('schedule.employee')
                        const msg = `${empName}: ${t('employeeBusy') || 'Tanlangan xodim bu vaqtda band'} (${formData.start_time}-${formData.end_time})`
                        throw new Error(msg)
                    }

                    const busySlots = await fetchEmployeeBusySlots(String(empId), String(formData.date))
                    const employeeAppointments = (combinedAppointments || []).filter(
                        apt => String(apt.employee_id) === String(empId) && String(apt.date) === String(formData.date)
                    )
                    const employeeSchedules = (schedules || []).filter(s =>
                        String(s.date) === String(formData.date) &&
                        Array.isArray(s.employee_list) &&
                        s.employee_list.map(id => String(id)).includes(String(empId))
                    )
                    const scheduleBusySlots = employeeSchedules.map(s => ({ start_time: String(s.start_time), end_time: String(s.end_time) }))
                    const allBusySlots = [...(busySlots || []), ...scheduleBusySlots]
                    const slots = calculateAvailableSlots(
                        workStart,
                        workEnd,
                        allBusySlots,
                        employeeAppointments,
                        Number(formData.service_duration) || 60
                    )
                    const ok = slots.some(s => s.start_time === String(formData.start_time) && s.end_time === String(formData.end_time))
                    if (!ok) {
                        const empName = empObj?.name || t('schedule.employee')
                        const msg = `${empName}: ${t('noFreeSlot') || "Bu interval bo'sh emas"} (${formData.start_time}-${formData.end_time})`
                        throw new Error(msg)
                    }
                }
            }

            const result = await createSchedule(scheduleData)

            alert(t('alerts.scheduleCreated'))

            setAddSched(false)

            setFormData({
                name: '',
                title: '',
                date: '',
                start_time: '',
                end_time: '',
                service_duration: 60,
                repeat: false,
                repeat_value: '',
                repeat_count: 1,
                whole_day: false,
                employee_list: [],
                price: 0,
                full_pay: 0,
                deposit: 0,
                is_active: true
            })

        } catch (error) {
            setError(error.message || t('errors.scheduleCreateFailed'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='schedule-modal'>
            <div className='schedule-modal-cont'>
                {formData.whole_day ? (
                    <div style={{ position: 'absolute', top: '12px', left: '16px', background: '#FFF', color: '#9C2BFF', border: '1px solid #9C2BFF', borderRadius: '12px', padding: '4px 10px', fontSize: '0.8vw' }}>
                        {t('schedule.wholeDay')}
                    </div>
                ) : null}
                <h4>{t('schedule.add')}</h4>

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
                    <label htmlFor="">
                        <input
                            type="checkbox"
                            checked={formData.whole_day}
                            onChange={(e) => handleInputChange('whole_day', e.target.checked)}
                            style={{ marginRight: '8px' }}
                        />
                        {t('schedule.wholeDay')}
                    </label>
                    <label htmlFor="">{t('schedule.lesson')}</label>
                    <input
                        type="text"
                        placeholder={t('schedule.lessonPlaceholder')}
                        className="form-inputs"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                    />

                    <label htmlFor="">{t('schedule.title')}</label>
                    <input
                        type="text"
                        placeholder={t('schedule.titlePlaceholder')}
                        className="form-inputs"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        required
                    />

                    <label htmlFor="">{t('schedule.date')}</label>
                    <input
                        type="date"
                        className="form-inputs"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        required
                    />

                    <label htmlFor="">{t('schedule.serviceDuration') || 'Xizmat davomiyligi'}</label>
                    <select
                        className="form-inputs"
                        value={formData.service_duration}
                        onChange={(e) => handleInputChange('service_duration', Number(e.target.value))}
                        required
                    >
                        <option value={30}>30 {t('minutes') || 'daqiqa'}</option>
                        <option value={60}>60 {t('minutes') || 'daqiqa'}</option>
                        <option value={90}>90 {t('minutes') || 'daqiqa'}</option>
                        <option value={120}>120 {t('minutes') || 'daqiqa'}</option>
                        <option value={150}>150 {t('minutes') || 'daqiqa'}</option>
                        <option value={180}>180 {t('minutes') || 'daqiqa'}</option>
                        <option value={210}>210 {t('minutes') || 'daqiqa'}</option>
                        <option value={240}>240 {t('minutes') || 'daqiqa'}</option>
                    </select>

                    {!formData.whole_day && (
                        <>
                            <label htmlFor="">{t('schedule.startTime')}</label>
                            <input
                                type="time"
                                className="form-inputs"
                                value={formData.start_time}
                                onChange={(e) => handleInputChange('start_time', e.target.value)}
                                required
                            />
                        </>
                    )}

                    {!formData.whole_day && (
                        <>
                            <label htmlFor="">{t('schedule.endTime')}</label>
                            <input
                                type="time"
                                className="form-inputs"
                                value={formData.end_time}
                                onChange={(e) => handleInputChange('end_time', e.target.value)}
                                disabled
                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                required
                            />
                        </>
                    )}

                    <label htmlFor="">
                        <input
                            type="checkbox"
                            checked={formData.repeat}
                            onChange={(e) => handleInputChange('repeat', e.target.checked)}
                            style={{ marginRight: '8px' }}
                        />
                        {t('schedule.repeat')}
                    </label>

                    {formData.repeat && (
                        <>
                            <label>{t('schedule.repeatEvery')}</label>
                            <div ref={daysDropdownRef} style={{ position: 'relative' }}>
                                <div
                                    onClick={() => setDaysDropdownOpen(!daysDropdownOpen)}
                                    className="form-inputs"
                                    style={{
                                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', paddingRight: '1vw'
                                    }}
                                >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {formData.repeat_value
                                            ? formData.repeat_value.split(',').map(d => t(`schedule.${d.trim()}`)).join(', ')
                                            : t('schedule.selectDays')}
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#999' }}>{daysDropdownOpen ? '\u25B2' : '\u25BC'}</span>
                                </div>
                                {daysDropdownOpen && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                        backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto'
                                    }}>
                                        {WEEKDAYS.map(day => {
                                            const selected = formData.repeat_value ? formData.repeat_value.split(',').map(d => d.trim()).includes(day) : false
                                            return (
                                                <label key={day} style={{
                                                    display: 'flex', alignItems: 'center', padding: '8px 12px',
                                                    cursor: 'pointer', gap: '8px', borderBottom: '1px solid #f0f0f0'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selected}
                                                        onChange={() => {
                                                            const current = formData.repeat_value ? formData.repeat_value.split(',').map(d => d.trim()).filter(Boolean) : []
                                                            const updated = selected
                                                                ? current.filter(d => d !== day)
                                                                : [...current, day]
                                                            handleInputChange('repeat_value', updated.join(','))
                                                        }}
                                                    />
                                                    {t(`schedule.${day}`)}
                                                </label>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                            <label>{t('schedule.repeatCount') || 'Necha marta takrorlansin'}</label>
                            <input
                                type="number"
                                className="form-inputs"
                                min={1}
                                max={100}
                                value={formData.repeat_count}
                                onChange={(e) => handleInputChange('repeat_count', Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </>
                    )}
                </div>

                <div className='schedule-modal-addPersonal'>
                    <label htmlFor="">{t('schedule.staff')}</label>
                    {user?.role !== 'employee' && (
                        <button onClick={() => setSelectEmploy(true)}>
                            <img src="/images/+.png" alt="" />
                            {t('schedule.addStaff')}
                        </button>
                    )}
                    {selectEmploy && (
                        <SelectEmployeeModal
                            setSelectEmploy={setSelectEmploy}
                            onEmployeeSelect={handleEmployeeSelect}
                            date={formData.date}
                            start_time={formData.start_time}
                            end_time={formData.end_time}
                            initialSelected={formData.employee_list}
                        />
                    )}
                    {formData.employee_list.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '0.8vw', marginBottom: '5px' }}>
                                {t('schedule.selectedStaff')}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {formData.employee_list.map((employeeId) => {
                                    const emp = (employeesBySalon || employees || []).find(e => String(e.id) === String(employeeId));
                                    const displayName = emp?.name || emp?.employee_name || t('schedule.employee');
                                    const avatarSrc = emp?.avatar_url || emp?.avatar || emp?.profile_image || emp?.photo || '/images/masterImage.png';
                                    return (
                                        <div style={{ display: "flex", flexDirection: "column" }} key={employeeId}>
                                            <div
                                                style={{
                                                    backgroundColor: '#FFF',
                                                    color: '#9C2BFF',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.7vw',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                <img
                                                    src={avatarSrc}
                                                    alt={displayName}
                                                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                                <span>{displayName}</span>
                                            </div>
                                            <div className='masters-time' style={{ color: '#555' }}>
                                                <p style={{ margin: 0 }}>
                                                    {formData.whole_day ? t('schedule.wholeDay') : `${formData.start_time} - ${formData.end_time}`}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <label htmlFor="">{t('schedule.servicePrice')}</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder={t('schedule.pricePlaceholder')}
                        value={formData.price === 0 ? '' : formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value.replace(/[^0-9]/g, '') || 0)}
                    />
                </div>

                {/* Full Payment / Deposit — hozircha yashirilgan
                <div className='schedule-modal-paymentType'>
                    <label htmlFor="">{t('schedule.paymentOptional')}</label>
                    <div className='schedule-modal-paymentType-cont'>
                        <button
                            onClick={() => {
                                handleInputChange('full_pay', formData.price)
                                handleInputChange('deposit', 0)
                            }}
                            style={{
                                backgroundColor: formData.full_pay > 0 ? '#9C2BFF' : 'transparent',
                                color: formData.full_pay > 0 ? 'white' : 'black'
                            }}
                        >
                            {t('schedule.fullPayment')}
                        </button>
                        <button
                            onClick={() => {
                                const depositAmount = Math.floor(formData.price * 0.3)
                                handleInputChange('deposit', depositAmount)
                                handleInputChange('full_pay', 0)
                            }}
                            style={{
                                backgroundColor: formData.deposit > 0 ? '#9C2BFF' : 'transparent',
                                color: formData.deposit > 0 ? 'white' : 'black'
                            }}
                        >
                            {t('schedule.deposit')}
                        </button>
                        <input
                            type="number"
                            placeholder={t('schedule.pricePlaceholder')}
                            value={formData.deposit || ''}
                            onChange={(e) => handleInputChange('deposit', e.target.value)}
                        />
                    </div>
                </div>
                */}

                <div className='schedule-modal-btns'>
                    <button
                        onClick={() => setAddSched(false)}
                        disabled={loading}
                    >
                        {t('schedule.cancel')}
                    </button>
                    <button
                        onClick={handleSaveSchedule}
                        disabled={loading}
                    >
                        {loading ? t('schedule.saving') : t('schedule.save')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddScheduleModal
