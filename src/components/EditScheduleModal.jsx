import React, { useState } from 'react';
import { UseGlobalContext } from '../Context';
import SelectEmployeeModal from './SelectEmployeeModal';

const EditScheduleModal = (props) => {
    const {
        id,
        salon_id,
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

    const { updateSchedule, user, employees, t } = UseGlobalContext();

    const [selectEmploy, setSelectEmploy] = useState(false);
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

    const removeEmployee = (employeeId) => {
        setFormData(prev => ({
            ...prev,
            employee_list: prev.employee_list.filter(id => id !== employeeId)
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

            await updateSchedule(id, scheduleData);

            alert(t('scheduleUpdated') || 'Jadval muvaffaqiyatli yangilandi!');
            if (typeof setEditModal === 'function') {
                setEditModal(false);
            }
        } catch (error) {
            console.error('❌ Jadval yangilashda xatolik:', error);
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
                            <label htmlFor=''>{t('schedule.repeatEvery') || 'Повторить каждые'}</label>
                            <input
                                type='text'
                                placeholder={t('schedule.repeatPlaceholder') || 'например: 1 неделя'}
                                className='form-inputs'
                                value={formData.repeat_value}
                                onChange={(e) => handleInputChange('repeat_value', e.target.value)}
                            />
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
                        />
                    )}

                    {Array.isArray(formData.employee_list) && formData.employee_list.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '0.8vw', marginBottom: '5px' }}>
                                {t('schedule.selectedStaff') || 'Выбранные сотрудники:'}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {formData.employee_list.map((employeeId) => {
                                    const emp = employees?.find(e => String(e.id) === String(employeeId));
                                    const displayName = emp?.name || emp?.employee_name || t('employee') || 'Сотрудник';
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
                        type='number'
                        placeholder={t('schedule.pricePlaceholder') || '0 UZS'}
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                    />
                </div>

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