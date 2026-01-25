import { UseGlobalContext } from '../Context.jsx';
import { schedulesUrl } from '../apiUrls';
import { useState, useEffect } from 'react';

const RightSidebar = () => {
    const {
        t,
        selectedElement,
        closeRightSidebar,
        commentsArr,
        updateAppointmentStatus,
        cancelAppointment,
        deleteBooking,
        employees,
        employeesBySalon,
        getAuthToken,
        setConfirmModal,
        user
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
                    `${schedulesUrl.replace(/^http:\/\//, 'https://')}/${selectedElement.schedule_id}`,
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
                }
            } catch (error) {
            } finally {
                setScheduleLoading(false);
            }
        };

        fetchSchedule();
    }, [selectedElement?.schedule_id]);

    if (!selectedElement) return null;

    

    const handleReject = async () => {
        try {
            if (String(selectedElement.type) === 'booking') {
                await deleteBooking(selectedElement.id);
            } else {
                try {
                    await cancelAppointment(selectedElement.id, '');
                } catch (e) {
                    await updateAppointmentStatus(selectedElement.id, 'cancelled');
                }
            }
            closeRightSidebar();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleArrived = async () => {
        try {
            if (String(selectedElement.type) === 'booking') {
                alert(t('bookingArrivedNotSupported') || 'Booking uchun “Пришла” qo‘llanilmaydi');
                return;
            }
            await updateAppointmentStatus(selectedElement.id, 'accepted');
            closeRightSidebar();
        } catch (error) {
            alert(error.message);
        }
    };

    const employee = (employeesBySalon || employees || []).find(emp => emp.id === selectedElement.employee_id);

    const apptDateStr = selectedElement.application_date || selectedElement.date || null;
    const apptTimeStr = selectedElement.application_time || selectedElement.time || selectedElement.start_time || null;
    const apptDateTime = (() => {
        if (!apptDateStr || !apptTimeStr) return null;
        const parts = String(apptTimeStr).split(':');
        const hh = parseInt(parts[0] || '0', 10);
        const mm = parseInt(parts[1] || '0', 10);
        try {
            return new Date(`${apptDateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
        } catch {
            return null;
        }
    })();
    const isPast = (() => {
        if (!apptDateTime) return false;
        const now = new Date();
        return now.getTime() > apptDateTime.getTime();
    })();
    const canManage = ['employee','admin','private_admin','superadmin'].includes(String(user?.role));
    const showButtons = (canManage && (['pending','accepted'].includes(String(selectedElement.status))) && !selectedElement.is_cancelled && !selectedElement.is_completed);

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
                <a href={`tel:${selectedElement.phone_number || selectedElement.phone || '+998901231223'}`}>
                    <img src="/images/callingIcon.png" alt={t("Call")} />
                    {selectedElement.phone_number || selectedElement.phone || '+998901231223'}
                </a>
                <button onClick={() => {
                    navigator.clipboard.writeText(selectedElement.phone_number || selectedElement.phone || '+998901231223');
                }}>
                    <img src="/images/copyIcon.png" alt={t("Copy")} />
                </button>
            </div>

            <div className='right-appNumb'>
                <h3>
                    {selectedElement.application_number || t('notAvailable')}
                </h3>
            </div>

            <div className='right-status-cont' style={{ display: 'flex', flexDirection: 'column', gap: '0.6vw' }}>
                <div className='right-status-badge' style={{
                    backgroundColor:
                        selectedElement.is_completed ? '#4CAF50' :
                            selectedElement.is_confirmed ? '#2196F3' :
                                (selectedElement.is_cancelled || selectedElement.status === 'cancelled') ? '#f44336' :
                                    (selectedElement.status === 'accepted' ? '#FF9800' : (isPast && selectedElement.status === 'pending' ? '#9E9E9E' : '#9E9E9E')),
                    borderRadius: "0.8vw",
                    padding: "0.8vw 1.2vw",
                    width: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <p style={{ margin: 0, color: '#fff', fontWeight: 600 }}>
                        {selectedElement.is_completed ? t('statusCompleted') :
                            selectedElement.is_confirmed ? t('statusConfirmed') :
                                (selectedElement.is_cancelled || selectedElement.status === 'cancelled') ? t('statusCancelled') :
                                    selectedElement.status === 'accepted' ? t('statusAccepted') :
                                        (isPast ? t('statusExpired') : t('statusPending'))}
                    </p>
                </div>
                {selectedElement.is_paid ? (
                    <div className='right-paid-badge' style={{
                        backgroundColor: '#9C2BFF',
                        borderRadius: "0.8vw",
                        padding: "0.8vw 1.2vw",
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <p style={{ margin: 0, color: '#fff', fontWeight: 600 }}>
                            {(() => {
                                const amt = selectedElement.paid_amount;
                                const n = typeof amt === 'number' ? amt : parseInt(String(amt || ''), 10);
                                const formatted = isNaN(n) ? '' : new Intl.NumberFormat('ru-RU').format(n);
                                return `${t('Оплачено') || 'Оплачено'}${formatted ? `: ${formatted} сум` : ''}`;
                            })()}
                        </p>
                    </div>
                ) : null}
            </div>

            <div className='right-appTime-cont'>
                <div className='right-appTime-top'>
                    <h4>{t('timeLabel')}</h4>
                </div>
                <div className='right-appTime-btm'>
                    <div className='appTime-left'>
                        <div>
                            <p>
                                {(() => {
                                    if (scheduleLoading) return t('loading');
                                    const st = scheduleData?.start_time
                                        || selectedElement.application_time
                                        || selectedElement.time
                                        || selectedElement.start_time;
                                    return st ? String(st).substring(0, 5) : t('notAvailable');
                                })()}
                            </p>
                        </div>
                    </div>
                    <div className='appTime-right'>
                        <div>
                            <p>
                                {(() => {
                                    if (scheduleLoading) return t('loading');
                                    if (scheduleData?.end_time) return String(scheduleData.end_time).substring(0, 5);
                                    const base = selectedElement.application_time || selectedElement.time || selectedElement.start_time;
                                    if (!base) return t('notAvailable');
                                    const parts = String(base).split(':');
                                    const h = parseInt(parts[0], 10);
                                    const m = parseInt(parts[1], 10);
                                    const dur = parseInt(selectedElement.service_duration, 10) || 60;
                                    const total = h * 60 + m + dur;
                                    const eh = Math.floor(total / 60) % 24;
                                    const em = total % 60;
                                    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
                                })()}
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
                    <button onClick={handleArrived} className='confirm-btn'>
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
