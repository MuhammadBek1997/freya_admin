import React, { useState, useEffect } from 'react';
import { UseGlobalContext } from '../Context';
import '../styles/AddProfessionModal.css';

const AddProfessionModal = ({ onClose, onProfessionAdded }) => {
  const { t, language, professions, addProfession } = UseGlobalContext();
  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const uz = nameUz.trim();
    const ru = nameRu.trim();
    const en = nameEn.trim();

    if (!uz || !ru || !en) {
      setError(t('validation.required', { defaultValue: 'Barcha maydonlarni to\'ldiring' }));
      return;
    }

    if (professions && professions.some(p => p.ru?.toLowerCase() === ru.toLowerCase())) {
      setError(t('errors.professionExists', { defaultValue: 'Bu kasb allaqachon mavjud' }));
      return;
    }

    setLoading(true);
    try {
      await addProfession({ uz, ru, en });
      setNameUz(''); setNameRu(''); setNameEn('');
      if (onProfessionAdded) onProfessionAdded();
      alert(t('alerts.professionAdded', { defaultValue: 'Kasb muvaffaqiyatli qo\'shildi!' }));
      onClose();
    } catch (err) {
      setError(err.message || t('errors.professionAddFailed', { defaultValue: 'Kasb qo\'shishda xatolik' }));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setNameUz(''); setNameRu(''); setNameEn('');
    onClose();
  };

  const handleRemoveProfession = async (professionValue) => {
    if (!window.confirm(t('confirm.deleteProfession', { defaultValue: 'Bu kasbni o\'chirishni tasdiqlaysizmi?' }))) return;
    setLoading(true);
    try {
      const updatedProfessions = professions.filter(p => p.value !== professionValue);
      localStorage.setItem('professions', JSON.stringify(updatedProfessions));
      if (onProfessionAdded) onProfessionAdded();
      alert(t('alerts.professionDeleted', { defaultValue: 'Kasb o\'chirildi!' }));
    } catch (err) {
      setError(err.message || t('errors.professionDeleteFailed', { defaultValue: 'Kasb o\'chirishda xatolik' }));
    } finally {
      setLoading(false);
    }
  };

  const lang = String(language || 'uz').toLowerCase();
  const getProfessionLabel = (p) => p[lang] || p.label || p.value;

  return (
    <div className="add-profession-modal" onClick={handleClose}>
      <div className="add-profession-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('profession.addTitle', { defaultValue: 'Kasb qo\'shish' })}</h3>
          <button onClick={handleClose} className="close-btn">×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="add-profession-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>UZ (lotin) *</label>
            <input
              type="text"
              value={nameUz}
              onChange={(e) => setNameUz(e.target.value)}
              placeholder="Brovist"
              className="form-input"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>RU (кириллица) *</label>
            <input
              type="text"
              value={nameRu}
              onChange={(e) => setNameRu(e.target.value)}
              placeholder="Бровист"
              className="form-input"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>EN (english) *</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Brow Specialist"
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? t('common.loading', { defaultValue: 'Yuklanmoqda...' }) : t('common.add', { defaultValue: 'Добавить' })}
            </button>
            <button type="button" className="cancel-btn" onClick={handleClose} disabled={loading}>
              {t('common.cancel', { defaultValue: 'Отмена' })}
            </button>
          </div>
        </form>

        {professions && professions.length > 0 && (
          <div className="existing-professions">
            <h4>{t('profession.existingTitle', { defaultValue: 'Существующие профессии:' })}</h4>
            <ul className="professions-list">
              {professions.map((profession, index) => (
                <li key={index} className="profession-item">
                  <span>{getProfessionLabel(profession)}</span>
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
