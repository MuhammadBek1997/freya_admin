import { useState, useEffect } from "react"
import { UseGlobalContext } from "../Context"
import SelectEmployeeModal from "./SelectEmployeeModal"

const AddScheduleModal = () => {
    
    const {
        setAddSched,
        createSchedule,
        user,
        employees,
        fetchEmployees
    } = UseGlobalContext()

    const [selectEmploy, setSelectEmploy] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        date: '',
        start_time: '',
        end_time: '',
        repeat: false,
        repeat_value: '',
        employee_list: [],
        price: 0,
        full_pay: 0,
        deposit: 0,
        is_active: true
    })

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Ensure employees are loaded for displaying avatars and names
    useEffect(() => {
        if (user?.salon_id && (!employees || employees.length === 0)) {
            fetchEmployees(user.salon_id)
        }
    }, [user?.salon_id])

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
        // Validation
        if (!formData.name?.trim()) {
            throw new Error('Занятие majburiy')
        }
        if (!formData.title?.trim()) {
            throw new Error('Титул majburiy')
        }
        if (!formData.date) {
            throw new Error('Дата majburiy')
        }
        if (!formData.start_time) {
            throw new Error('Время начала majburiy')
        }
        if (!formData.end_time) {
            throw new Error('Время окончания majburiy')
        }
        if (!user?.salon_id) {
            throw new Error('Salon ID topilmadi')
        }

        // DEBUG: Input ma'lumotlarini ko'rish
        console.log('🔍 FORM DATA:', formData)
        console.log('🔍 TYPES BEFORE:', {
            price: typeof formData.price,
            full_pay: typeof formData.full_pay,
            deposit: typeof formData.deposit,
            price_value: formData.price,
            full_pay_value: formData.full_pay,
            deposit_value: formData.deposit
        })

        // Backend formatiga mos data - EXPLICIT INTEGER konvertatsiya
        const scheduleData = {
            salon_id: String(user.salon_id), // UUID string
            name: String(formData.name).trim(),
            title: String(formData.title).trim(),
            date: String(formData.date),
            start_time: String(formData.start_time),
            end_time: String(formData.end_time),
            repeat: Boolean(formData.repeat),
            repeat_value: String(formData.repeat_value || ''),
            employee_list: Array.isArray(formData.employee_list) ? formData.employee_list.map(id => String(id)) : [],
            price: Number(formData.price) || 0,
            full_pay: Number(formData.full_pay) || 0,
            deposit: Number(formData.deposit) || 0,
            is_active: true
        }

        console.log('📤 YUBORILAYOTGAN DATA:', scheduleData)
        console.log('📊 TYPES AFTER:', {
            price: typeof scheduleData.price,
            full_pay: typeof scheduleData.full_pay,
            deposit: typeof scheduleData.deposit,
            price_value: scheduleData.price,
            full_pay_value: scheduleData.full_pay,
            deposit_value: scheduleData.deposit
        })

        // Backend'ga jo'natish
        const result = await createSchedule(scheduleData)
        
        console.log('✅ Muvaffaqiyatli:', result)
        
        alert('Jadval muvaffaqiyatli yaratildi!')
        
        // Modal yopish
        setAddSched(false)
        
        // Form tozalash
        setFormData({
            name: '',
            title: '',
            date: '',
            start_time: '',
            end_time: '',
            repeat: false,
            repeat_value: '',
            employee_list: [],
            price: 0,
            full_pay: 0,
            deposit: 0,
            is_active: true
        })

    } catch (error) {
        console.error('❌ XATOLIK:', error)
        setError(error.message || 'Jadval saqlashda xatolik yuz berdi')
    } finally {
        setLoading(false)
    }
}

    return (
        <div className='schedule-modal'>
            <div className='schedule-modal-cont'>
                <h4>Добавить</h4>
                
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
                    <label htmlFor="">Занятие *</label>
                    <input 
                        type="text" 
                        placeholder='Занятие 1' 
                        className="form-inputs"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                    />
                    
                    <label htmlFor="">Титул *</label>
                    <input 
                        type="text" 
                        placeholder='Титул 1'  
                        className="form-inputs"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        required
                    />
                    
                    <label htmlFor="">Дата *</label>
                    <input 
                        type="date"  
                        className="form-inputs"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        required
                    />

                    <label htmlFor="">Время начала *</label>
                    <input 
                        type="time"  
                        className="form-inputs"
                        value={formData.start_time}
                        onChange={(e) => handleInputChange('start_time', e.target.value)}
                        required
                    />

                    <label htmlFor="">Время окончания *</label>
                    <input 
                        type="time"  
                        className="form-inputs"
                        value={formData.end_time}
                        onChange={(e) => handleInputChange('end_time', e.target.value)}
                        required
                    />
                    
                    <label htmlFor="">
                        <input 
                            type="checkbox"
                            checked={formData.repeat}
                            onChange={(e) => handleInputChange('repeat', e.target.checked)}
                            style={{ marginRight: '8px' }}
                        />
                        Повторить
                    </label>
                    
                    {formData.repeat && (
                        <>
                            <label htmlFor="">Повторить каждые</label>
                            <input 
                                type="text"
                                placeholder="например: 1 неделя"
                                className="form-inputs"
                                value={formData.repeat_value}
                                onChange={(e) => handleInputChange('repeat_value', e.target.value)}
                            />
                        </>
                    )}
                </div>

                <div className='schedule-modal-addPersonal'>
                    <label htmlFor="">Обслуживающие</label>
                    <button onClick={() => setSelectEmploy(true)}>
                        <img src="/images/+.png" alt="" />
                        добавить
                    </button>
                    {selectEmploy && (
                        <SelectEmployeeModal 
                            setSelectEmploy={setSelectEmploy}
                            onEmployeeSelect={handleEmployeeSelect}
                        />
                    )}
                    {formData.employee_list.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '0.8vw', marginBottom: '5px' }}>
                                Выбранные сотрудники:
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {formData.employee_list.map((employeeId) => {
                                    const emp = employees?.find(e => String(e.id) === String(employeeId));
                                    const displayName = emp?.name || emp?.employee_name || 'Сотрудник';
                                    const avatarSrc = emp?.avatar_url || emp?.photo || '/images/masterImage.png';
                                    return (
                                        <div style={{display:"flex",flexDirection:"column"}}>
                                            <div
                                                key={employeeId}
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
                    <label htmlFor="">Цена услуги</label>
                    <input 
                        type="number" 
                        placeholder='0 UZS'
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                    />
                </div>

                <div className='schedule-modal-paymentType'>
                    <label htmlFor="">Оплата через приложение (необязательно)</label>
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
                            Полная оплата
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
                            Начальный взнос
                        </button>
                        <input 
                            type="number" 
                            placeholder='0 UZS'
                            value={formData.deposit || ''}
                            onChange={(e) => handleInputChange('deposit', e.target.value)}
                        />
                    </div>
                </div>

                <div className='schedule-modal-btns'>
                    <button 
                        onClick={() => setAddSched(false)}
                        disabled={loading}
                    >
                        Отменить
                    </button>
                    <button 
                        onClick={handleSaveSchedule}
                        disabled={loading}
                    >
                        {loading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddScheduleModal