import { Link } from 'react-router-dom'
import { UseGlobalContext } from '../Context'

const Sidebar = () => {
  let { t, selectIcon, whiteBoxRef, handleClick, user } = UseGlobalContext();

  return (
    <div className='sidebar'>
      <div className="sidebar-logo">
        <img src="/images/logoLight.jpg" alt="" />
        <h1>
          {t('sidebarHText')}
        </h1>
      </div>

      {/* WhiteBox — ref qo'yib olish */}
      <div ref={whiteBoxRef} className="sidebar-whitebox">
        <div className="sidebar-whiteboxtop-cont">
        </div>
        <div className='sidebar-whiteboxmid-cont'>
          <div className="sidebar-whitebox-cont">
          </div>
        </div>
        <div className="sidebar-whiteboxbtm-cont">
        </div>
      </div>

      <div className="sidebar-cont">
        <Link
          to={'/'}
          style={{ textDecoration: selectIcon[0]?.style || 'none' }}
          className='sidebar-nav-item'
          onClick={handleClick}
          id='0'
          key={0}
        >
          <img src={selectIcon[0]?.img || '/images/home-light.png'} alt="" />
          <p
            style={{
              textDecoration: selectIcon[0]?.style || 'none',
              color: selectIcon[0]?.color || '#9C2BFF'
            }}
          >
            {t("sidebarHome")}
          </p>
        </Link>

        <Link
          to={'/schedule'}
          style={{ textDecoration: selectIcon[1]?.style || 'underline' }}
          className='sidebar-nav-item'
          onClick={handleClick}
          id='1'
          key={1}
        >
          <img src={selectIcon[1]?.img || '/images/schedule-dark.png'} alt="" />
          <p
            style={{
              textDecoration: selectIcon[1]?.style || 'underline',
              color: selectIcon[1]?.color || 'white'
            }}
          >
            {t("sidebarSch")}
          </p>
        </Link>

        {user?.role !== 'private_admin' ? (
          // Admin/Employee uchun - Employees link
          <Link
            to={'/employees'}
            style={{ textDecoration: selectIcon[2]?.style || 'underline' }}
            className='sidebar-nav-item'
            onClick={handleClick}
            id='2'
            key={2}
          >
            <img src={selectIcon[2]?.img || '/images/group-dark.png'} alt="" />
            <p
              style={{
                textDecoration: selectIcon[2]?.style || 'underline',
                color: selectIcon[2]?.color || 'white'
              }}
            >
              {t("sidebarEmp")}
            </p>
          </Link>
        ) : (
          // Private admin uchun - Employees disabled
          <h2
            style={{ 
              textDecoration: selectIcon[2]?.style || 'underline'
            }}
            className='sidebar-nav-item'
            id='2'
            key={2}
          >
            <img src={selectIcon[2]?.img || '/images/group-dark.png'} alt="" />
            <p
              style={{
                textDecoration: selectIcon[2]?.style || 'underline',
                color: selectIcon[2]?.color || 'white'
              }}
            >
              {t("sidebarEmp")}
            </p>
          </h2>
        )}

        {/* Chat link - faqat private_admin uchun */}
        {user?.role === 'private_admin' && (
          <Link
            to={'/chat'}
            style={{ textDecoration: selectIcon[3]?.style || 'underline' }}
            className='sidebar-nav-item'
            onClick={handleClick}
            id='3'
            key={3}
          >
            <img src={selectIcon[3]?.img || '/images/chat-dark.png'} alt="" />
            <p
              style={{
                textDecoration: selectIcon[3]?.style || 'underline',
                color: selectIcon[3]?.color || 'white'
              }}
            >
              {t('chat')}
            </p>
          </Link>
        )}

        {/* Profile link - barcha userlar uchun */}
        <Link
          to={'/profile'}
          style={{ textDecoration: selectIcon[user?.role === 'private_admin' ? 4 : 3]?.style || 'underline' }}
          className='sidebar-nav-item'
          onClick={handleClick}
          id={user?.role === 'private_admin' ? '4' : '3'}
          key={user?.role === 'private_admin' ? 4 : 3}
        >
          <img src={selectIcon[user?.role === 'private_admin' ? 4 : 3]?.img || '/images/settings-dark.png'} alt="" />
          <p
            style={{
              textDecoration: selectIcon[user?.role === 'private_admin' ? 4 : 3]?.style || 'underline',
              color: selectIcon[user?.role === 'private_admin' ? 4 : 3]?.color || 'white'
            }}
          >
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