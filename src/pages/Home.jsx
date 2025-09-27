import { useEffect } from "react"
import { UseGlobalContext } from "../Context"
import AppointCard from "../components/AppointCard"
import ConfirmModal from "../components/ConfirmModal"
import RightSidebar from "../components/RightSidebar"

const Home = () => {
  let {
        t,
        confirmModal,
        moreDataAppoint,
        isRightSidebarOpen,
        openRightSidebar,
        selectedFilter,
        setSelectedFilter,
        appointments,
        appointmentsError,
        appointmentsLoading
      } = UseGlobalContext()

  // Sahifa yuklanganda, localStorage'dan filterni olish
  useEffect(() => {
    // localStorage'dan filterni olish
    const savedFilter = localStorage.getItem('selectedFilter');
    if (savedFilter) {
      setSelectedFilter(parseInt(savedFilter));
    }
  }, []);

  return (
    <section className='home'>
      <nav className="home-nav">
        <div className="home-nav-top">
          <img src="/images/clientAppIcon.png" alt="" />
          <h2>
            {t('homeHT')}
          </h2>
        </div>
        <div className="home-nav-search">
          <img src="/images/searchIcon.png" alt="" />
          <input type="text" placeholder={t('homeSrchPlhdr')} />
        </div>
        <div className="home-nav-filter">
          <button
            onClick={() => {
              // Agar tugma tanlangan bo'lsa, uni o'chirish
              if (selectedFilter === 1) {
                setSelectedFilter(null);
                localStorage.removeItem('selectedFilter');
              } else {
                setSelectedFilter(1);
                localStorage.setItem('selectedFilter', '1');
              }
            }}
            style={{
              backgroundColor: selectedFilter == 1
                ? "#9C2BFF"
                : "white",
              color: selectedFilter == 1
                ? "white"
                : "#2C2C2C99"
            }}
          >
            <img src={selectedFilter == 1 ? "/images/activesIcon.png" : "/images/activesIconG.png"} alt="" />
            {t('homeFlAct')}
          </button>
          <button
            onClick={() => {
              // Agar tugma tanlangan bo'lsa, uni o'chirish
              if (selectedFilter === 2) {
                setSelectedFilter(null);
                localStorage.removeItem('selectedFilter');
              } else {
                setSelectedFilter(2);
                localStorage.setItem('selectedFilter', '2');
              }
            }}
            style={{
              backgroundColor: selectedFilter == 2
                ? "#9C2BFF"
                : "white",
              color: selectedFilter == 2
                ? "white"
                : "#2C2C2C99"
            }}
          >
            {t('homeFlThsWk')}
          </button>
          <button
            onClick={() => {
              // Agar tugma tanlangan bo'lsa, uni o'chirish
              if (selectedFilter === 3) {
                setSelectedFilter(null);
                localStorage.removeItem('selectedFilter');
              } else {
                setSelectedFilter(3);
                localStorage.setItem('selectedFilter', '3');
              }
            }}
            style={{
              backgroundColor: selectedFilter == 3
                ? "#9C2BFF"
                : "white",
              color: selectedFilter == 3
                ? "white"
                : "#2C2C2C99"
            }}
          >
            {t('homeFlThsMth')}
          </button>
          <button
            onClick={() => {
              // Agar tugma tanlangan bo'lsa, uni o'chirish
              if (selectedFilter === 4) {
                setSelectedFilter(null);
                localStorage.removeItem('selectedFilter');
              } else {
                setSelectedFilter(4);
                localStorage.setItem('selectedFilter', '4');
              }
            }}
            style={{
              backgroundColor: selectedFilter == 4
                ? "#9C2BFF"
                : "white",
              color: selectedFilter == 4
                ? "white"
                : "#2C2C2C99"
            }}
          >
            {t('homeFlThsYr')}
          </button>
        </div>
        <div className="home-nav-columns">
          <a href="">
            {t('homeCmnNm')}
          </a>
          <a href="">
            {t('homeCmnNmbrApp')}
          </a>
          <a href="">
            {t('homeCmnNmbr')}
          </a>
          <a href="">
            {t('homeCmnWn')}
          </a>
          <a href="">
            {t('homeCmnTime')}
          </a>
          <a href="">
            {t('homeCmnWhm')}
          </a>
        </div>
      </nav>
      <div className="home-body">
        {appointmentsLoading ? (
          <div style={{
            width: "100%",
            height: "60vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: "1vw"
          }}>
            <div style={{
              width: "3vw",
              height: "3vw",
              border: "3px solid #f3f3f3",
              borderTop: "3px solid #9C2BFF",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <p style={{
              color: "#A8A8B3",
              fontSize: "1vw"
            }}>
              {t("loading") || "Loading appointments..."}
            </p>
          </div>
        ) : appointments.length > 0 ? appointments.map((item) => {
          
          return <AppointCard key={item.id} {...item} openRightSidebar={openRightSidebar} />
        })
          :
          <div style={{
            width: "100%",
            height: "60vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: "1vw"
          }}>
            <img style={{ width: "6vw" }} src="/images/homeDashImg.png" alt="" />
            <p style={{
              color: "#A8A8B3",
              fontSize: "1vw"
            }}>
              {t("homeNone")}
            </p>
          </div>
        }
      </div>
      <div className="right-sidebar-cont" style={{
        transform: isRightSidebarOpen ? "translateX(0vw)" : "translateX(100vw)"
      }}>
        <RightSidebar />
      </div>
      {
        !confirmModal
          ?
          <div className="confirm-modal">
            <ConfirmModal />
          </div>
          :
          null
      }
    </section>
  )
}

export default Home