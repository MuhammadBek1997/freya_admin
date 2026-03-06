import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UseGlobalContext } from '../Context.jsx'

const LS_KEY = 'freya_navToggleTop';

const Sidebar = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  let { t, user, totalUnreadCount } = UseGlobalContext();
  const location = useLocation();
  const navToggleRef = useRef(null);
  const navDragState = useRef({ active: false, moved: false, startY: 0 });

  const isPath = (path) => location.pathname === path;

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved && navToggleRef.current) {
      navToggleRef.current.style.top = saved;
      navToggleRef.current.style.transform = 'none';
    }
  }, []);

  const handleNavToggleDown = (e) => {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    navDragState.current = { active: true, moved: false, startY: clientY };

    const onMove = (me) => {
      if (!navDragState.current.active) return;
      const y = me.touches ? me.touches[0].clientY : me.clientY;
      if (Math.abs(y - navDragState.current.startY) > 5) {
        navDragState.current.moved = true;
        me.preventDefault();
      }
      if (navDragState.current.moved && navToggleRef.current) {
        const h = navToggleRef.current.offsetHeight;
        const newTop = Math.max(0, Math.min(window.innerHeight - h, y - h / 2));
        navToggleRef.current.style.top = newTop + 'px';
        navToggleRef.current.style.transform = 'none';
      }
    };

    const onEnd = () => {
      if (navDragState.current.moved && navToggleRef.current) {
        localStorage.setItem(LS_KEY, navToggleRef.current.style.top);
      }
      navDragState.current.active = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  };

  return (
    <>
    <div className={`sidebar ${isNavOpen ? 'sidebar-mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <img src="/images/logoLight.jpg" alt="" />
        <h1>
          {t('sidebarHText')}
        </h1>
      </div>

      <div className="sidebar-cont" onClick={() => setIsNavOpen(false)}>
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

        {/* Chat link - barcha admin rollari uchun */}
        {['admin', 'salon_admin', 'private_admin', 'private_salon_admin', 'superadmin'].includes(user?.role) && (
          <Link
            to={'/chat'}
            className={`sidebar-nav-item ${isPath('/chat') ? 'is-active' : ''}`}
            id='3'
            key={3}
            style={{ position: 'relative' }}
          >
            <img src={!isPath('/chat') ? '/images/chat-dark.png' : '/images/chat-light.png'} alt="" />
            <p>{t('chat')}</p>
            {totalUnreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '8px',
                background: '#FF3B30',
                color: '#fff',
                borderRadius: '50%',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                lineHeight: 1,
                padding: '0 4px',
              }}>
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </Link>
        )}

        {/* Profile link - barcha userlar uchun */}
        <Link
          to={'/profile'}
          className={`sidebar-nav-item ${isPath('/profile') ? 'is-active' : ''}`}
          id='4'
          key={4}
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
    <button
      ref={navToggleRef}
      className="nav-sidebar-toggle"
      onMouseDown={handleNavToggleDown}
      onTouchStart={handleNavToggleDown}
      onClick={() => { if (!navDragState.current.moved) setIsNavOpen(!isNavOpen); }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {isNavOpen ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
      </svg>
    </button>
    </>
  )
}

export default Sidebar
