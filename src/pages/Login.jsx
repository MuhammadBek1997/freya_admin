import { useState } from 'react';
import { UseGlobalContext } from '../Context';

const Login = () => {
  const { t, handleChange, language } = UseGlobalContext();
  const [showPassword, setShowPassword] = useState(false);
  const [checkPsw , setCheckPsw] = useState(true)

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
          <button className="login-btn" onClick={()=>setCheckPsw(false)}>{t('loginBtn')}</button>
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
