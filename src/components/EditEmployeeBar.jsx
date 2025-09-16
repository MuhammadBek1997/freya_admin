

const EditEmployeeBar = ({ onClose }) => {
  return (
    <div className="editEmployeeBar">
        <div className="editEmployeeBar-cont">
            
            <img src="/images/masterImage.png" alt="" className="editEmployeeBar-cont-img" />
            <div className="editEmployeeBar-rating">
                <img src="/images/Star1.png" alt="" />
                <p>
                    4.5 (12 отзывов)
                </p>
            </div>
            <div className="editEmployeeBar-cont-info">
                <label htmlFor="">
                    Имя
                </label>
                <input type="text" />
                <label htmlFor="">
                    Фамилия
                </label>
                <input type="text" />
                <label htmlFor="">
                    Номер телефона
                </label>
                <input type="text" />
                <label htmlFor="">
                    Электронная почта
                </label>
                <input type="text" />
                <label htmlFor="">
                    Профессия
                </label>
                <input type="text" />
                <label htmlFor="">
                    Имя пользователя
                </label>
                <input type="text" />
                <label htmlFor="">
                    Пароль
                </label>
                <input type="text" />
            </div>
            <div className="editEmployeeBar-cont-bottom">
                <button className="editEmployeeBar-cont-bottom-cancel" onClick={onClose}>
                    Отменить
                </button>
                <button className="editEmployeeBar-cont-bottom-save">
                    Сохранить
                </button>
            </div>
        </div>
    </div>
  )
}

export default EditEmployeeBar