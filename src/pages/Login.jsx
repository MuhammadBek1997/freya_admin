import { useState } from 'react';
import { UseGlobalContext } from '../Context';

const Login = () => {
  const { t, handleChange, language, loginAdmin, loginEmployee } = UseGlobalContext();
  const [showPassword, setShowPassword] = useState(false);
  const [checkPsw, setCheckPsw] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setErrorMessage('Username va password kiritish majburiy!');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Avval admin sifatida login qilishga harakat qilamiz
      try {
        await loginAdmin(username, password);
      } catch (adminError) {
        // Agar admin login muvaffaqiyatsiz bo'lsa, employee sifatida harakat qilamiz
        try {
          await loginEmployee(username, password);
        } catch (employeeError) {
          // Agar ikkalasi ham muvaffaqiyatsiz bo'lsa, xatolik ko'rsatamiz
          throw new Error('Username yoki password noto\'g\'ri!');
        }
      }
    } catch (error) {
      setErrorMessage(error.message || 'Login xatolik yuz berdi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* left side */}
      <div className="login-left">
        <h1>{t('loginHead')}</h1>
        <div className="illustrations">
          <img src="/images/girlWithiPod.png" alt="Illustration 1" />
          <img src="/images/Rectangle155.png" alt="Illustration 2" />
        </div>
        
        <div className="bottomIllustrations">
          <img src="/images/girlWithBook.png" alt="Illustration 1" />
          <img src="/images/boyWithCoffee.png" alt="Illustration 2" />
        </div>
      </div>

      {/* right side */}
      <div className="login-right">
        <div className="login-top">
          <img src="/images/logoLight.jpg" alt="Logo" className="logo" />
          <div>
            <img src="/images/globus.png" alt="" className='globus'/>
          <select value={language} onChange={handleChange}>
            <option value="ru">RU</option>
            <option value="uz">UZ</option>
            <option value="en">EN</option>
          </select>
          {/* <img src="/images/Arrow.png" alt="Arrow" className='arrow' /> */}
          </div>
        </div>

        <h3 className='loginHeadText'>{t('loginTop')}</h3>

        <div className="login-cont">
            <h3>
                {t('loginBoxTop')}
            </h3>

            {/* Error Message */}
            {errorMessage && (
              <div style={{ 
                color: '#FF0000', 
                marginBottom: '15px', 
                padding: '10px', 
                backgroundColor: '#ffe6e6', 
                borderRadius: '5px',
                border: '1px solid #FF0000'
              }}>
                {errorMessage}
              </div>
            )}
            
          <div className="login-inputs">
            {/* Username */}
            <label
                style={{
                    color: checkPsw ? 'black' : '#FF0000'
                }}>
                    {t('loginNameLabel')}
                </label>
            <br />
            <input 
                type="text" 
                placeholder={t('loginNamePlhldr')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                    border: checkPsw ? 'none' : '1px solid #FF0000',
                    borderColor: checkPsw ? 'black' : '#FF0000',
                    outlineColor: checkPsw ? 'black' : '#FF0000',
                    color: checkPsw ? 'black' : '#FF0000'
                }} />
            <br />
            {/* Password */}
            <label
                style={{
                    color: checkPsw ? 'black' : '#FF0000'
                }}>
                    {t('loginPswLabel')}
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='******'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                    border: checkPsw ? 'none' : '1px solid #FF0000',
                    borderColor: checkPsw ? 'black' : '#FF0000',
                    outlineColor: checkPsw ? 'black' : '#FF0000',
                    color: checkPsw ? 'black' : '#FF0000'
                }}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <img src='/images/hidePsw.png'/> : <img src='/images/showPsw.png'/>}
              </button>
            </div>

            <a href="/forgot">{t('loginPswForgot')}</a>
          </div>
          <button 
            className="login-btn" 
            onClick={handleLogin}
            disabled={loading}
            style={{
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Kirish...' : t('loginBtn')}
          </button>
        </div>

        <div className="login-btm">
          <h3>{t('loginQuest')}</h3>
          <div>
            <a href="tel:+998901234567">+998901234567</a>
            <a href="tel:+998901234567">+998901234567</a>
            <a href="mailto:freyacom@email.com">freyacom@email.com</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
