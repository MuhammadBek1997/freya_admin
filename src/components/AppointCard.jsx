import React from 'react'
import { UseGlobalContext } from '../Context';

const AppointCard = (props) => {
    const {
        id,
        employee_id,
        application_number,
        user_name,
        phone_number,
        application_date,
        application_time,
        employee_name,
        service_name,
        service_price,
        status,
        type,
        full_name,
        phone,
        date,
        time: booking_time,
        openRightSidebar
    } = props
  
    const { t, selectedElement, employees } = UseGlobalContext()

    const parseDate = (dateString) => {
        if (!dateString) return { day: '', month: '', year: '' };
        const date = new Date(dateString);
        return {
            day: date.getDate(),
            month: date.getMonth() + 1,
            year: date.getFullYear()
        };
    };

    const parseTime = (timeString) => {
        if (!timeString) return { hour: '', minute: '' };
        const [hour, minute] = timeString.split(':');
        return {
            hour: parseInt(hour),
            minute: parseInt(minute)
        };
    };

    const dateObj = type === 'appointment'
        ? parseDate(application_date)
        : parseDate(date);

    const timeObj = type === 'appointment'
        ? parseTime(application_time)
        : (typeof booking_time === 'string' ? parseTime(booking_time) : { hour: '', minute: '' });

    const handleCardClick = () => {
        openRightSidebar({
            id,
            type,
            application_number,
            user_name,
            phone_number,
            application_date,
            application_time,
            employee_name: masterName || null,
            service_name,
            service_price,
            full_name,
            phone,
            date,
            time: booking_time,
            timeObj,
            dateObj,
            status,
        });
    }

    // Derive employee name from employee_id using global employees list
    const masterName = (() => {
        if (type === 'appointment' && employee_id) {
            const emp = employees?.find(e => String(e.id) === String(employee_id));
            if (emp) {
                const parts = [emp.name, emp.surname].filter(Boolean);
                return parts.join(' ').trim();
            }
        }
        return null;
    })();

    return (
        <div onClick={() => handleCardClick()} className='appoint-card'>
            <div className='appoint-card-customer' style={{
                backgroundColor: selectedElement?.id == id ? "#C3A3D1" : "white",
                color: "#2C2C2C"
            }}>
                {
                    (() => {
                        const customerAvatar = props.user_avatar || props.user_avatar_url || props.avatar || props.avatar_url || "/images/customerImage.png";
                        return <img src={customerAvatar} alt="" />
                    })()
                }
                <p className='customerName'>
                    {type === 'appointment' ? (user_name) : (full_name || t('notAvailable'))}
                </p>
                <p className='appointNumber'>
                    {type === 'appointment' ? (application_number) : (id)}
                </p>
                <a className='customerNumber'>
                    {type === 'appointment' ? (phone_number) : (phone)}
                </a>
                <p className='appointDate'>
                    {type === 'appointment'
                        ? (application_date ? new Date(application_date).toLocaleDateString('ru-RU') : t('notAvailable'))
                        : (date ? new Date(date).toLocaleDateString('ru-RU') : t('notAvailable'))}
                </p>
                <p className='appointTime'>
                    {type === 'appointment' ? (application_time || t('notAvailable')) : (booking_time || t('notAvailable'))}
                </p>
            </div>
            <div className='appoint-card-master'>
                {(() => {
                    const emp = (type === 'appointment' && employee_id) ? employees?.find(e => String(e.id) === String(employee_id)) : null;
                    const masterAvatar = emp?.avatar_url || emp?.photo || emp?.profile_image || "/images/masterImage.png";
                    return <img src={masterAvatar} alt="" />
                })()}
                <div className='appoint-card-master-text'>
                    <div className='appoint-card-masterName'>
                            <p>
                                {type === 'appointment'
                                ? (masterName ? masterName.split(" ").at(0) : t('notAvailable'))
                                : t('notAvailable')}
                            </p>
                        <div className='appoint-card-masterJob'>
                            <p>
                                {type === 'appointment' ? service_name : t('appointmentTypeBooking')}
                            </p>
                        </div>
                    </div>
                    <div className='appoint-card-masterRating'>
                        <img src="/images/Star1.png" alt="" />
                        <p>
                            4.8 (13 {t('profileReviews')})
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AppointCard