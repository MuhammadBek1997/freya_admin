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
    time,
    date,
    openRightSidebar
}) => {
  
    const {selectedElement} = UseGlobalContext()

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
            status,
            time,
            date
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
                    {date.day}.{date.month<10 ? 0+String(date.month) : date.month}.{date.year}
                </p>
                <p className='appointTime'>
                    {time.hour}:{time.minute < 10 ? "0" + time.minute : time.minute}
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