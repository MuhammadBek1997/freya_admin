import React, { useState, useEffect, useRef } from 'react';
import { UseGlobalContext } from '../Context';
import SelectEmployeeModal from './SelectEmployeeModal';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const EditScheduleModal = (props) => {
    const {
        id,
        name,
        title,
        date,
        start_time = '',
        end_time = '',
        repeat = false,
        repeat_value = '',
        employee_list = [],
        price = 0,
        full_pay = 0,
        deposit = 0,
        is_active = true,
        setEditModal
    } = props;

    const { updateSchedule, employees, employeesBySalon, t, ts, fetchEmployeeBusySlots, calculateAvailableSlots, combinedAppointments, schedules, checkEmployeeBusyInterval } = UseGlobalContext();

    const [selectEmploy, setSelectEmploy] = useState(false);
    const [daysDropdownOpen, setDaysDropdownOpen] = useState(false);
    const daysDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (daysDropdownRef.current && !daysDropdownRef.current.contains(e.target)) {
                setDaysDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [formData, setFormData] = useState({
        name: name || '',
        title: title || '',
        date: date || '',
        start_time: start_time || '',
        end_time: end_time || '',
        repeat: Boolean(repeat),
        repeat_value: repeat_value || '',
        employee_list: Array.isArray(employee_list) ? employee_list : [],
        price: Number(price) || 0,
        full_pay: Number(full_pay) || 0,
        deposit: Number(deposit) || 0,
        is_active: Boolean(is_active)
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEmployeeSelect = (selectedEmployeeIds) => {
        setFormData(prev => ({
            ...prev,
            employee_list: selectedEmployeeIds
        }));
    };

    

    const handleUpdateSchedule = async () => {
        setError('');
        setLoading(true);

        try {
            if (!formData.name?.trim()) throw new Error(t('validation.required') || 'Занятие majburiy');
            if (!formData.title?.trim()) throw new Error(t('titleRequired') || 'Титул majburiy');
            if (!formData.start_time) throw new Error(t('startTimeRequired') || 'Время начала majburiy');
            if (!formData.end_time) throw new Error(t('endTimeRequired') || 'Время окончания majburiy');

            const scheduleData = {
                name: String(formData.name).trim(),
                title: String(formData.title).trim(),
                start_time: String(formData.start_time),
                end_time: String(formData.end_time),
                repeat: Boolean(formData.repeat),
                repeat_value: String(formData.repeat_value || ''),
                employee_list: Array.isArray(formData.employee_list)
                    ? formData.employee_list.map(id => String(id))
                    : [],
                price: Number(formData.price) || 0,
                full_pay: Number(formData.full_pay) || 0,
                deposit: Number(formData.deposit) || 0,
                is_active: Boolean(formData.is_active)
            };

            // Validate each selected employee is free at given time
            if (Array.isArray(formData.employee_list) && formData.employee_list.length > 0) {
                for (const empId of formData.employee_list) {
                    const empObj = (employeesBySalon || employees || []).find(e => String(e.id) === String(empId)) || {}
                    const workStart = empObj.work_start_time || '09:00'
                    const workEnd = empObj.work_end_time || '20:00'
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
                        s.employee_list.map(id => String(id)).includes(String(empId)) &&
                        String(s.id) !== String(id)
                    )
                    const scheduleBusySlots = employeeSchedules.map(s => ({ start_time: String(s.start_time), end_time: String(s.end_time) }))
                    const allBusySlots = [...(busySlots || []), ...scheduleBusySlots]
                    const slots = calculateAvailableSlots(
                        workStart,
                        workEnd,
                        allBusySlots,
                        employeeAppointments,
                        Number(formData.service_duration) || (Number(props.service_duration) || 60)
                    )
                    const ok = slots.some(s => s.start_time === String(formData.start_time) && s.end_time === String(formData.end_time))
                    if (!ok) {
                        const empName = empObj?.name || t('schedule.employee')
                        const msg = `${empName}: ${t('employeeBusy') || 'Tanlangan xodim bu vaqtda band'} (${formData.start_time}-${formData.end_time})`
                        throw new Error(msg)
                    }
                }
            }

            await updateSchedule(id, scheduleData);

            alert(t('scheduleUpdated') || 'Jadval muvaffaqiyatli yangilandi!');
            if (typeof setEditModal === 'function') {
                setEditModal(false);
            }
        } catch (error) {
            setError(error.message || t('errors.scheduleCreateFailed') || 'Jadval yangilashda xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='schedule-modal' onClick={() => typeof setEditModal === 'function' && setEditModal(false)}>
            <div className='schedule-modal-cont' onClick={(e) => e.stopPropagation()}>
                <h4>{t('modalEdit') || 'Редактировать'}</h4>

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
                    <label htmlFor=''>{t('schedule.lesson') || 'Занятие'} *</label>
                    <input
                        type='text'
                        placeholder={t('schedule.lessonPlaceholder') || 'Занятие 1'}
                        className='form-inputs'
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                    />

                    <label htmlFor=''>{t('schedule.title') || 'Титул'} *</label>
                    <input
                        type='text'
                        placeholder={t('schedule.titlePlaceholder') || 'Титул 1'}
                        className='form-inputs'
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        required
                    />

                    <label htmlFor=''>{t('schedule.date') || 'Дата'} *</label>
                    <input
                        type='date'
                        className='form-inputs'
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        required
                    />

                    <label htmlFor=''>{t('schedule.startTime') || 'Время начала'} *</label>
                    <input
                        type='time'
                        className='form-inputs'
                        value={formData.start_time}
                        onChange={(e) => handleInputChange('start_time', e.target.value)}
                        required
                    />

                    <label htmlFor=''>{t('schedule.endTime') || 'Время окончания'} *</label>
                    <input
                        type='time'
                        className='form-inputs'
                        value={formData.end_time}
                        onChange={(e) => handleInputChange('end_time', e.target.value)}
                        required
                    />

                    <label htmlFor=''>
                        <input
                            type='checkbox'
                            checked={formData.repeat}
                            onChange={(e) => handleInputChange('repeat', e.target.checked)}
                            style={{ marginRight: '8px' }}
                        />
                        {t('schedule.repeat') || 'Повторить'}
                    </label>

                    {formData.repeat && (
                        <>
                            <label>{t('schedule.repeatEvery') || 'Повторить каждые'}</label>
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
                                            : (t('schedule.selectDays') || 'Выберите дни')}
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
                                            const selected = formData.repeat_value ? formData.repeat_value.split(',').map(d => d.trim()).includes(day) : false;
                                            return (
                                                <label key={day} style={{
                                                    display: 'flex', alignItems: 'center', padding: '8px 12px',
                                                    cursor: 'pointer', gap: '8px', borderBottom: '1px solid #f0f0f0'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selected}
                                                        onChange={() => {
                                                            const current = formData.repeat_value ? formData.repeat_value.split(',').map(d => d.trim()).filter(Boolean) : [];
                                                            const updated = selected
                                                                ? current.filter(d => d !== day)
                                                                : [...current, day];
                                                            handleInputChange('repeat_value', updated.join(','));
                                                        }}
                                                    />
                                                    {t(`schedule.${day}`) || day}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className='schedule-modal-addPersonal'>
                    <label htmlFor=''>{t('schedule.staff') || 'Обслуживающие'}</label>
                    <button onClick={() => setSelectEmploy(true)}>
                        <img src='/images/+.png' alt='' />
                        {t('schedule.addStaff') || 'добавить'}
                    </button>

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

                    {Array.isArray(formData.employee_list) && formData.employee_list.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '0.8vw', marginBottom: '5px' }}>
                                {t('schedule.selectedStaff') || 'Выбранные сотрудники:'}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {formData.employee_list.map((employeeId) => {
                                    const emp = (employeesBySalon || employees || []).find(e => String(e.id) === String(employeeId));
                                    const displayName = emp?.name || emp?.employee_name || ts('schedule.employee','Сотрудник');
                                    const avatarSrc = emp?.avatar_url || emp?.photo || '/images/masterImage.png';
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
                                                    {formData.start_time} - {formData.end_time}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <label htmlFor=''>{t('schedule.servicePrice') || 'Цена услуги'}</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder={t('schedule.pricePlaceholder') || '0 UZS'}
                        value={formData.price === 0 ? '' : formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value.replace(/[^0-9]/g, '') || 0)}
                    />
                </div>

                {/* Full Payment / Deposit — hozircha yashirilgan
                <div className='schedule-modal-paymentType'>
                    <label htmlFor="">{t('schedule.paymentOptional') || 'Оплата через приложение (необязательно)'}</label>
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
                            {t('schedule.fullPayment') || 'Полная оплата'}
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
                            {t('schedule.deposit') || 'Начальный взнос'}
                        </button>
                        <input
                            type="number"
                            placeholder={t('schedule.pricePlaceholder') || '0 UZS'}
                            value={formData.deposit || ''}
                            onChange={(e) => handleInputChange('deposit', e.target.value)}
                        />
                    </div>
                </div>
                */}

                <div className='schedule-modal-btns'>
                    <button onClick={() => typeof setEditModal === 'function' && setEditModal(false)} disabled={loading}>
                        {t('schedule.cancel') || 'Отменить'}
                    </button>
                    <button onClick={handleUpdateSchedule} disabled={loading}>
                        {loading ? (t('schedule.saving') || 'Сохранение...') : (t('schedule.save') || 'Сохранить')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditScheduleModal;
