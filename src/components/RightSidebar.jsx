import { UseGlobalContext } from '../Context';
import { useState, useEffect } from 'react';

const RightSidebar = () => {
    const {
        t,
        selectedElement,
        closeRightSidebar,
        commentsArr,
        updateAppointmentStatus,
        cancelAppointment,
        employees,
        employeesBySalon,
        getAuthToken,
        setConfirmModal
    } = UseGlobalContext();

    const [scheduleData, setScheduleData] = useState(null);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    // Schedule ma'lumotlarini olish
    useEffect(() => {
        const fetchSchedule = async () => {
            if (!selectedElement?.schedule_id) return;

            setScheduleLoading(true);
            try {
                const response = await fetch(
                    `https://freya-salon-backend-cc373ce6622a.herokuapp.com/api/schedules/${selectedElement.schedule_id}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setScheduleData(data?.data || data);
                } else {
                    console.error('Schedule yuklanmadi');
                }
            } catch (error) {
                console.error('Schedule yuklashda xato:', error);
            } finally {
                setScheduleLoading(false);
            }
        };

        fetchSchedule();
    }, [selectedElement?.schedule_id]);

    if (!selectedElement) return null;

    

    const handleReject = async () => {
        const reason = prompt(t('cancelReasonPrompt'));
        if (!reason) return;

        try {
            await cancelAppointment(selectedElement.id, reason);
            closeRightSidebar();
        } catch (error) {
            console.error('Bekor qilishda xato:', error);
            alert(error.message);
        }
    };

    const employee = (employeesBySalon || employees || []).find(emp => emp.id === selectedElement.employee_id);

    const showButtons = selectedElement.status === 'accepted' &&
        !selectedElement.is_confirmed &&
        !selectedElement.is_completed;

    const relatedComments = selectedElement.is_completed && commentsArr
        ? commentsArr.filter(comment =>
            comment.appointment_id === selectedElement.id ||
            comment.id === selectedElement.id
        )
        : [];

    return (
        <div className='right-sidebar'>
            <button onClick={closeRightSidebar}>
                <img src="/images/closeSidebar.png" alt="Close" />
            </button>

            {(() => {
                const customerAvatar = selectedElement?.user_avatar || selectedElement?.user_avatar_url || selectedElement?.avatar || selectedElement?.avatar_url || "/images/customerImage.png";
                return <img src={customerAvatar} alt="" className='right-sidebar-img' />
            })()}
            <h3>
                {selectedElement.user_name || selectedElement.full_name || t('homeCmnFullName')}
            </h3>

            <div className='right-custNumb'>
                <a href={`tel:${selectedElement.phone_number || '+998901231223'}`}>
                    <img src="/images/callingIcon.png" alt={t("Call")} />
                    {selectedElement.phone_number || '+998901231223'}
                </a>
                <button onClick={() => {
                    navigator.clipboard.writeText(selectedElement.phone_number || '+998901231223');
                }}>
                    <img src="/images/copyIcon.png" alt={t("Copy")} />
                </button>
            </div>

            <div className='right-appNumb'>
                <h3>
                    {selectedElement.application_number || t('notAvailable')}
                </h3>
            </div>

            <div className='right-status-cont'>
                <div className='right-status-badge' style={{
                    backgroundColor:
                        selectedElement.is_completed ? '#4CAF50' :
                            selectedElement.is_confirmed ? '#2196F3' :
                                selectedElement.is_cancelled ? '#f44336' :
                                    selectedElement.status === 'accepted' ? '#FF9800' : '#9E9E9E',
                    borderRadius: "0.5vw",
                    padding: "0.5vw 1vw"
                }}>
                    <p>
                        {selectedElement.is_completed ? t('Yakunlangan') :
                            selectedElement.is_confirmed ? t('Tasdiqlangan') :
                                selectedElement.is_cancelled ? t('Bekor qilingan') :
                                    selectedElement.status === 'accepted' ? t('Qabul qilingan') :
                                        t('Kutilmoqda')}
                    </p>
                </div>
            </div>

            <div className='right-appTime-cont'>
                <div className='right-appTime-top'>
                    <h4>{t('timeLabel')}</h4>
                </div>
                <div className='right-appTime-btm'>
                    <div className='appTime-left'>
                        <div>
                            <p>
                                {scheduleLoading
                                    ? t('loading')
                                    : scheduleData?.start_time
                                        ? scheduleData.start_time.substring(0, 5)
                                        : selectedElement.application_time
                                            ? selectedElement.application_time.substring(0, 5)
                                            : t('notAvailable')
                                }
                            </p>
                        </div>
                    </div>
                    <div className='appTime-right'>
                        <div>
                            <p>
                                {scheduleLoading
                                    ? t('loading')
                                    : scheduleData?.end_time ||
                                    (selectedElement.application_time ?
                                        (() => {
                                            const timeParts = selectedElement.application_time.split(':');
                                            const hour = parseInt(timeParts[0], 10) + 1;
                                            const minute = parseInt(timeParts[1], 10);
                                            return `${hour}:${minute < 10 ? "0" + minute : minute}`;
                                        })()
                                        : t('notAvailable')
                                    )
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {selectedElement.notes && (
                <div className='right-notes-cont'>
                    <div className='right-notes-top'>
                        <h4>{t('clientNote')}</h4>
                    </div>
                    <div className='right-notes-btm'>
                        <p>{selectedElement.notes}</p>
                    </div>
                </div>
            )}

            {employee && (
                <div className='right-master-info'>
                    <div className='right-master-header'>
                        {(() => {
                            const masterAvatar = employee?.avatar_url || employee?.photo || employee?.profile_image || "/images/masterImage.png";
                            return (
                                <img
                                    src={masterAvatar}
                                    alt="Master"
                                    className='right-master-avatar'
                                />
                            );
                        })()}
                        <div className='right-master-details'>
                            <h4>{employee.name || t('notAvailable')}</h4>
                            <p>{employee.profession || t('homeCmnProfession')}</p>
                        </div>
                    </div>
                    <div className='right-master-rating'>
                        <img src="/images/Star1.png" alt="Star" />
                        <span>{employee.avg_rating || '4.2'} ({employee.comment_count || '115'})</span>
                    </div>
                </div>
            )}

            {selectedElement.service_name && (
                <div className='right-service-info'>
                    <h4>{t('service')}</h4>
                    <div className='right-service-details'>
                        <p>{selectedElement.service_name}</p>
                        {selectedElement.service_price && (
                            <p>{t('price')}: {selectedElement.service_price}</p>
                        )}
                    </div>
                </div>
            )}

            {selectedElement.is_cancelled && selectedElement.cancellation_reason && (
                <div className='right-cancel-reason'>
                    <h4>{t('cancelReason')}</h4>
                    <p>{selectedElement.cancellation_reason}</p>
                </div>
            )}

            {selectedElement.is_completed && relatedComments.length > 0 && (
                <div className='right-comments-cont'>
                    <div className='right-comments-top'>
                        <h4>{t('customerComments')}</h4>
                    </div>
                    <div className='right-comments-btm'>
                        {relatedComments.map((comment, index) => (
                            <div key={index} className='comment-item'>
                                <div className='comment-rating'>
                                    <img src="/images/Star1.png" alt={t("Star")} />
                                    <span>{comment.rating}</span>
                                </div>
                                <p className='comment-text'>{comment.text || comment.comment}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showButtons && (
                <div className='right-btm'>
                    <button onClick={() => setConfirmModal(false)} className='confirm-btn'>
                        <img src="/images/verifiedIcon.png" alt={t("Verified")} />
                        {t("Пришла")}
                    </button>
                    <button onClick={handleReject}>
                        {t("Отклонить")}
                    </button>
                </div>
            )}
        </div>
    )
}

export default RightSidebar