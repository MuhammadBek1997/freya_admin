import React, { useState, useEffect } from 'react';
import { UseGlobalContext } from '../Context';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import '../styles/AddEmployeeModal.css';

const AddEmployeeModal = ({ onClose, onEmployeeAdded }) => {
  const { t, createEmployee, user } = UseGlobalContext();
  
  const professionOptions = [
    { value: 'Стилист', label: t('profession.stylist', { defaultValue: 'Stilist' }) },
    { value: 'Косметолог', label: t('profession.cosmetologist', { defaultValue: 'Kosmetolog' }) },
    { value: 'Визажист', label: t('profession.makeup', { defaultValue: 'Vizajist' }) },
    { value: 'Бровист', label: t('profession.brow', { defaultValue: 'Brovist' }) },
    { value: 'Лэшмейкер', label: t('profession.lash', { defaultValue: 'Lashmaker' }) },
    { value: 'Массажист', label: t('profession.masseur', { defaultValue: 'Massajchi' }) }
  ];

  const validationSchema = Yup.object({
    employee_name: Yup.string()
      .min(2, t('validation.min2', { defaultValue: 'Kamida 2 belgi' }))
      .max(100, t('validation.max100', { defaultValue: 'Ko‘pi bilan 100 belgi' }))
      .required(t('validation.required', { defaultValue: 'Majburiy' })),
    employee_phone: Yup.string().required(t('validation.required', { defaultValue: 'Majburiy' })),
    employee_email: Yup.string().email(t('validation.emailInvalid', { defaultValue: 'Email noto‘g‘ri' })).required(t('validation.required', { defaultValue: 'Majburiy' })),
    username: Yup.string().min(3, t('validation.min3', { defaultValue: 'Kamida 3 belgi' })).required(t('validation.required', { defaultValue: 'Majburiy' })),
    employee_password: Yup.string().min(8, t('validation.min8', { defaultValue: 'Kamida 8 belgi' })).required(t('validation.required', { defaultValue: 'Majburiy' })),
    profession: Yup.string().oneOf(professionOptions.map(p => p.value), t('validation.invalidProfession', { defaultValue: 'Noto‘g‘ri kasb' })).required(t('validation.required', { defaultValue: 'Majburiy' }))
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
        throw new Error(t('errors.salonIdMissing', { defaultValue: 'Salon ID topilmadi. Iltimos, qaytadan login qiling.' }));
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
      alert(t('alerts.employeeAdded', { defaultValue: "Xodim muvaffaqiyatli qo'shildi!" }));
      if (onEmployeeAdded) onEmployeeAdded();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Xodim yaratishda xatolik:', error);
      setError(error.message || t('errors.employeeCreateFailed', { defaultValue: 'Xodim yaratishda xatolik yuz berdi' }));
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
          <h3>{t('employAddBtn')}</h3>
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
                  <label htmlFor="employee_name">{t('employee.nameLabel', { defaultValue: 'Ism *' })}</label>
                  <Field
                    type="text"
                    id="employee_name"
                    name="employee_name"
                    placeholder={t('employee.namePlaceholder', { defaultValue: 'Ism kiriting' })}
                    className="form-input"
                  />
                  <div className="error-message" style={{backgroundColor:"white",border:"none"}} ><ErrorMessage name="employee_name" /></div>
                </div>

                <div className="form-group">
                  <label htmlFor="username">{t('employee.usernameLabel', { defaultValue: 'Username *' })}</label>
                  <Field
                    type="text"
                    id="username"
                    name="username"
                    placeholder={t('employee.usernamePlaceholder', { defaultValue: 'employee_username' })}
                    className="form-input"
                  />
                  <div className="error-message" style={{backgroundColor:"white",border:"none"}}><ErrorMessage name="username" /></div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employee_phone">{t('employee.phoneLabel', { defaultValue: 'Telefon *' })}</label>
                  <Field
                    type="tel"
                    id="employee_phone"
                    name="employee_phone"
                    placeholder={t('employee.phonePlaceholder', { defaultValue: '+998901234567' })}
                    className="form-input"
                  />
                  <div className="error-message" style={{backgroundColor:"white",border:"none"}}><ErrorMessage name="employee_phone" /></div>
                </div>

                <div className="form-group">
                  <label htmlFor="employee_email">{t('employee.emailLabel', { defaultValue: 'Email *' })}</label>
                  <Field
                    type="email"
                    id="employee_email"
                    name="employee_email"
                    placeholder={t('employee.emailPlaceholder', { defaultValue: 'employee@example.com' })}
                    className="form-input"
                  />
                  <div className="error-message" style={{backgroundColor:"white",border:"none"}}><ErrorMessage name="employee_email" /></div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="profession">{t('employee.positionLabel', { defaultValue: 'Lavozim *' })}</label>
                  <Field as="select" id="profession" name="profession" className="form-input">
                    <option value="">{t('employee.chooseProfession', { defaultValue: 'Kasb tanlang' })}</option>
                    {professionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Field>
                  <div className="error-message" style={{backgroundColor:"white",border:"none"}}><ErrorMessage name="profession" /></div>
                </div>

                <div className="form-group">
                  <label htmlFor="employee_password">{t('employee.passwordLabel', { defaultValue: 'Parol *' })}</label>
                  <Field
                    type="password"
                    id="employee_password"
                    name="employee_password"
                    placeholder={t('employee.passwordPlaceholder', { defaultValue: 'Kamida 8 ta belgi' })}
                    className="form-input"
                  />
                  <div className="error-message" style={{backgroundColor:"white",border:"none"}}><ErrorMessage name="employee_password" /></div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleClose} className="cancel-btn" disabled={loading}>
                  {t('cancel')}
                </button>
                <button type="submit" className="submit-btn" disabled={loading || isSubmitting}>
                  {loading ? t('saving', { defaultValue: 'Saqlanmoqda...' }) : t('employAddBtn')}
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