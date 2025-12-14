import { useTranslation } from 'react-i18next';

const Privacy = () => {
  const { t } = useTranslation();
  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '16px' }}>{t('privacyTitle')}</h1>
      <div style={{ marginBottom: '8px', color: '#666' }}>{t('privacyEffective')}</div>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{t('privacyBody')}</div>
      <div style={{ marginTop: '16px' }}>{t('privacyContact')}</div>
    </div>
  );
};

export default Privacy;
