import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UseGlobalContext } from '../Context';

// Import images
import girlWithiPod from '/images/girlWithiPod.png';
import Rectangle155 from '/images/Rectangle155.png';
import girlWithBook from '/images/girlWithBook.png';
import boyWithCoffee from '/images/boyWithCoffee.png';
import globus from '/images/globus.png';
import logoLight from '/images/logoLight.jpg';
import showPsw from '/images/showPsw.png';
import hidePsw from '/images/hidePsw.png';

const Login = () => {
  const { t, handleChange, language, loginAdmin, loginEmployee , login} = UseGlobalContext();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [checkPsw, setCheckPsw] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Test funksiyalari
  const testEmployeeCredentials = async () => {
    
    const credentials = [
      { username: 'employee1_1', password: 'employee123' },
      { username: 'employee123', password: 'employee123' },
      { username: 'employee1', password: 'password123' },
      { username: 'employee2', password: 'password123' }
    ];

    for (const cred of credentials) {
      try {
        const result = await loginEmployee(cred.username, cred.password);
      } catch (error) {
      }
    }
  };

  // Global obyektga test funksiyasini qo'shish
  if (typeof window !== 'undefined') {
    window.testEmployeeCredentials = testEmployeeCredentials;
    window.loginEmployeeTest = loginEmployee;
  }

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
        setErrorMessage('Username va password kiritish majburiy!');
        return;
    }

    setLoading(true);
    setErrorMessage('');
    setCheckPsw(true);

    try {
        const result = await login(username, password);


        // Decode token to verify role
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));

                if (payload.role !== result.user?.role) {
                    throw new Error(`Role mismatch: You logged in as "${payload.role}" but trying to access "${result.user?.role}" pages. Please use correct admin credentials.`);
                }
            } catch (decodeError) {
                if (decodeError.message.includes('Role mismatch')) {
                    throw decodeError;
                }
            }
        }

        // Role'ga qarab yo'naltirish
        if (result.role === 'employee') {
            navigate('/employee-chat');
        } else {
            navigate('/');
        }
    } catch (error) {
        setErrorMessage(error.message || 'Login muvaffaqiyatsiz');
        setCheckPsw(false);
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
          <img src={girlWithiPod} alt="Illustration 1" />
          <img src={Rectangle155} alt="Illustration 2" />
        </div>
        
        <div className="bottomIllustrations">
          <img src={girlWithBook} alt="Illustration 1" />
          <img src={boyWithCoffee} alt="Illustration 2" />
        </div>
      </div>

      {/* right side */}
      <div className="login-right">
        <div className="login-top">
          <img src={logoLight} alt="Logo" className="logo" />
          <div>
            <img src={globus} alt="" className='globus'/>
          <select value={language} onChange={handleChange} style={{
            width:"2vw",
            marginLeft:"0.3vw"
          }}>
            <option value="ru">RU</option>
            <option value="uz">UZ</option>
            <option value="en">EN</option>
          </select>
          <img src="/images/Arrowwhite.png" alt="Arrow" style={{width:"1vw",marginLeft:"-0.7vw",zIndex:"-1"}} />
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
                width:"20vw",
                color: '#FF0000', 
                marginBottom: '1vw', 
                padding: '1vw', 
                backgroundColor: '#ffe6e6', 
                borderRadius: '1vw',
                border: '0.1vw solid #FF0000',
                fontSize: '0.8vw'
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
                    border: checkPsw ? 'none' : '0.1vw solid #FF0000',
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
                    border: checkPsw ? 'none' : '0.1vw solid #FF0000',
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
                {showPassword ? <img src={hidePsw}/> : <img src={showPsw}/>}
              </button>
            </div>

            <a href="https://t.me/freya_adm1n_bot" target='_blank'>{t('loginPswForgot')}</a>
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
            {loading ? t('loginLoading') : t('loginBtn')}
          </button>
        </div>

        <div className="login-btm">
          <h3>{t('loginQuest')}</h3>
          <div>
            <a href="tel:+998977503792">+998977503792</a>
            <a href="tel:+998974043419">+998974043419</a>
            <a href="mailto:freyaitsolution@gmail.com">freyaitsolution@gmail.com</a>
            <a href="/privacy" style={{ marginLeft: '1vw' }}>{t('privacyLink')}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
