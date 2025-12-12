import React from 'react'
import { UseGlobalContext } from '../Context.jsx'

const EmployWaitingCard = ({ 
    id, name, spec, isMenuOpen, setIsMenuOpen, bio, is_verified, 
    salon, isOpen, handleToggleMenu, isCheckedItem, setIsCheckedItem, 
    handleRemoveWaitingEmp, avatar_url, avatar, profile_image, photo 
}) => {
    const { t } = UseGlobalContext()

    const handleToggleEmployMenu = (ID, type) => {
        setIsMenuOpen({
            cardId: ID,
            menu: type
        });
    };

    return (
        <div className="employCard">
            <div className="employCard-top">
                <input
                    type="checkbox"
                    className="employCard-checkbox"
                    checked={isCheckedItem.includes(id)}
                    onChange={() => {
                        if (isCheckedItem.includes(id)) {
                            setIsCheckedItem(isCheckedItem.filter(item => item !== id))
                        } else {
                            setIsCheckedItem([...isCheckedItem, id])
                        }
                    }}
                />
                <div className="employCard-masterJob">
                    <p>{spec}</p>
                </div>
                <button className="employCard-menuBtn" onClick={handleToggleMenu}>
                    <img src="/images/menuImg.png" alt="" />
                </button>
            </div>
            <img src={avatar_url || avatar || profile_image || photo || "/images/masterImage.png"} alt="" />
            <h2>{name}</h2>
            <div className="employCard-rating">
                <img src="/images/Star1.png" alt="" />
                <p>4.8 (13 {t('profileReviews')})</p>
            </div>
            <div className="employWaitingCard-bottom">
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
                    <p>{t('workHour')}</p>
                    <button className="employCard-workedTimesBtn" onClick={() => handleToggleEmployMenu(id, 'see')}>
                        {t('look')}
                    </button>
                </div>
            </div>
            {isOpen && (
                <div className="employWaitingCard-menu">
                    <div onClick={() => handleRemoveWaitingEmp([id])}>
                        <img src="/images/sendWaitEmploy.png" alt="" />
                        <p>{t('returnToEmployees')}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default EmployWaitingCard
