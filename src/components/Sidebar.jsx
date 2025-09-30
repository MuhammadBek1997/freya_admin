import { Link } from 'react-router-dom'
import { UseGlobalContext } from '../Context'

const Sidebar = () => {
  let { t, selectIcon,whiteBoxRef,handleClick} = UseGlobalContext();
  

  

  return (
    <div className='sidebar'>
      <div className="sidebar-logo">
        <img src="/images/logoLight.jpg" alt="" />
        <h1>
          {t('sidebarHText')}
        </h1>
      </div>

      {/* WhiteBox — ref qo‘yib olish */}
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
          style={{ textDecoration: selectIcon[0].style }}
          className='sidebar-nav-item'
          onClick={handleClick}
          id='0'
          key={0}
        >
          <img src={selectIcon[0].img} alt="" />
          <p 
          style={{
            textDecoration: selectIcon[0].style,
            color: selectIcon[0].color
          }}
          >
            {t("sidebarHome")}
          </p>
        </Link>

        <Link
          to={'/schedule'}
          style={{ textDecoration: selectIcon[1].style }}
          className='sidebar-nav-item'
          onClick={handleClick}
          id='1'
          key={1}
        >
          <img src={selectIcon[1].img} alt="" />
          <p
          style={{
            textDecoration: selectIcon[1].style,
            color: selectIcon[1].color
          }}
          >
            {t("sidebarSch")}
          </p>
        </Link>

        <Link
          to={'/employees'}
          style={{ textDecoration: selectIcon[2].style }}
          className='sidebar-nav-item'
          onClick={handleClick}
          id='2'
          key={2}
        >
          <img src={selectIcon[2].img} alt="" />
          <p
           style={{
            textDecoration: selectIcon[2].style,
            color: selectIcon[2].color
          }}
          >
            {t("sidebarEmp")}
          </p>
        </Link>

        <Link
          to={'/profile'}
          style={{ textDecoration: selectIcon[3].style }}
          className='sidebar-nav-item'
          onClick={handleClick}
          id='3'
          key={3}
        >
          <img src={selectIcon[3].img} alt="" />
          <p 
          style={{
            textDecoration: selectIcon[3].style,
            color: selectIcon[3].color
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