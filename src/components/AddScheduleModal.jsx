
import { useState, useEffect } from "react"
import { UseGlobalContext } from "../Context"
import SelectEmployeeModal from "./SelectEmployeeModal"
import { v4 as uuidv4 } from 'uuid'

const AddScheduleModal = () => {
    
    const {
        setAddSched,
        createSchedule,
        createService,
        services,
        servicesLoading
    } = UseGlobalContext()

    const [selectEmploy, setSelectEmploy] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        date: '',
        service_id: 1,
        master_list: [],
        price: 10000,
        full_pay: null,
        deposit: null
    })

    const [serviceSuggestions, setServiceSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)

    // Filter services based on input
    useEffect(() => {
        if (formData.name || formData.title) {
            const filtered = services.filter(service => 
                service.name?.toLowerCase().includes(formData.name.toLowerCase()) ||
                service.title?.toLowerCase().includes(formData.title.toLowerCase())
            )
            setServiceSuggestions(filtered)
            setShowSuggestions(filtered.length > 0)
        } else {
            setServiceSuggestions([])
            setShowSuggestions(false)
        }
    }, [formData.name, formData.title, services])

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSuggestionClick = (service) => {
        setFormData(prev => ({
            ...prev,
            name: service.name,
            title: service.title,
            price: service.price || prev.price
        }))
        setShowSuggestions(false)
    }

    const handleEmployeeSelect = (selectedEmployeeIds) => {
        setFormData(prev => ({
            ...prev,
            master_list: selectedEmployeeIds
        }))
    }

    const removeEmployee = (employeeId) => {
        setFormData(prev => ({
            ...prev,
            master_list: prev.master_list.filter(id => id !== employeeId)
        }))
    }

    const handleSaveSchedule = async () => {
        try {
            // Validate required fields
            if (!formData.name || !formData.title || !formData.date) {
                alert('Iltimos, barcha majburiy maydonlarni to\'ldiring')
                return
            }

            // Check if this service already exists
            const existingService = services.find(service => 
                service.name === formData.name && service.title === formData.title
            )

            let serviceId = existingService?.id

            // If service doesn't exist, create it
            if (!existingService) {
                const newService = {
                    id: uuidv4(),
                    name: formData.name,
                    title: formData.title,
                    price: formData.price
                }

                try {
                    const createdService = await createService(newService)
                    serviceId = createdService.id
                    console.log('New service created:', createdService)
                } catch (error) {
                    console.error('Error creating service:', error)
                    // Continue with schedule creation even if service creation fails
                }
            }

            // Create schedule
            const scheduleData = {
                name: formData.name,
                title: formData.title,
                date: formData.date,
                employee_list: formData.master_list,
                price: formData.price,
                full_pay: formData.full_pay,
                deposit: formData.deposit,
                service_id: serviceId
            }

            await createSchedule(scheduleData)
            console.log('Schedule created successfully')
            
            // Close modal
            setAddSched(false)
            
            // Reset form
            setFormData({
                name: '',
                title: '',
                date: '',
                service_id: 1,
                master_list: [],
                price: 10000,
                full_pay: null,
                deposit: null
            })

        } catch (error) {
            console.error('Error saving schedule:', error)
            alert('Jadval saqlashda xatolik yuz berdi')
        }
    }

    return (
        <div className='schedule-modal'>
            <div className='schedule-modal-cont'>
                <h4>
                    Добавить
                </h4>
                <div className='schedule-modal-form'>
                    <label htmlFor="">
                        Занятие
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="text" 
                            placeholder='Занятие 1' 
                            className="form-inputs"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                        {showSuggestions && serviceSuggestions.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                backgroundColor: 'white',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                maxHeight: '150px',
                                overflowY: 'auto',
                                zIndex: 1000,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                                {serviceSuggestions.map((service, index) => (
                                    <div
                                        key={service.id || index}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #eee'
                                        }}
                                        onClick={() => handleSuggestionClick(service)}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                    >
                                        <div style={{ fontWeight: 'bold' }}>{service.name}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{service.title}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <label htmlFor="">
                        Титул
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="text" 
                            placeholder='Титул 1'  
                            className="form-inputs"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                        />
                    </div>
                    
                    <label htmlFor="">
                        Дата
                    </label>
                    <input 
                        type="date"  
                        className="form-inputs"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                    
                </div>
                <div className='schedule-modal-addPersonal'>
                    <label htmlFor="">
                        Обслуживающие
                    </label>
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
                    
                    {/* Selected employees display */}
                    {formData.master_list.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '0.8vw', marginBottom: '5px' }}>Выбранные сотрудники:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {formData.master_list.map((employeeId, index) => (
                                    <span 
                                        key={employeeId}
                                        style={{
                                            backgroundColor: '#9C2BFF',
                                            color: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.7vw',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        Сотрудник {index + 1}
                                        <button
                                            onClick={() => removeEmployee(employeeId)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'white',
                                                cursor: 'pointer',
                                                fontSize: '0.8vw'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <label htmlFor="">
                        Цена услуги
                    </label>
                    <input 
                        type="number" 
                        placeholder='0 UZS'
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                    />
                </div>
                <div className='schedule-modal-paymentType'>
                    <label htmlFor="">
                        Оплата через приложение (необязательно)
                    </label>
                    <div className='schedule-modal-paymentType-cont'>
                        <button 
                            onClick={() => handleInputChange('full_pay', formData.price)}
                            style={{ 
                                backgroundColor: formData.full_pay === formData.price ? '#9C2BFF' : 'transparent',
                                color: formData.full_pay === formData.price ? 'white' : 'black'
                            }}
                        >
                            Полная оплата
                        </button>
                        <button
                            onClick={() => handleInputChange('deposit', Math.floor(formData.price * 0.3))}
                            style={{ 
                                backgroundColor: formData.deposit ? '#9C2BFF' : 'transparent',
                                color: formData.deposit ? 'white' : 'black'
                            }}
                        >
                            Начальный взнос
                        </button>
                        <input 
                            type="number" 
                            placeholder='0 UZS'
                            value={formData.deposit || ''}
                            onChange={(e) => handleInputChange('deposit', parseInt(e.target.value) || null)}
                        />
                    </div>
                </div>
                <div className='schedule-modal-btns'>
                    <button onClick={() => setAddSched(false)}>
                        Отменить
                    </button>
                    <button 
                        onClick={handleSaveSchedule}
                        disabled={servicesLoading}
                    >
                        {servicesLoading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AddScheduleModal