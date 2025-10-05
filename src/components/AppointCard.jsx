import React from 'react'
import { UseGlobalContext } from '../Context';

const AppointCard = (props) => {
    const {
        id,
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
  
    const {selectedElement} = UseGlobalContext()

    

    // Parse date and time from strings
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

    // type ga qarab (appointment yoki booking) sanani va vaqtni tayyorlash
    const dateObj = type === 'appointment'
        ? parseDate(application_date)
        : parseDate(date);

    const timeObj = type === 'appointment'
        ? parseTime(application_time)
        : (typeof booking_time === 'string' ? parseTime(booking_time) : { hour: '', minute: '' });

    const handleCardClick = () => {
        // O'ng sidebar uchun umumiy payload
        openRightSidebar({
            id,
            type,
            // Appointment
            application_number,
            user_name,
            phone_number,
            application_date,
            application_time,
            employee_name,
            service_name,
            service_price,
            // Booking
            full_name,
            phone,
            date,
            time: booking_time,
            // Common parsed
            time: timeObj,
            date: dateObj,
            status,
        });
    }

    return (
        <div onClick={()=>handleCardClick()} className='appoint-card' >
            <div className='appoint-card-customer' style={{
            backgroundColor: selectedElement?.id == id ? "#C3A3D1" :  "white",
            color: "#2C2C2C"
        }}>
                <img src="/images/customerImage.png" alt="" />
                <p className='customerName'>
                    {type === 'appointment' ? (user_name) : (full_name || 'N/A')}
                </p>
                <p className='appointNumber'>
                    {type === 'appointment' ? (application_number) : (id)}
                </p>
                <a className='customerNumber'>
                    {type === 'appointment' ? (phone_number) : (phone)}
                </a>
                <p className='appointDate'>
                    {type === 'appointment'
                        ? (application_date ? new Date(application_date).toLocaleDateString('ru-RU') : 'N/A')
                        : (date ? new Date(date).toLocaleDateString('ru-RU') : 'N/A')}
                </p>
                <p className='appointTime'>
                    {type === 'appointment' ? (application_time || 'N/A') : (booking_time || 'N/A')}
                </p>
            </div>
            <div className='appoint-card-master' >
                <img src="/images/masterImage.png" alt="" />
                <div className='appoint-card-master-text'>
                    <div className='appoint-card-masterName'>
                        <p>
                            {type === 'appointment'
                                ? (employee_name ? employee_name.split(" ").at(0) : 'N/A')
                                : 'N/A'}
                        </p>
                        <div className='appoint-card-masterJob'>
                            <p>
                                {type === 'appointment' ? service_name : 'Booking'}
                            </p>
                        </div>
                    </div>
                    <div className='appoint-card-masterRating'>
                        <img src="/images/Star1.png" alt="" />
                        <p>
                            4.8 (13 отзывов)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AppointCard