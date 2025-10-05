import React, { useState, useEffect } from 'react'
import { UseGlobalContext } from '../Context'

const SelectEmployeeModal = ({ setSelectEmploy, onEmployeeSelect }) => {
  const { employees, fetchEmployees, user } = UseGlobalContext()
  const [selectedEmployees, setSelectedEmployees] = useState([])

  useEffect(() => {
    // Fetch employees when component mounts
    if (user?.salon_id) {
      fetchEmployees(user.salon_id)
    }
  }, [user?.salon_id])

  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId)
      } else {
        return [...prev, employeeId]
      }
    })
  }

  const handleConfirmSelection = () => {
    if (onEmployeeSelect) {
      onEmployeeSelect(selectedEmployees)
    }
    setSelectEmploy(false)
  }



  return (
    <div className='select-employModal'>
      <div className='select-employModal-cont'>
        <div className='select-employModal-top'>
          <button onClick={() => setSelectEmploy(false)}>
            <img src="/images/arrowLeft.png" alt="" />
          </button>
          <h3>
            Выберите обслуживающего
          </h3>
        </div>
        <div className='select-employModal-body' style={{
                  alignItems:"start",
                  rowGap:"0",
                  columnGap:"0",
                  gap:"1vw",
                }}>
          {
            employees && employees.length > 0 ? employees.map((employee) => {
              const isSelected = selectedEmployees.includes(employee.id)
              return (
                <div className='select-employModal-body-item' key={employee.id}>
                  <div className='select-employModal-body-item-top'>
                    <img src="/images/masterImage.png" alt="" />
                    <div>
                      <h4>
                        {employee.employee_name || employee.name}
                      </h4>
                      <p>
                        {employee.position || 'Сотрудник'}
                      </p>
                      <div className='select-employModal-body-item-rating'>
                        <img src="/images/Star1.png" alt="" />
                        <p>
                          4.8 (13 отзывов)
                        </p>
                      </div>
                    </div>
                  </div>
                  <button 
                    id='select-employModal-body-item-btn'
                    onClick={() => handleEmployeeToggle(employee.id)}
                    style={{
                      backgroundColor: isSelected ? '#4CAF50' : '#007bff',
                      color: 'white'
                    }}
                  >
                    {isSelected ? 'Выбрано' : 'Выбрать'}
                  </button>
                </div>
              )
            }) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Сотрудники не найдены</p>
              </div>
            )
          }
        </div>
        
        {selectedEmployees.length > 0 && (
          <div style={{ padding: '20px', borderTop: '1px solid #eee' }}>
            <button 
              onClick={handleConfirmSelection}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Подтвердить выбор ({selectedEmployees.length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SelectEmployeeModal