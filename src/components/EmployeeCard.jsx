import { useEffect } from "react";
import { UseGlobalContext } from "../Context";


const EmployeeCard = ({ id, name,surname,profession,email,avg_rating,comment_count,phone,isMenuOpen,setIsMenuOpen, bio, is_verified, salon, isOpen, handleToggleMenu , isCheckedItem , setIsCheckedItem , handleAddWaitingEmp }) => {
  const { t } = UseGlobalContext();


  const handleToggleEmployMenu = (ID , type) => {
    setIsMenuOpen({
      cardId: ID,
      menu: type
    });
  };
  
  let employeeColor

  if(profession == "Стилист" || profession == "Stilist" || profession == "Stylist"){
    employeeColor = "#CA940099"
  }else if(profession == "Косметолог" || profession == "Kosmetolog" || profession == "Cosmetologist"){
    employeeColor = "#00CA1E99"
  }else
    if(profession == "Визажист" || profession == "Visualist" || profession == "Visualizer"){
    employeeColor = "#1E00CA99"
  }else if(profession == "Бровист" || profession == "Eyebrowist" || profession == "Eyebrowist"){
    employeeColor = "#CA940099"
  }else if(profession == "Лэшмейкер" || profession == "Lashmaker" || profession == "Lashmaker"){
    employeeColor = "#CA009899"
  }else if(profession == "Массажист" || profession == "Massageist" || profession == "Massageist"){
    employeeColor = "#CA000099"
  }

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
        <div className="employCard-masterJob" style={{backgroundColor:employeeColor}}>
          <p>
            {
              profession
            }
          </p>
        </div>
        <button className="employCard-menuBtn" onClick={handleToggleMenu}>
          <img src="/images/menuImg.png" alt="" />
        </button>
      </div>
      <img src="/images/masterImage.png" alt="" />
      <h2>{name} {surname}</h2>
      <div className="employCard-rating">
        <img src="/images/Star1.png" alt="" />
        <p>{avg_rating} ({comment_count} {t("profileReviews")})</p>
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
          <h1>24</h1>
          <p>{t("workHour")}</p>
          <button className="employCard-workedTimesBtn" onClick={()=>handleToggleEmployMenu(id , 'see')}>
            {t("look")}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="employCard-menu">
          <div onClick={()=>handleToggleEmployMenu(id , 'edit')}>
            <img src="/images/editEmploy.png" alt="" />
            <p>{t("changePsw")}</p>
          </div>
          <div onClick={()=>handleAddWaitingEmp([id])}>
            <img src="/images/sendWaitEmploy.png" alt="" />
            <p>{t("setWaiting")}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCard;