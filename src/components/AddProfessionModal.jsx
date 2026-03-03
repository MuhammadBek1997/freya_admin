import React, { useState, useEffect } from 'react';
import { UseGlobalContext } from '../Context';
import { translationTranslateAllUrl } from '../apiUrls';
import '../styles/AddProfessionModal.css';

// Kirill → Lotin transliteratsiya (UZ uchun)
const transliterate = (text) => {
  const map = {
    'А':'A','а':'a','Б':'B','б':'b','В':'V','в':'v','Г':'G','г':'g',
    'Д':'D','д':'d','Е':'E','е':'e','Ё':'Yo','ё':'yo','Ж':'Zh','ж':'zh',
    'З':'Z','з':'z','И':'I','и':'i','Й':'y','й':'y','К':'K','к':'k',
    'Л':'L','л':'l','М':'M','м':'m','Н':'N','н':'n','О':'O','о':'o',
    'П':'P','п':'p','Р':'R','р':'r','С':'S','с':'s','Т':'T','т':'t',
    'У':'U','у':'u','Ф':'F','ф':'f','Х':'H','х':'h','Ц':'Ts','ц':'ts',
    'Ч':'Ch','ч':'ch','Ш':'Sh','ш':'sh','Щ':'Shch','щ':'shch',
    'Ъ':'','ъ':'','Ы':'i','ы':'i','Ь':'','ь':'','Э':'E','э':'e',
    'Ю':'Yu','ю':'yu','Я':'Ya','я':'ya',
  };
  return text.split('').map(c => map[c] !== undefined ? map[c] : c).join('');
};

const isCyrillic = (text) => /[а-яА-ЯёЁ]/.test(text);

const AddProfessionModal = ({ onClose, onProfessionAdded }) => {
  const { t, language, professions, addProfession } = UseGlobalContext();
  const [professionName, setProfessionName] = useState('');
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

    const trimmed = professionName.trim();
    if (!trimmed) {
      setError(t('validation.required', { defaultValue: 'Majburiy maydon' }));
      return;
    }
    if (trimmed.length < 2) {
      setError(t('validation.min2', { defaultValue: 'Kamida 2 belgi' }));
      return;
    }

    setLoading(true);
    try {
      let uz, ru, en;

      if (isCyrillic(trimmed)) {
        // Kirill: UZ = transliteratsiya, RU = as-is, EN = tarjima
        uz = transliterate(trimmed);
        ru = trimmed;
        // EN ni API orqali olamiz
        const resp = await fetch(translationTranslateAllUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed, source_language: 'ru' }),
        });
        const data = await resp.json();
        en = data?.data?.en || trimmed;
      } else {
        // Lotin: UZ = as-is, RU va EN = tarjima
        uz = trimmed;
        const resp = await fetch(translationTranslateAllUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed, source_language: 'uz' }),
        });
        const data = await resp.json();
        ru = data?.data?.ru || trimmed;
        en = data?.data?.en || trimmed;
      }

      if (professions && professions.some(p => p.ru?.toLowerCase() === ru.toLowerCase())) {
        setError(t('errors.professionExists', { defaultValue: 'Bu kasb allaqachon mavjud' }));
        setLoading(false);
        return;
      }

      await addProfession({ uz, ru, en });
      setProfessionName('');
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
    setProfessionName('');
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
            <label htmlFor="professionName">
              {t('profession.nameLabel', { defaultValue: 'Kasb nomi (rus tilida) *' })}
            </label>
            <input
              type="text"
              id="professionName"
              value={professionName}
              onChange={(e) => setProfessionName(e.target.value)}
              placeholder={t('profession.namePlaceholder', { defaultValue: 'Например: Бровист' })}
              className="form-input"
              disabled={loading}
            />
            <small style={{ color: '#999', fontSize: '12px' }}>
              {t('profession.hint', { defaultValue: 'Kirillcha yozsangiz — UZ: transliteratsiya, EN: avtotarjima' })}
            </small>
          </div>

          <div className="form-buttons">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading
                ? t('common.loading', { defaultValue: 'Tarjima qilinmoqda...' })
                : t('common.add', { defaultValue: 'Добавить' })}
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
