import { useTranslation } from 'react-i18next';

// Lightweight hook to access translations anywhere
// Provides t, i18n, current language, and tn (with default value fallback)
export const useI18n = () => {
  const { t, i18n } = useTranslation();
  const tn = (key, defaultValue) => t(key, { defaultValue });
  return { t, i18n, language: i18n?.language || 'ru', tn };
};

export default useI18n;