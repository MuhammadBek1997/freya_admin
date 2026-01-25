import React, { useEffect, useState } from 'react';
import { UseGlobalContext } from '../Context';

const EditEmployeeBar = ({ employee, onClose }) => {
  const { updateEmployee, fetchEmployees, t } = UseGlobalContext();
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

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        surname: employee.surname || '',
        phone: employee.phone || '',
        email: employee.email || '',
        profession: employee.profession || '',
        username: employee.username || '',
        password: ''
      });
    }
  }, [employee]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      if (!employee?.id) {
        throw new Error(t('employeeIdNotFound') || 'Employee ID topilmadi');
      }

      if (!formData.name.trim()) {
        throw new Error(t('validation.required') || 'Ism majburiy');
      }

      const updateData = {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        profession: formData.profession.trim(),
        username: formData.username.trim()
      };

      await updateEmployee(employee.id, updateData);
      await fetchEmployees();
      onClose();

    } catch (err) {
      setError(err.message || t('updateError') || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editEmployeeBar">
      <div className="editEmployeeBar-cont">
        <img src={employee?.avatar_url || employee?.avatar || employee?.profile_image || employee?.photo || "/images/masterImage.png"} alt="" className="editEmployeeBar-cont-img" />
        <div className="editEmployeeBar-rating">
          <img src="/images/Star1.png" alt="" />
          <p>4.5 (12 {t('profileReviews') || 'отзывов'})</p>
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
          <label>{t('employee.nameLabel') || 'Имя'} *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={loading}
          />

          <label>{t('surname') || 'Фамилия'}</label>
          <input
            type="text"
            value={formData.surname}
            onChange={(e) => handleChange('surname', e.target.value)}
            disabled={loading}
          />

          <label>{t('employee.phoneLabel') || 'Номер телефона'}</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={loading}
            placeholder="+998901234567"
          />

          <label>{t('employee.emailLabel') || 'Электронная почта'}</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={loading}
            placeholder="example@email.com"
          />

          <label>{t('employee.positionLabel') || 'Профессия'}</label>
          <input
            type="text"
            value={formData.profession}
            onChange={(e) => handleChange('profession', e.target.value)}
            disabled={loading}
            placeholder="Hair, Nails, etc."
          />

          <label>{t('employee.usernameLabel') || 'Имя пользователя'}</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            disabled={loading}
          />

          <label>{t('passwordOptional') || 'Пароль (оставьте пустым, если не хотите менять)'}</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            disabled={loading}
            placeholder={t('newPassword') || 'Новый пароль'}
          />
        </div>

        <div className="editEmployeeBar-cont-bottom">
          <button 
            className="editEmployeeBar-cont-bottom-cancel" 
            onClick={onClose}
            disabled={loading}
          >
            {t('cancel') || 'Отменить'}
          </button>
          <button 
            className="editEmployeeBar-cont-bottom-save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (t('saving') || 'Сохранение...') : (t('save') || 'Сохранить')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeBar;