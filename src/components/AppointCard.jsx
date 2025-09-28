import React from 'react'
import { UseGlobalContext } from '../Context';

const AppointCard = ({
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
    openRightSidebar
}) => {
  
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

    const date = parseDate(application_date);
    const time = parseTime(application_time);

    const handleCardClick = () => {
        openRightSidebar({
            id,
            application_number,
            user_name,
            phone_number,
            application_date,
            application_time,
            employee_name,
            service_name,
            service_price,
            status
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
                    {user_name}
                </p>
                <p className='appointNumber'>
                    {application_number}
                </p>
                <a className='customerNumber'>
                    {phone_number}
                </a>
                <p className='appointDate'>
                    {application_date ? new Date(application_date).toLocaleDateString('ru-RU') : 'N/A'}
                </p>
                <p className='appointTime'>
                    {application_time || 'N/A'}
                </p>
            </div>
            <div className='appoint-card-master' >
                <img src="/images/masterImage.png" alt="" />
                <div className='appoint-card-master-text'>
                    <div className='appoint-card-masterName'>
                        <p>
                            {employee_name ? employee_name.split(" ").at(0) : 'N/A'}
                        </p>
                        <div className='appoint-card-masterJob'>
                            <p>
                                {service_name}
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