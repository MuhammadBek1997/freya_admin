import React from 'react'
import { UseGlobalContext } from '../Context';

const RightSidebar = () => {
    const { t, selectedElement, closeRightSidebar , setConfirmModal, commentsArr } = UseGlobalContext()

    // Agar selectedElement yo'q bo'lsa, sidebar yopiq bo'ladi
    if (!selectedElement) return null;

    return (
        <div className='right-sidebar'>
            <button onClick={closeRightSidebar}>
                <img src="/images/closeSidebar.png" alt="Close" />
            </button>

            {/* Mijoz ismi */}
            <img src="/images/customerImage.png" alt="" className='right-sidebar-img' />
            <h3>
                {selectedElement.customer_name || t("Mijoz ismi")}
            </h3>

            {/* Telefon raqami */}
            <div className='right-custNumb'>
                <a href={`tel:+998901231223`}>
                    <img src="/images/callingIcon.png" alt={t("Call")} />
                    +998901231223
                </a>
                <button>
                    <img src="/images/copyIcon.png" alt={t("Copy")} />
                </button>
            </div>

            {/* Ariza raqami */}
            <div className='right-appNumb'>
                <h3>
                    WS33012487
                </h3>
            </div>

            {/* Abonement ma'lumotlari */}
            <div className='right-subs-cont'>
                <div className='right-subs-top'>
                    <a href="">
                        {t("Купил абонимент")}
                    </a>
                </div>
                <div className='right-subs-btm'>
                    <img src="/images/subsIcon.png" alt={t("Subscription")} />
                    <p>
                        {t("Был оформлен платёж на абонимент")}
                    </p>
                </div>
            </div>

            {/* Vaqt ma'lumotlari */}
            <div className='right-appTime-cont'>
                <div className='right-appTime-top'>
                    <h4>{t("Время")}</h4>
                </div>
                <div className='right-appTime-btm'>
                    <div className='appTime-left'>
                        <div >
                            <p>
                                {selectedElement.time && selectedElement.time.hour !== undefined 
                                    ? `${selectedElement.time.hour} : ${selectedElement.time.minute < 10 ? "0" + selectedElement.time.minute : selectedElement.time.minute}`
                                    : selectedElement.application_time || 'N/A'
                                }
                            </p>
                        </div>
                    </div>
                    <div className='appTime-right'>
                        <div>
                            <p>
                                {selectedElement.time && selectedElement.time.hour !== undefined 
                                    ? `${selectedElement.time.hour + 1} : ${selectedElement.time.minute < 10 ? "0" + selectedElement.time.minute : selectedElement.time.minute}`
                                    : selectedElement.application_time ? 
                                        (() => {
                                            const timeParts = selectedElement.application_time.split(':');
                                            const hour = parseInt(timeParts[0], 10) + 1;
                                            const minute = parseInt(timeParts[1], 10);
                                            return `${hour} : ${minute < 10 ? "0" + minute : minute}`;
                                        })()
                                        : 'N/A'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mijoz kommentlari */}
            {selectedElement.is_verified && (
                <div className='right-comments-cont'>
                    <div className='right-comments-top'>
                        <h4>{t("Mijoz kommentlari")}</h4>
                    </div>
                    <div className='right-comments-btm'>
                        {commentsArr.filter(comment => comment.id === selectedElement.id).map((comment, index) => (
                            <div key={index} className='comment-item'>
                                <div className='comment-rating'>
                                    <img src="/images/Star1.png" alt={t("Star")} />
                                    <span>{comment.rating}</span>
                                </div>
                                <p className='comment-text'>{comment.comment}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Master ma'lumotlari */}
            {/* <div className='right-master-info'>
                <div className='right-master-header'>
                    <img src="/images/masterImage.png" alt="Master" className='right-master-avatar' />
                    <div className='right-master-details'>
                        <h4>Любовь</h4>
                        <p>18 работы</p>
                        <p>Колорист</p>
                    </div>
                </div>
                <div className='right-master-rating'>
                    <img src="/images/Star1.png" alt="Star" />
                    <span>4.2 (115)</span>
                </div>
            </div> */}

            {/* Xizmat ma'lumotlari */}
            {/* <div className='right-service-info'>
                <h4>Услуга</h4>
                <div className='right-service-details'>
                    <p>Массаж лица (персональное)</p>
                    <p>СКУЛЬПТУРНО-БУККАЛЬНЫЙ МАССАЖ ЛИЦА 60 мин</p>
                </div>
            </div> */}

            {/* Vaqt ma'lumotlari */}
            {/* <div className='right-time-section'>
                <h4>Время</h4>
                <div className='right-time-details'>
                    <span>11:10</span>
                    <span className='time-separator'>-</span>
                    <span>12:50</span>
                </div>
            </div> */}

            {/* Tugmalar */}
            {
                selectedElement.is_verified 
            ?
            null 
            :
            <div className='right-btm'>
                <button onClick={()=>setConfirmModal(false)}>
                    <img src="/images/verifiedIcon.png" alt={t("Verified")} />
                    {t("Пришла")}
                </button>
                <button>
                    {t("Отклонить")}
                </button>
            </div>
            }
        </div>
    )
}

export default RightSidebar