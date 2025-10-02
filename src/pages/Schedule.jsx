import { useRef, useState, useEffect } from 'react';
import { UseGlobalContext } from '../Context'
import AddScheduleModal from '../components/AddScheduleModal';
import EditScheduleModal from '../components/EditScheduleModal';
import BookScheduleModal from '../components/BookScheduleModal';

const Schedule = () => {
  const {
    t,
    selectDay,
    setSelectDay,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    scrollRight,
    addSched,
    setAddSched,
    schedules,
    fetchSchedules,
    createSchedule,
    groupedSchedules,
    fetchGroupedSchedules,
    groupedSchedulesLoading,
    employees,
    fetchEmployees,
    services,
    fetchServices
  } = UseGlobalContext()
  let currentDay = {
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  }


  const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  // API dan kelgan guruhlangan ma'lumotlarni ishlatamiz
  const dayListItems = groupedSchedules || [];
  const [editModal, setEditModal] = useState(false)

  // Component yuklanganda grouped schedules ni fetch qilish
  useEffect(() => {
    fetchGroupedSchedules();
  }, []);

  // dayListItems yuklanganda birinchi kunni default tanlash
  useEffect(() => {
    if (dayListItems.length > 0 && selectDay.length === 0) {
      setSelectDay(dayListItems[0]);
    }
  }, [dayListItems, selectDay.length, setSelectDay]);



  const containerRef = useRef(null)

  const handleSelectDay = (element) => {
    localStorage.setItem("schedDay", JSON.stringify(element))
    setSelectDay(element)
  }

  

  return (
    <section>
      <nav className="sched-nav">
        <div className="sched-nav-top">
          <img src="/images/clientSchedule.png" alt="" />
          <h2>
            {t('schedHT')}
          </h2>
        </div>
        <div className="sched-nav-search">
          <img src="/images/searchIcon.png" alt="" />
          <input type="text" placeholder={t('homeSrchPlhdr')} />
          <button className='sched-add-btn' onClick={() => setAddSched(true)}>
            <img src="/images/+.png" alt="" />
            <p>
              {t("schedSrchBtn")}
            </p>
          </button>
        </div>
        <div className='sched-dayList'>
          <div
            ref={containerRef}
            className="sched-dayList-cont"
            onMouseDown={(e) => handleMouseDown(e, containerRef)}
            onMouseMove={(e) => handleMouseMove(e, containerRef)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              paddingLeft: "2.9vw",
              marginLeft: "-2.9vw"
            }}>
            {dayListItems.map((itemArr) => {
              const firstItem = itemArr[0]

              return (
                <button
                  className='sched-dayList-item'
                  onClick={() => handleSelectDay(itemArr)}
                  key={firstItem.id}
                  style={{
                    color: selectDay.length > 0 && selectDay[0].id === firstItem.id && (firstItem.dayOfWeek === weekdays[5] || firstItem.dayOfWeek === weekdays[6])
                      ? 'white'
                      : selectDay.length > 0 && selectDay[0].id === firstItem.id
                        ? 'white'
                        : (firstItem.dayOfWeek === weekdays[5] || firstItem.dayOfWeek === weekdays[6])
                          ? '#FF0000'
                          : '#9C2BFF',
                    backgroundColor: selectDay.length > 0 && selectDay[0].id === firstItem.id && (firstItem.dayOfWeek === weekdays[5] || firstItem.dayOfWeek === weekdays[6])
                      ? '#FF0000'
                      : selectDay.length > 0 && selectDay[0].id === firstItem.id
                        ? '#9C2BFF'
                        : 'white'
                  }}
                >
                  <div
                    className='sum-of-orders'
                    style={{
                      backgroundColor: selectDay.length > 0 && selectDay[0].id === firstItem.id && (firstItem.dayOfWeek === weekdays[5] || firstItem.dayOfWeek === weekdays[6])
                        ? 'white'
                        : (firstItem.dayOfWeek === weekdays[5] || firstItem.dayOfWeek === weekdays[6])
                          ? '#FF0000'
                          : selectDay.length > 0 && selectDay[0].id === firstItem.id ?
                            "white"
                            : '#9C2BFF',
                      color: selectDay.length > 0 && selectDay[0].id === firstItem.id && (firstItem.dayOfWeek === weekdays[5] || firstItem.dayOfWeek === weekdays[6])
                        ? '#FF0000'
                        : (firstItem.dayOfWeek === weekdays[5] || firstItem.dayOfWeek === weekdays[6])
                          ? 'white'
                          : selectDay.length > 0 && selectDay[0].id === firstItem.id ?
                            "#9C2BFF"
                            : 'white'
                    }}
                  >
                    {itemArr.length}
                  </div>
                  {t(firstItem.dayOfWeek)}
                </button>
              )
            })}
          </div>
          {
            dayListItems.length > 18 ?
              <button className='sched-dayList-btn' onClick={() => scrollRight(containerRef)} >
                <img src="/images/leftArrow.png" alt="" />
              </button>
              : null
          }
        </div>
      </nav>
      <div className='schedule-body'>
        {
          (selectDay.length > 0 ? selectDay : []).map((item) => {
            return (
              <div key={item.id} className='schedule-list-item'>
                <div className='schedule-item-top'>
                  <div className="schedule-order">
                    <div className="schedule-order-type">
                      <img src="/images/scheduleOrderIcon.png" alt="orderStar" />
                      <h3>
                        {item.name}
                      </h3>
                    </div>
                    <p className='order-title'>
                      {item.title}
                    </p>
                    <div className='schedule-order-pricebox'>
                      <p>
                        Цена
                      </p>
                      <div>
                        <h3>
                          {item.price / 1000} 000 <span>uzs</span>
                        </h3>
                      </div>
                      <p>
                        Начальный взнос:
                      </p>
                      <div>
                        <h3>
                          {item.deposit != 0 ? item.deposit / 1000 + " 000" : 0} <span>uzs</span>
                        </h3>
                      </div>
                    </div>
                  </div>
                  <button 
                      className='schedule-list-item-btn'
                      onClick={()=>setEditModal(true)}>
                    <img src={(new Date(item.date).getDate() - 7) <= currentDay.day && new Date(item.date).getMonth() + 1 == currentDay.month ? "/images/reserveIcon.png" : "/images/editPen.png"} alt="" />
                  </button>
                  <div className='editChedule'>
                    {
                      editModal
                      ?
                      <>
                      {
                        (new Date(item.date).getDate() - 7) <= currentDay.day
                      && new Date(item.date).getMonth() + 1 == currentDay.month
                      ?
                      <BookScheduleModal {...item} setEditModal={setEditModal}/>
                      :
                      <EditScheduleModal {...item} setEditModal={setEditModal} />
                      }
                      </>
                      :
                      null
                    }
                  </div>
                </div>
                <div className="schedule-item-masters">
                  {
                    
                    (Array.isArray(item.employee_list) ? item.employee_list : []).map((employeeId) => {
                      let master = (employees || []).find((i) => i.id == employeeId) || { id: employeeId, name: 'Unknown Master' }
                      return (
                        <div className='schedule-master-card' key={master.id}>
                          <img src="/images/masterImage.png" alt="" />
                          <p>
                            {master.name.split(" ")[0]}
                          </p>
                          <div className='masters-time'>
                            <p>
                              {item.start_time} - {item.end_time}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            )
          })
        }
      </div>

      <div className='addChedule'>
        {addSched ? <AddScheduleModal /> : null}
      </div>
    </section>
  )
}

export default Schedule