import React from 'react'
import { UseGlobalContext } from '../Context';

const AppointCard = ({id,is_confirmed,salon,service, customer_name,appointment_time, appointment_date,time, date, master, openRightSidebar}) => {
  
    const {selectedElement,mastersArr} = UseGlobalContext()


    const handleCardClick = () => {
        openRightSidebar({id,is_confirmed,salon,service, customer_name,appointment_time, appointment_date,time, date, master});
        
    }
    
    const selectedMaster = mastersArr.find((item)=>item.id == master) 
    

    return (
        <div onClick={()=>handleCardClick()} className='appoint-card' >
            <div className='appoint-card-customer' style={{
            backgroundColor: selectedElement?.id == id ? "#C3A3D1" :  "white",
            color: "#2C2C2C"
        }}>
                <img src="/images/customerImage.png" alt="" />
                <p className='customerName'>
                    {customer_name}
                </p>
                <p className='appointNumber'>
                    WS33012487
                </p>
                <a className='customerNumber'>
                    +998901231223
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
                            {selectedMaster.name.split(" ").at(0)}
                        </p>
                        <div className='appoint-card-masterJob'>
                            <p>
                                {selectedMaster.spec}
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