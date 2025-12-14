import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', height: '100vh', overflowY: 'auto' }}>
      <button
        onClick={() => {
          try {
            if (window.history.length > 1) navigate(-1);
            else navigate('/');
          } catch {
            navigate('/');
          }
        }}
        style={{
          marginBottom: '16px',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          background: '#f7f7f7',
          cursor: 'pointer'
        }}
      >
        {t('back')}
      </button>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{t('privacyBody')}</div>
    </div>
  );
};

export default Privacy;
