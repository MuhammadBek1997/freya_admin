import { useEffect, useMemo, useState } from "react"
import { UseGlobalContext } from "../Context"
import AppointCard from "../components/AppointCard"
import ConfirmModal from "../components/ConfirmModal"
import RightSidebar from "../components/RightSidebar"

const Home = () => {
  let {
        t,
        confirmModal,
        isRightSidebarOpen,
        openRightSidebar,
        selectedFilter,
        setSelectedFilter,
        combinedAppointments,
        appointmentsError,
        appointmentsLoading,
        bookingsLoading,
        fetchCombinedAppointments,
        user
      } = UseGlobalContext()

  const [selectedAppoint, setSelectedAppoint] = useState({})
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Sahifa yuklanganda ma'lumotlarni olish
  useEffect(() => {
    const savedFilter = localStorage.getItem('selectedFilter');
    if (savedFilter) {
      setSelectedFilter(parseInt(savedFilter));
    }

    if (user?.salon_id) {
      fetchCombinedAppointments(user.salon_id);
    }
  }, [user]);

  const filteredAppointments = useMemo(() => {
    if (!combinedAppointments || combinedAppointments.length === 0) return [];
    const now = new Date();

    const startOfWeek = (() => {
      const d = new Date(now);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    })();

    const endOfWeek = (() => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + 6);
      d.setHours(23, 59, 59, 999);
      return d;
    })();

    // Date filter
    let filtered = combinedAppointments.filter((item) => {
      const d = new Date(item?.date);
      if (Number.isNaN(d.getTime())) return false;

      switch (selectedFilter) {
        case 1:
          return d.toDateString() === now.toDateString();
        case 2:
          return d >= startOfWeek && d <= endOfWeek;
        case 3:
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        case 4:
          return d.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    // Search filter - barcha maydonlar bo'yicha qidirish
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        // Barcha string va number qiymatlarni tekshirish
        const searchableValues = Object.values(item)
          .filter(val => val !== null && val !== undefined)
          .map(val => {
            if (typeof val === 'string') return val.toLowerCase();
            if (typeof val === 'number') return val.toString();
            if (typeof val === 'boolean') return val.toString();
            return '';
          })
          .join(' ');
        
        return searchableValues.includes(query);
      });
    }

    return filtered;
  }, [combinedAppointments, selectedFilter, searchQuery]);

  const isLoading = appointmentsLoading || bookingsLoading;

  return (
    <section className='home'>
      <nav className="home-nav">
        <div className="home-nav-top">
          <img src="/images/clientAppIcon.png" alt="" />
          <h2>{t('homeHT')}</h2>
        </div>
        
        <div className="home-nav-search">
          <img src="/images/searchIcon.png" alt="" />
          <input 
            type="text" 
            placeholder={t('homeSrchPlhdr')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="home-nav-filter">
          <button
            onClick={() => {
              if (selectedFilter === 1) {
                setSelectedFilter(null);
                localStorage.removeItem('selectedFilter');
              } else {
                setSelectedFilter(1);
                localStorage.setItem('selectedFilter', '1');
              }
            }}
            style={{
              backgroundColor: selectedFilter == 1 ? "#9C2BFF" : "white",
              color: selectedFilter == 1 ? "white" : "#2C2C2C99"
            }}
          >
            <img src={selectedFilter == 1 ? "/images/activesIcon.png" : "/images/activesIconG.png"} alt="" />
            {t('homeFlAct')}
          </button>
          <button
            onClick={() => {
              if (selectedFilter === 2) {
                setSelectedFilter(null);
                localStorage.removeItem('selectedFilter');
              } else {
                setSelectedFilter(2);
                localStorage.setItem('selectedFilter', '2');
              }
            }}
            style={{
              backgroundColor: selectedFilter == 2 ? "#9C2BFF" : "white",
              color: selectedFilter == 2 ? "white" : "#2C2C2C99"
            }}
          >
            {t('homeFlThsWk')}
          </button>
          <button
            onClick={() => {
              if (selectedFilter === 3) {
                setSelectedFilter(null);
                localStorage.removeItem('selectedFilter');
              } else {
                setSelectedFilter(3);
                localStorage.setItem('selectedFilter', '3');
              }
            }}
            style={{
              backgroundColor: selectedFilter == 3 ? "#9C2BFF" : "white",
              color: selectedFilter == 3 ? "white" : "#2C2C2C99"
            }}
          >
            {t('homeFlThsMth')}
          </button>
          <button
            onClick={() => {
              if (selectedFilter === 4) {
                setSelectedFilter(null);
                localStorage.removeItem('selectedFilter');
              } else {
                setSelectedFilter(4);
                localStorage.setItem('selectedFilter', '4');
              }
            }}
            style={{
              backgroundColor: selectedFilter == 4 ? "#9C2BFF" : "white",
              color: selectedFilter == 4 ? "white" : "#2C2C2C99"
            }}
          >
            {t('homeFlThsYr')}
          </button>
        </div>
        
        <div className="home-nav-columns">
          <a href="">{t('homeCmnNm')}</a>
          <a href="">{t('homeCmnNmbrApp')}</a>
          <a href="">{t('homeCmnNmbr')}</a>
          <a href="">{t('homeCmnWn')}</a>
          <a href="">{t('homeCmnTime')}</a>
          <a href="">{t('homeCmnWhm')}</a>
        </div>
      </nav>
      
      <div className="home-body">
        {isLoading ? (
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
            <p style={{ color: "#A8A8B3", fontSize: "1vw" }}>
              {t("loading") || "Loading..."}
            </p>
          </div>
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((item) => (
            <AppointCard 
              key={`${item.type}-${item.id}`} 
              {...item} 
              openRightSidebar={openRightSidebar}
              setSelectedAppoint={setSelectedAppoint} 
            />
          ))
        ) : (
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
            <p style={{ color: "#A8A8B3", fontSize: "1vw" }}>
              {searchQuery ? t('searchNoResults') : t("homeNone")}
            </p>
          </div>
        )}
      </div>
      
      <div className="right-sidebar-cont" style={{
        transform: isRightSidebarOpen ? "translateX(0vw)" : "translateX(100vw)"
      }}>
        <RightSidebar selectedAppoint={selectedAppoint} />
      </div>
      
      {!confirmModal && (
        <div className="confirm-modal">
          <ConfirmModal selectedAppoint={selectedAppoint} />
        </div>
      )}
    </section>
  )
}

export default Home