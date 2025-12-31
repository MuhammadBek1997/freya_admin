import React, { useState, useEffect } from 'react';
import { UseGlobalContext } from '../Context';
import '../styles/AddProfessionModal.css';

const AddProfessionModal = ({ onClose, onProfessionAdded }) => {
  const { t, professions, addProfession } = UseGlobalContext();
  const [professionName, setProfessionName] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = professionName.trim();

    if (!trimmedName) {
      setError(t('validation.required', { defaultValue: 'Majburiy maydon' }));
      return;
    }

    if (trimmedName.length < 2) {
      setError(t('validation.min2', { defaultValue: 'Kamida 2 belgi' }));
      return;
    }

    if (trimmedName.length > 100) {
      setError(t('validation.max100', { defaultValue: 'Ko\'pi bilan 100 belgi' }));
      return;
    }

    // Check if profession already exists
    if (professions && professions.some(p => p.value.toLowerCase() === trimmedName.toLowerCase())) {
      setError(t('errors.professionExists', { defaultValue: 'Bu kasb allaqachon mavjud' }));
      return;
    }

    setLoading(true);
    try {
      await addProfession(trimmedName);
      setProfessionName('');
      if (onProfessionAdded) onProfessionAdded();
      alert(t('alerts.professionAdded', { defaultValue: 'Kasb muvaffaqiyatli qo\'shildi!' }));
      onClose();
    } catch (error) {
      console.error('Kasb qo\'shishda xatolik:', error);
      setError(error.message || t('errors.professionAddFailed', { defaultValue: 'Kasb qo\'shishda xatolik yuz berdi' }));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setProfessionName('');
    onClose();
  };

  const handleRemoveProfession = async (professionValue) => {
    if (!window.confirm(t('confirm.deleteProfession', { defaultValue: 'Bu kasbni o\'chirishni tasdiqlaysizmi?' }))) {
      return;
    }

    setLoading(true);
    try {
      // Filter out the profession from local state
      const updatedProfessions = professions.filter(p => p.value !== professionValue);
      localStorage.setItem('professions', JSON.stringify(updatedProfessions));

      if (onProfessionAdded) onProfessionAdded();
      alert(t('alerts.professionDeleted', { defaultValue: 'Kasb o\'chirildi!' }));
    } catch (error) {
      console.error('Kasb o\'chirishda xatolik:', error);
      setError(error.message || t('errors.professionDeleteFailed', { defaultValue: 'Kasb o\'chirishda xatolik yuz berdi' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-profession-modal" onClick={handleClose}>
      <div className="add-profession-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('profession.addTitle', { defaultValue: 'Добавить профессию' })}</h3>
          <button onClick={handleClose} className="close-btn">×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form className="add-profession-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="professionName">
              {t('profession.nameLabel', { defaultValue: 'Название профессии *' })}
            </label>
            <input
              type="text"
              id="professionName"
              value={professionName}
              onChange={(e) => setProfessionName(e.target.value)}
              placeholder={t('profession.namePlaceholder', { defaultValue: 'Например: Парикмахер' })}
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-buttons">
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? t('common.loading', { defaultValue: 'Yuklanmoqda...' }) : t('common.add', { defaultValue: 'Добавить' })}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={handleClose}
              disabled={loading}
            >
              {t('common.cancel', { defaultValue: 'Отмена' })}
            </button>
          </div>
        </form>

        {/* Display existing professions */}
        {professions && professions.length > 0 && (
          <div className="existing-professions">
            <h4>{t('profession.existingTitle', { defaultValue: 'Существующие профессии:' })}</h4>
            <ul className="professions-list">
              {professions.map((profession, index) => (
                <li key={index} className="profession-item">
                  <span>{profession.label || profession.value}</span>
                  <button
                    type="button"
                    className="delete-profession-btn"
                    onClick={() => handleRemoveProfession(profession.value)}
                    disabled={loading}
                    title={t('common.delete', { defaultValue: 'O\'chirish' })}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddProfessionModal;
