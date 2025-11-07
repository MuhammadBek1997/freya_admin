import { Link, useLocation } from 'react-router-dom'
import { UseGlobalContext } from '../Context'

const Sidebar = () => {
  let { t, user } = UseGlobalContext();
  const location = useLocation();

  const isPath = (path) => location.pathname === path;

  return (
    <div className='sidebar'>
      <div className="sidebar-logo">
        <img src="/images/logoLight.jpg" alt="" />
        <h1>
          {t('sidebarHText')}
        </h1>
      </div>

      <div className="sidebar-cont">
        <Link
          to={'/'}
          className={`sidebar-nav-item ${isPath('/') ? 'is-active' : ''}`}
          id='0'
          key={0}
        >
          <img src={!isPath('/') ? '/images/home-dark.png' : '/images/home-light.png'} alt="" />
          <p>
            {t("sidebarHome")}
          </p>
        </Link>

        <Link
          to={'/schedule'}
          className={`sidebar-nav-item ${isPath('/schedule') ? 'is-active' : ''}`}
          id='1'
          key={1}
        >
          <img src={!isPath('/schedule') ? '/images/schedule-dark.png' : '/images/schedule-light.png'} alt="" />
          <p>
            {t("sidebarSch")}
          </p>
        </Link>

        {user?.role !== 'private_admin' ? (
          // Admin/Employee uchun - Employees link
          <Link
            to={'/employees'}
            className={`sidebar-nav-item ${isPath('/employees') ? 'is-active' : ''}`}
            id='2'
            key={2}
          >
            <img src={!isPath('/employees') ? '/images/group-dark.png' : '/images/group-light.png'} alt="" />
            <p>
              {t("sidebarEmp")}
            </p>
          </Link>
        ) : (
          // Private admin uchun - Employees disabled
          <h2
            className={`sidebar-nav-item ${isPath('/employees') ? 'is-active' : ''}`}
            id='2'
            key={2}
          >
            <img src={!isPath('/employees') ? '/images/group-dark.png' : '/images/group-light.png'} alt="" />
            <p>
              {t("sidebarEmp")}
            </p>
          </h2>
        )}

        {/* Chat link - faqat private_admin uchun */}
        {user?.role === 'private_admin' && (
          <Link
            to={'/chat'}
            className={`sidebar-nav-item ${isPath('/chat') ? 'is-active' : ''}`}
            id='3'
            key={3}
          >
            <img src={!isPath('/chat') ? '/images/chat-dark.png' : '/images/chat-light.png'} alt="" />
            <p>
              {t('chat')}
            </p>
          </Link>
        )}

        {/* Profile link - barcha userlar uchun */}
        <Link
          to={'/profile'}
          className={`sidebar-nav-item ${isPath('/profile') ? 'is-active' : ''}`}
          id={user?.role === 'private_admin' ? '4' : '3'}
          key={user?.role === 'private_admin' ? 4 : 3}
        >
          <img 
            src={!isPath('/profile') ? '/images/settings-dark.png' : '/images/settings-light.png'} 
            alt="" 
          />
          <p>
            {t("sidebarPro")}
          </p>
        </Link>
      </div>

      <div className='sidebar-illustration'>
        <img src="/images/girlDreaming.png" alt="" />
      </div>
    </div>
  )
}

export default Sidebar