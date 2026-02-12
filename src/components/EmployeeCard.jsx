import { useState, useEffect } from "react";
import { UseGlobalContext } from "../Context.jsx";


const EmployeeCard = ({ id, name, surname, profession, email, avg_rating, comment_count, phone, _isMenuOpen, setIsMenuOpen, _bio, _is_verified, _salon, isOpen, handleToggleMenu, isCheckedItem, setIsCheckedItem, handleAddWaitingEmp, work_start_time, work_end_time, avatar_url, avatar, profile_image, photo }) => {
  const { ts } = UseGlobalContext();

  const computeWorkedHours = (start, end) => {
    if (!start || !end) return 24;
    try {
      const [sh, sm] = String(start).split(":").map(Number);
      const [eh, em] = String(end).split(":").map(Number);
      if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 24;
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      let diff = endMin - startMin;
      if (diff <= 0) diff += 24 * 60; // wrap over midnight
      const hours = diff / 60;
      return Math.round(hours);
    } catch {
      return 24;
    }
  };

  const workedHoursDisplay = computeWorkedHours(work_start_time, work_end_time);

  const handleToggleEmployMenu = (ID , type) => {
    setIsMenuOpen({
      cardId: ID,
      menu: type
    });
  };
  
  // profession ni array ga aylantirish
  let profList = profession || [];
  if (typeof profList === 'string') {
    try { profList = JSON.parse(profList); } catch { profList = profList ? [profList] : []; }
  }
  if (!Array.isArray(profList)) profList = profList ? [profList] : [];

  const [currentProfIdx, setCurrentProfIdx] = useState(0);

  useEffect(() => {
    if (profList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentProfIdx(prev => (prev + 1) % profList.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [profList.length]);

  const getColor = (prof) => {
    const p = (prof || '').toLowerCase();
    if (p.includes('стилист') || p.includes('stilist') || p.includes('stylist')) return "#CA940099";
    if (p.includes('косметолог') || p.includes('kosmetolog') || p.includes('cosmetologist')) return "#00CA1E99";
    if (p.includes('визажист') || p.includes('vizajist') || p.includes('visualist')) return "#1E00CA99";
    if (p.includes('бровист') || p.includes('brovist') || p.includes('eyebrow')) return "#CA940099";
    if (p.includes('лэшмейкер') || p.includes('lashmaker')) return "#CA009899";
    if (p.includes('массажист') || p.includes('massaj') || p.includes('massage')) return "#CA000099";
    return "#66666699";
  };

  return (
    <div className="employCard">
      <div className="employCard-top">
        <input
          type="checkbox"
          className="employCard-checkbox"
          checked={isCheckedItem.includes(id)}
          onChange={()=>{
            if(isCheckedItem.includes(id)){
              setIsCheckedItem(isCheckedItem.filter(item=>item!==id))
            }else{
              setIsCheckedItem([...isCheckedItem , id])
            }
          }}
        />
        <div style={{ overflow: 'hidden', height: '3vh', display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          {profList.length > 0 ? (
            <div
              key={currentProfIdx}
              className="employCard-masterJob"
              style={{
                backgroundColor: getColor(profList[currentProfIdx]),
                animation: profList.length > 1 ? 'profFadeIn 0.4s ease' : 'none'
              }}
            >
              <p>{profList[currentProfIdx]}</p>
            </div>
          ) : (
            <div className="employCard-masterJob" style={{backgroundColor: "#66666699"}}>
              <p>-</p>
            </div>
          )}
        </div>
        <button className="employCard-menuBtn" onClick={handleToggleMenu}>
          <img src="/images/menuImg.png" alt="" />
        </button>
      </div>
      <img src={avatar_url || avatar || profile_image || photo || "/images/masterImage.png"} className="employCard-img" alt="" />
      <h2>{name} {surname}</h2>
      <div className="employCard-rating">
        <img src="/images/Star1.png" alt="" />
        <p>{avg_rating} ({comment_count} {ts("profileReviews","отзывов")})</p>
      </div>
      <div className="employCard-bottom">
        <div className="employCard-email">
          <img src="/images/emailIcon.png" alt="" />
          {email}
        </div>
        <div className="employCard-number">
          <img src="/images/callingWhiteIcon.png" alt="" />
          {phone}
        </div>
        <div className="employCard-workedTimes">
          <h1>{workedHoursDisplay}</h1>
          <p>{ts("workHour","Рабочие часы")}</p>
          <button className="employCard-workedTimesBtn" onClick={()=>handleToggleEmployMenu(id , 'see')}>
            {ts("look","Посмотреть")}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="employCard-menu">
          <div onClick={()=>handleToggleEmployMenu(id , 'edit')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <p>{ts("changePsw","Изменить профиль")}</p>
          </div>
          <div onClick={()=>handleAddWaitingEmp([id])}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <polyline points="17 11 19 13 23 9"/>
            </svg>
            <p>{ts("setWaiting","Отправить в ожидание")}</p>
          </div>
          <div onClick={()=>handleToggleEmployMenu(id , 'busy')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <p>{ts("busy","Занят")}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCard;
