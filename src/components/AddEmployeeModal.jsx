import React, { useState, useEffect } from 'react';
import { UseGlobalContext } from '../Context';
import '../styles/AddEmployeeModal.css';

const AddEmployeeModal = ({ onClose, onEmployeeAdded }) => {
  const { t, createEmployee, user } = UseGlobalContext();
  
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_phone: '',
    employee_email: '',
    position: '',
    username: '',
    employee_password: '',
    full_name: '',
    role: 'employee'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ESC tugmasi bilan yopish
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Frontend required field validation to prevent 4xx errors
      if (!formData.employee_name || !formData.employee_name.trim()) {
        setError('Ism majburiy');
        setLoading(false);
        return;
      }
      if (!formData.employee_phone || !formData.employee_phone.trim()) {
        setError('Telefon majburiy');
        setLoading(false);
        return;
      }
      if (!formData.employee_email || !formData.employee_email.trim()) {
        setError('Email majburiy');
        setLoading(false);
        return;
      }
      if (!formData.position || !formData.position.trim()) {
        setError('Lavozim majburiy');
        setLoading(false);
        return;
      }
      if (!formData.employee_password || !formData.employee_password.trim()) {
        setError('Parol majburiy');
        setLoading(false);
        return;
      }

      // Add salon_id from current user
      const employeeData = {
        ...formData,
        salon_id: user?.salon_id,
        profession: formData.position,
        role: formData.role || 'employee'
      };

      // Call createEmployee function from context
      await createEmployee(employeeData);
      
      // Reset form
      setFormData({
        employee_name: '',
        employee_phone: '',
        employee_email: '',
        position: '',
        username: '',
        employee_password: '',
        full_name: '',
        role: 'employee'
      });
      
      // Call onEmployeeAdded callback
      if (onEmployeeAdded) {
        onEmployeeAdded();
      }
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Error creating employee:', error);
      setError(error.message || 'Employee yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      employee_name: '',
      employee_phone: '',
      employee_email: '',
      position: '',
      username: '',
      employee_password: '',
      full_name: '',
      role: 'employee'
    });
    setError('');
    onClose();
  };

  return (
    <div className="add-employee-modal" onClick={handleClose}>
      <div className="add-employee-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Yangi Xodim Qo'shish</h3>
          <button 
            onClick={handleClose}
            className="close-btn"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-employee-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employee_name">Ism *</label>
              <input
                type="text"
                id="employee_name"
                name="employee_name"
                value={formData.employee_name}
                onChange={handleInputChange}
                required
                placeholder="Employee ismi"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="full_name">To'liq Ism</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="To'liq ism"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employee_phone">Telefon</label>
              <input
                type="tel"
                id="employee_phone"
                name="employee_phone"
                value={formData.employee_phone}
                onChange={handleInputChange}
                placeholder="+998 90 123 45 67"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="employee_email">Email</label>
              <input
                type="email"
                id="employee_email"
                name="employee_email"
                value={formData.employee_email}
                onChange={handleInputChange}
                placeholder="employee@example.com"
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-row">
          <div className="form-group">
            <label htmlFor="position">Lavozim</label>
            <input
              type="text"
              id="position"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="Sartarosh, Stilist, va h.k."
              className="form-input"
              required
            />
          </div>

            <div className="form-group">
              <label htmlFor="username">Username (Login uchun)</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="employee_username"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="employee_password">Parol (Login uchun)</label>
            <input
              type="password"
              id="employee_password"
              name="employee_password"
              value={formData.employee_password}
              onChange={handleInputChange}
              placeholder="Kuchli parol kiriting"
              className="form-input"
              required
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleClose}
              className="cancel-btn"
              disabled={loading}
            >
              Bekor qilish
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading && <span className="loading-spinner"></span>}
              {loading ? 'Saqlanmoqda...' : 'Employee Qo\'shish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;