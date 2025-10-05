// EditEmployeeBar.jsx - To'liq yangilangan versiya
import React, { useEffect, useState } from 'react';
import { UseGlobalContext } from '../Context';

const EditEmployeeBar = ({ employee, onClose }) => {
  const { updateEmployee, fetchEmployees } = UseGlobalContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    email: '',
    profession: '',
    username: '',
    password: ''
  });

  // Employee props'dan ma'lumotlarni yuklash
  useEffect(() => {
    if (employee) {
      console.log('📥 Employee data:', employee);
      
      setFormData({
        name: employee.name || '',
        surname: employee.surname || '',
        phone: employee.phone || '',
        email: employee.email || '',
        profession: employee.profession || '',
        username: employee.username || '',
        password: '' // Password hech qachon to'ldirilmaydi (xavfsizlik uchun)
      });
    }
  }, [employee]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Xatoni tozalash
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      if (!employee?.id) {
        throw new Error('Employee ID topilmadi');
      }

      // Validatsiya
      if (!formData.name.trim()) {
        throw new Error('Ism majburiy');
      }
      // Update data tayyorlash (backend EmployeeUpdate schema bilan mos)
      const updateData = {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        profession: formData.profession.trim(),
        username: formData.username.trim()
      };

      console.log('📤 Updating employee:', updateData);

      await updateEmployee(employee.id, updateData);

      console.log('✅ Employee updated successfully');
      
      // Employees list'ni qayta yuklash
      await fetchEmployees();
      
      // Sidebar'ni yopish
      onClose();

    } catch (err) {
      console.error('❌ Error updating employee:', err);
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editEmployeeBar">
      <div className="editEmployeeBar-cont">
        <img src="/images/masterImage.png" alt="" className="editEmployeeBar-cont-img" />
        <div className="editEmployeeBar-rating">
          <img src="/images/Star1.png" alt="" />
          <p>4.5 (12 отзывов)</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#ff000020',
            color: '#ff0000',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '10px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div className="editEmployeeBar-cont-info">
          <label>Имя *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={loading}
          />

          <label>Фамилия</label>
          <input
            type="text"
            value={formData.surname}
            onChange={(e) => handleChange('surname', e.target.value)}
            disabled={loading}
          />

          <label>Номер телефона</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={loading}
            placeholder="+998901234567"
          />

          <label>Электронная почта</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={loading}
            placeholder="example@email.com"
          />

          <label>Профессия</label>
          <input
            type="text"
            value={formData.profession}
            onChange={(e) => handleChange('profession', e.target.value)}
            disabled={loading}
            placeholder="Hair, Nails, etc."
          />

          <label>Имя пользователя</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            disabled={loading}
          />

          <label>Пароль (оставьте пустым, если не хотите менять)</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            disabled={loading}
            placeholder="Новый пароль"
          />
        </div>

        <div className="editEmployeeBar-cont-bottom">
          <button 
            className="editEmployeeBar-cont-bottom-cancel" 
            onClick={onClose}
            disabled={loading}
          >
            Отменить
          </button>
          <button 
            className="editEmployeeBar-cont-bottom-save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeBar;