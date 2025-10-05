import { useEffect } from "react";
import { UseGlobalContext } from "../Context";


const EmployeeCard = ({ id, name,profession,isMenuOpen,setIsMenuOpen, bio, is_verified, salon, isOpen, handleToggleMenu , isCheckedItem , setIsCheckedItem , handleAddWaitingEmp }) => {
  


  const handleToggleEmployMenu = (ID , type) => {
    setIsMenuOpen({
      cardId: ID,
      menu: type
    });
  };
  
  let employeeColor

  if(profession == "Hair"){
    employeeColor = "#CA940099"
  }else if(profession == "Hair"){
    employeeColor = "#00CA1E99"
  }else
    if(profession == "Hair"){
    employeeColor = "#CA940099"
  }else
    if(profession == "Hair"){
    employeeColor = "#CA940099"
  }else{

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
      <h2>{name}</h2>
      <div className="employCard-rating">
        <img src="/images/Star1.png" alt="" />
        <p>4.8 (13 отзывов)</p>
      </div>
      <div className="employCard-bottom">
        <div className="employCard-email">
          <img src="/images/emailIcon.png" alt="" />
          exemple@email.com
        </div>
        <div className="employCard-number">
          <img src="/images/callingWhiteIcon.png" alt="" />
          +998(90)123-45-67
        </div>
        <div className="employCard-workedTimes">
          <h1>24</h1>
          <p>Работы</p>
          <button className="employCard-workedTimesBtn" onClick={()=>handleToggleEmployMenu(id , 'see')}>
            Посмотреть
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="employCard-menu">
          <div onClick={()=>handleToggleEmployMenu(id , 'edit')}>
            <img src="/images/editEmploy.png" alt="" />
            <p>Изменить профиль</p>
          </div>
          <div onClick={()=>handleAddWaitingEmp([id])}>
            <img src="/images/sendWaitEmploy.png" alt="" />
            <p>Отправить в ожидание</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCard;