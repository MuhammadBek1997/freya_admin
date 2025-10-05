import React, { useState, useEffect } from 'react';
import { UseGlobalContext } from '../Context';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import '../styles/AddEmployeeModal.css';

const AddEmployeeModal = ({ onClose, onEmployeeAdded }) => {
  const { t, createEmployee, user } = UseGlobalContext();
  
  const professionOptions = [
    'Стилист',
    'Косметолог',
    'Визажист',
    'Бровист',
    'Лэшмейкер',
    'Массажист'
  ];

  const validationSchema = Yup.object({
    employee_name: Yup.string().min(2, 'Kamida 2 belgi').max(100, 'Ko‘pi bilan 100 belgi').required('Majburiy'),
    employee_phone: Yup.string().required('Majburiy'),
    employee_email: Yup.string().email('Email noto‘g‘ri').required('Majburiy'),
    username: Yup.string().min(3, 'Kamida 3 belgi').required('Majburiy'),
    employee_password: Yup.string().min(8, 'Kamida 8 belgi').required('Majburiy'),
    profession: Yup.string().oneOf(professionOptions, 'Noto‘g‘ri kasb').required('Majburiy')
  });

  const initialValues = {
    employee_name: '',
    employee_phone: '',
    employee_email: '',
    profession: '',
    username: '',
    employee_password: ''
  };
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setLoading(true);
    setError('');
    try {
      if (!user?.salon_id) {
        throw new Error('Salon ID topilmadi. Iltimos, qaytadan login qiling.');
      }

      const employeeData = {
        salon_id: user.salon_id,
        employee_name: values.employee_name.trim(),
        employee_phone: values.employee_phone.trim(),
        employee_email: values.employee_email.trim(),
        employee_password: values.employee_password,
        username: values.username.trim(),
        profession: values.profession,
        role: 'employee'
      };

      await createEmployee(employeeData);
      alert('Xodim muvaffaqiyatli qo\'shildi!');
      if (onEmployeeAdded) onEmployeeAdded();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Xodim yaratishda xatolik:', error);
      setError(error.message || 'Xodim yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <div className="add-employee-modal" onClick={handleClose}>
      <div className="add-employee-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Yangi Xodim Qo'shish</h3>
          <button onClick={handleClose} className="close-btn">×</button>
        </div>

        {error && (
          <div className="error-message" style={{backgroundColor:"white",border:"none"}}>
            {error}
          </div>
        )}

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <Form className="add-employee-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employee_name">Ism *</label>
                  <Field
                    type="text"
                    id="employee_name"
                    name="employee_name"
                    placeholder="Ism kiriting"
                    className="form-input"
                  />
                  <div className="error-message" style={{backgroundColor:"white",border:"none"}} ><ErrorMessage name="employee_name" /></div>
                </div>

                <div className="form-group">
                  <label htmlFor="username">Username *</label>
                  <Field
                    type="text"
                    id="username"
                    name="username"
                    placeholder="employee_username"
                    className="form-input"
                  />
                  <div className="error-message" style={{backgroundColor:"white",border:"none"}}><ErrorMessage name="username" /></div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employee_phone">Telefon *</label>
                  <Field
                    type="tel"
                    id="employee_phone"
                    name="employee_phone"
                    placeholder="+998901234567"
                    className="form-input"
                  />
                  <div className="error-message" style={{backgroundColor:"white",border:"none"}}><ErrorMessage name="employee_phone" /></div>
                </div>

                <div className="form-group">
                  <label htmlFor="employee_email">Email *</label>
                  <Field
                    type="email"
                    id="employee_email"
                    name="employee_email"
                    placeholder="employee@example.com"
                    className="form-input"
                  />
                  <div className="error-message" style={{backgroundColor:"white",border:"none"}}><ErrorMessage name="employee_email" /></div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="profession">Lavozim *</label>
                  <Field as="select" id="profession" name="profession" className="form-input">
                    <option value="">Kasb tanlang</option>
                    {professionOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Field>
                  <div className="error-message" style={{backgroundColor:"white",border:"none"}}><ErrorMessage name="profession" /></div>
                </div>

                <div className="form-group">
                  <label htmlFor="employee_password">Parol *</label>
                  <Field
                    type="password"
                    id="employee_password"
                    name="employee_password"
                    placeholder="Kamida 8 ta belgi"
                    className="form-input"
                  />
                  <div className="error-message" style={{backgroundColor:"white",border:"none"}}><ErrorMessage name="employee_password" /></div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleClose} className="cancel-btn" disabled={loading}>
                  Bekor qilish
                </button>
                <button type="submit" className="submit-btn" disabled={loading || isSubmitting}>
                  {loading ? 'Saqlanmoqda...' : 'Xodim Qo\'shish'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddEmployeeModal;