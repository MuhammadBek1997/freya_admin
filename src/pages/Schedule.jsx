import { useRef, useState, useEffect, useMemo } from 'react';
import { UseGlobalContext } from '../Context.jsx'
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
    employees,
    employeesBySalon
  } = UseGlobalContext()

  let currentDay = {
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  }

  const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  const dayListItems = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const list = Array.isArray(schedules) ? [...schedules] : []
    const groupsMap = new Map()
    for (const s of list) {
      if (!s?.date) continue
      const key = String(s.date)
      // O'tib ketgan kunlarni filterlash
      if (new Date(key) < today) continue
      const arr = groupsMap.get(key) || []
      arr.push(s)
      groupsMap.set(key, arr)
    }
    const groups = Array.from(groupsMap.entries()).map(([key, arr]) => {
      const sortedArr = arr.sort((a, b) => {
        const [ah, am] = String(a.start_time || '00:00').split(':').map(Number)
        const [bh, bm] = String(b.start_time || '00:00').split(':').map(Number)
        return (ah * 60 + am) - (bh * 60 + bm)
      })
      return { key, items: sortedArr }
    })
    groups.sort((g1, g2) => new Date(g1.key) - new Date(g2.key))
    return groups.map(g => g.items)
  }, [schedules])
  const [editModal, setEditModal] = useState(false)
  const [bookEmployeeId, setBookEmployeeId] = useState(null)
  const [activeModalScheduleId, setActiveModalScheduleId] = useState(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Component yuklanganda schedules ni fetch qilish
  useEffect(() => {
    fetchSchedules();
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

  const handleOpenEditOrReserve = (scheduleId) => {
    setActiveModalScheduleId(scheduleId)
    setBookEmployeeId(null)
    setEditModal(true)
  }

  const handleOpenBookingForEmployee = (scheduleId, employeeId) => {
    setActiveModalScheduleId(scheduleId)
    setBookEmployeeId(employeeId)
    setEditModal(true)
  }

  const handleCloseModal = (value) => {
    setEditModal(value)
    if (!value) {
      setBookEmployeeId(null)
      setActiveModalScheduleId(null)
    }
  }

  // Filter schedules based on search query
  const filterSchedules = (schedulesList) => {
    if (!searchQuery.trim()) return schedulesList;

    const query = searchQuery.toLowerCase().trim();
    return schedulesList.filter(schedule => {
      const name = (schedule.name || '').toLowerCase();
      const title = (schedule.title || '').toLowerCase();
      const price = (schedule.price || '').toString();

      // Employee names search
      const employeeNames = (schedule.employee_list || [])
        .map(empId => {
          const emp = (employeesBySalon || employees || []).find(e => e.id === empId);
          return (emp?.name || '').toLowerCase();
        })
        .join(' ');

      return name.includes(query) ||
        title.includes(query) ||
        price.includes(query) ||
        employeeNames.includes(query);
    });
  };

  // Filter selected day schedules
  const filteredSelectedDaySchedules = filterSchedules(selectDay.length > 0 ? selectDay : []);

  return (
    <section>
      <nav className="sched-nav">
        <div className="sched-nav-top">
          <img src="/images/clientSchedule.png" alt="" />
          <h2>{t('schedHT')}</h2>
        </div>

        <div className="sched-nav-search">
          <img src="/images/searchIcon.png" alt="" />
          <input
            type="text"
            placeholder={t('homeSrchPlhdr')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className='sched-add-btn' onClick={() => setAddSched(true)}>
            <img src="/images/+.png" alt="" />
            <p>{t("schedSrchBtn")}</p>
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
              const groupKey = String(firstItem.date)
              const dateObj = new Date(firstItem.date)
              const dowIndex = dateObj.getDay()
              const dowKey = weekdays[dowIndex]
              const isWeekend = dowKey === weekdays[6] || dowKey === weekdays[0]
              const isSelected = selectDay.length > 0 && selectDay[0].id === firstItem.id
              const dayNum = dateObj.getDate()
              const monthNum = dateObj.getMonth() + 1
              const dateStr = `${dayNum < 10 ? '0' + dayNum : dayNum}.${monthNum < 10 ? '0' + monthNum : monthNum}`

              return (
                <button
                  className='sched-dayList-item'
                  onClick={() => handleSelectDay(itemArr)}
                  key={groupKey}
                  style={{
                    color: isSelected ? 'white' : isWeekend ? '#FF0000' : '#9C2BFF',
                    backgroundColor: isSelected && isWeekend ? '#FF0000' : isSelected ? '#9C2BFF' : 'white',
                    flexDirection: 'column',
                    gap: '0.15vw',
                    whiteSpace: 'normal',
                    minWidth: '5vw',
                    padding: '0.3vw 0.5vw',
                  }}
                >
                  <div style={{
                    display:"flex",
                    gap:"5px"
                  }}>
                    <div
                      className='sum-of-orders'
                      style={{
                        backgroundColor: isSelected && isWeekend ? 'white' : isWeekend ? '#FF0000' : isSelected ? 'white' : '#9C2BFF',
                        color: isSelected && isWeekend ? '#FF0000' : isWeekend ? 'white' : isSelected ? '#9C2BFF' : 'white',
                        fontSize:"0.9vw"
                      }}
                    >
                      {itemArr.length}
                    </div>
                    <span style={{ fontSize: '0.9vw', fontWeight: 600 }}>{t(dowKey)}</span>
                  </div>

                  <span style={{ fontSize: '0.7vw', opacity: 0.85 }}>{dateStr}</span>
                </button>
              )
            })}
          </div>
          {dayListItems.length > 18 ? (
            <button className='sched-dayList-btn' onClick={() => scrollRight(containerRef)} >
              <img src="/images/leftArrow.png" alt="" />
            </button>
          ) : null}
        </div>
      </nav>

      <div className='schedule-body'>
        {filteredSelectedDaySchedules.length > 0 ? (
          filteredSelectedDaySchedules.map((item) => {
            return (
              <div key={item.id} className='schedule-list-item' style={{ position: 'relative' }}>
                {item?.whole_day ? (
                  <div className='wholeday-text' style={{ position: 'absolute', top: '-15px', left: '-5px', background: '#FFF', color: '#9C2BFF', border: '1px solid #9C2BFF', borderRadius: '12px', padding: '3px 9px', fontSize: '0.8vw' }}>
                    {t('schedule.wholeDay')}
                  </div>
                ) : null}
                <div className='schedule-item-top'>
                  <div className="schedule-order">
                    <div className="schedule-order-type">
                      <img src="/images/scheduleOrderIcon.png" alt="orderStar" />
                      <h3>{item.name}</h3>
                    </div>
                    <p className='order-title'>{item.title}</p>
                    <div className='schedule-order-pricebox'>
                      <p>Цена</p>
                      <div>
                        <h3>{item.price / 1000} 000 <span>uzs</span></h3>
                      </div>
                      <p>Начальный взнос:</p>
                      <div>
                        <h3>{item.deposit != 0 ? item.deposit / 1000 + " 000" : 0} <span>uzs</span></h3>
                      </div>
                    </div>
                  </div>
                  <button
                    className='schedule-list-item-btn'
                    onClick={() => handleOpenEditOrReserve(item.id)}>
                    <img src={(new Date(item.date).getDate() - 7) <= currentDay.day && new Date(item.date).getMonth() + 1 == currentDay.month ? "/images/reserveIcon.png" : "/images/editPen.png"} alt="" />
                  </button>
                  <div className='editChedule'>
                    {editModal && activeModalScheduleId === item.id ? (
                      <>
                        {(new Date(item.date).getDate() - 7) <= currentDay.day
                          && new Date(item.date).getMonth() + 1 == currentDay.month
                          ? <BookScheduleModal {...item} employee_list={bookEmployeeId ? [bookEmployeeId] : item.employee_list} setEditModal={handleCloseModal} />
                          : <EditScheduleModal {...item} setEditModal={handleCloseModal} />}
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="schedule-item-masters">
                  {(Array.isArray(item.employee_list) ? item.employee_list : []).map((employeeId) => {
                    let master = (employeesBySalon || employees || []).find((i) => i.id == employeeId) || { id: employeeId, name: 'Unknown Master' }
                    return (
                      <div className='schedule-master-card' key={master.id}>
                        <img src={master?.avatar_url || master?.avatar || master?.profile_image || master?.photo || "/images/masterImage.png"} className="schedule-master-img" alt="" />
                        <p>{master.name.split(" ")[0]}</p>
                        <div className='masters-time'>
                          <p>{item.whole_day ? t('schedule.wholeDay') : `${String(item.start_time || '').substring(0, 5)} - ${String(item.end_time || '').substring(0, 5)}`}</p>
                        </div>

                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        ) : (
          <div style={{
            width: "100%",
            height: "60vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#A8A8B3",
            fontSize: "1vw"
          }}>
            {searchQuery ? t('searchNoResults') : t('noSchedules')}
          </div>
        )}
      </div>

      <div className='addChedule'>
        {addSched ? <AddScheduleModal /> : null}
      </div>
    </section>
  )
}

export default Schedule
