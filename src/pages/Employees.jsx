import React, { useState, useEffect } from 'react';
import { UseGlobalContext } from '../Context.jsx';
import BookScheduleModal from '../components/BookScheduleModal';
import EmployeeCard from '../components/EmployeeCard';
import EditEmployeeBar from '../components/EditEmployeeBar';
import AboutEmployeeBar from '../components/AboutEmployeeBar';
import EmployWaitingCard from '../components/EmployWaitingCard';
import AddEmployeeModal from '../components/AddEmployeeModal';

const Employees = () => {
  const { t, waitingEmp, setWaitingEmp, employees, employeesBySalon, handleAddWaitingEmp, handleRemoveWaitingEmp, isCheckedItem, setIsCheckedItem, fetchEmployees, employeesLoading, user, mySchedules, mySchedulesLoading, mySchedulesError, fetchMySchedules, markEmployeeBusy } = UseGlobalContext();
  const [openCardId, setOpenCardId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState({ menu: null, cardId: null });
  const [showWait, setShowWait] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingEmployeeId, setBookingEmployeeId] = useState(null);
  const [showBusyModal, setShowBusyModal] = useState(false);
  const [busyEmployeeId, setBusyEmployeeId] = useState(null);
  const [busyDate, setBusyDate] = useState('');
  const [busyStart, setBusyStart] = useState('');
  const [busyEnd, setBusyEnd] = useState('');
  const [busyNote, setBusyNote] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sahifa ochilganda va salon o'zgarganda xodimlarni yuklash
  useEffect(() => {
    console.log('🟢 Employees page mounted');
    console.log('🟢 Token in localStorage:', localStorage.getItem('authToken'));
    console.log('🟢 UserData in localStorage:', localStorage.getItem('userData'));
    console.log('🟢 Current user:', user);
    if (user?.salon_id) {
      fetchEmployees(user.salon_id);
    } else {
      fetchEmployees();
    }
  }, [user?.salon_id]);

  useEffect(() => {
    (async () => {
      if (user && String(user.role || '').toLowerCase() === 'employee') {
        try { console.log('Employees: user info', { role: user.role, id: user.id, employee_id: user.employee_id, salon_id: user.salon_id }); } catch {}
        if (user?.salon_id) {
          fetchEmployees(user.salon_id);
        }
        const d = new Date().toISOString().substring(0,10);
        try {
          await fetchSchedules();
        } catch (e) {
          try { console.log('Employees: fetchSchedules error', e?.message); } catch {}
        }
        try {
          const res = await fetchMySchedules(d);
          try { console.log('Employees: fetchMySchedules result', { count: Array.isArray(res) ? res.length : 0 }); } catch {}
        } catch (e) {
          try { console.log('Employees: fetchMySchedules error', e?.message); } catch {}
        }
      }
    })();
  }, [user?.id]);

  // Function to toggle the menu for a specific card
  const handleToggleMenu = (id) => {
    setOpenCardId((prevId) => (prevId === id ? null : id));
  };

  // Function to close sidebar
  const handleCloseSidebar = () => {
    setIsMenuOpen({ cardId: null, menu: null });
  };

  // Filter employees based on search query
  const filterEmployees = (employeesList) => {
    if (!searchQuery.trim()) return employeesList;
    
    const query = searchQuery.toLowerCase().trim();
    return employeesList.filter(employee => {
      const name = (employee.name || employee.employee_name || '').toLowerCase();
      const phone = (employee.phone || employee.employee_phone || '').toLowerCase();
      const email = (employee.email || employee.employee_email || '').toLowerCase();
      const profession = (employee.profession || '').toLowerCase();
      
      return name.includes(query) || 
             phone.includes(query) || 
             email.includes(query) || 
             profession.includes(query);
    });
  };

  // Faqat joriy salon xodimlarini ko'rsatamiz
  const salonIdStr = String(user?.salon_id || '');
  const waitingBySalon = (waitingEmp || []).filter(emp => {
    const sid = emp?.salon_id ?? emp?.salonId ?? (emp?.salon && emp.salon.id);
    return sid && String(sid) === salonIdStr;
  });

  // Filter working employees (not in waiting list)
  let workingEmployees = employeesBySalon.filter(
    (employee) => !waitingBySalon.some((emp) => emp.id === employee.id)
  );

  // Apply search filter
  const filteredWorkingEmployees = filterEmployees(workingEmployees);
  const filteredWaitingEmployees = filterEmployees(waitingBySalon);

  // Close card menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        !event.target.closest('.employCard-menu') &&
        !event.target.closest('.employCard-menuBtn')
      ) {
        setOpenCardId(null);
      }
    };

    let timer;
    if (openCardId !== null) {
      timer = setTimeout(() => {
        setOpenCardId(null);
      }, 7000);
    }

    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      if (timer) clearTimeout(timer);
    };
  }, [openCardId]);

  // Find the selected employee based on isMenuOpen.cardId
  const selectedEmployee = (employeesBySalon || employees || []).find((item) => item.id === isMenuOpen.cardId);
  useEffect(() => {
    if (isMenuOpen.menu === 'busy' && isMenuOpen.cardId) {
      setBusyEmployeeId(isMenuOpen.cardId);
      setShowBusyModal(true);
      setBusyDate(new Date().toISOString().substring(0,10));
      setBusyStart('09:00');
      setBusyEnd('10:00');
      setBusyNote('');
    }
  }, [isMenuOpen]);

  const openBookingForEmployee = (employeeId) => {
    setBookingEmployeeId(employeeId)
    setShowBookingModal(true)
  }
  const closeBookingModal = () => {
    setShowBookingModal(false)
    setBookingEmployeeId(null)
  }

  return (
    <section>
      <nav className="employ-nav">
        <div className="employ-nav-top">
          <div className="employ-nav-logo">
            <img src="/images/employIcon.png" alt="" />
            <h2>{t('employHT')}</h2>
          </div>
          <div className="employ-nav-summ">
            <h2>{employeesBySalon.length}</h2>
            <h5>{t('employSmry')}</h5>
          </div>
        </div>
        <div className="employ-nav-search">
          {showWait ? (
            <button onClick={() => setShowWait(false)} className='employ-waiting-close'>
              <p><span>←</span> Назад</p>
            </button>
          ) : null}
          
          <img src="/images/searchIcon.png" alt="" className='employ-nav-search-icon' />
          <input 
            type="text" 
            placeholder={t('homeSrchPlhdr')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="employ-filter-btn">
            <img src="/images/employFilterIcon.png" alt="" />
          </button>

          {showWait ? (
            <>
              <button className='employ-waiting-returnEmp' onClick={() => handleRemoveWaitingEmp(isCheckedItem)}>
                <img src="/images/returnEmployIcon.png" alt="" />
                <p>Вернуться в числа сотрудников</p>
              </button>
            </>
          ) : (
            <>
              <button className="employ-filter-waiting" onClick={() => setShowWait(true)}>
                <img src="/images/waitingIcon.png" alt="" />
                {t('employWait')} ({waitingBySalon.length})
              </button>
              <button
                className="employ-filter-send"
                onClick={() => handleAddWaitingEmp(isCheckedItem)}
                disabled={isCheckedItem.length === 0}
                style={{
                  backgroundColor: isCheckedItem.length === 0 ? '#FF2B2B66' : '#FF2B2B',
                  cursor: isCheckedItem.length === 0 ? 'auto' : 'pointer'
                }}
              >
                <img src="/images/employSendWait.png" alt="" />
                {t('employSendWait')}
              </button>
              {user && user.role === 'admin' && (
                <button className="employ-filter-add" onClick={() => setShowAddEmployeeModal(true)}>
                  <img src="/images/+.png" alt="" />
                  {t('employAddBtn')}
                </button>
              )}
            </>
          )}
        </div>
      </nav>
      
      <div className="employ-body">
        {user && String(user.role || '').toLowerCase() === 'employee' ? (
          <div style={{ margin: '1rem 0', padding: '1rem', border: '1px solid #eee', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{t('mySchedule') || 'Mening jadvalim'}</h3>
              <button
                type="button"
                className='schedule-btn'
                onClick={() => {
                  setBusyEmployeeId(String(user?.id || user?.employee_id || ''));
                  setBusyDate(new Date().toISOString().substring(0,10));
                  setBusyStart('09:00');
                  setBusyEnd('10:00');
                  setBusyNote('');
                  setShowBusyModal(true);
                }}
              >{t('busy') || 'Band qilish'}</button>
            </div>
            {mySchedulesLoading ? (
              <div style={{ padding: '0.5rem 0' }}>{t('loading') || 'Yuklanmoqda...'} </div>
            ) : mySchedulesError ? (
              <div style={{ color: '#FF6B6B', padding: '0.5rem 0' }}>{mySchedulesError}</div>
            ) : Array.isArray(mySchedules) && mySchedules.length > 0 ? (
              (() => {
                try { console.log('Employees: render mySchedules', { count: mySchedules.length }); } catch {}
                const groups = new Map();
                for (const s of mySchedules) {
                  const k = String(s.date || '').substring(0,10);
                  if (!groups.has(k)) groups.set(k, []);
                  groups.get(k).push(s);
                }
                const ordered = Array.from(groups.entries()).sort((a, b) => new Date(a[0]) - new Date(b[0]));
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '0.5rem' }}>
                    {ordered.map(([dateKey, items]) => (
                      <div key={dateKey} style={{ background: '#FFFFFF', border: '1px solid #EEE', borderRadius: '12px' }}>
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid #EEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700 }}>{dateKey}</span>
                          <span style={{ color: '#7A7A89', fontSize: '12px' }}>{items.length}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', padding: '8px 12px' }}>
                          {items.map((s) => {
                            const start = String(s.start_time || s.start || '00:00').substring(0,5);
                            const end = String(s.end_time || s.end || '23:59').substring(0,5);
                            const title = s.name || s.title || (t('schedule') || 'Jadval');
                            return (
                              <div key={s.id || `${dateKey}-${start}-${end}-${title}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F8FA', borderRadius: '10px', padding: '8px 12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 600 }}>{title}</span>
                                  <span style={{ color: '#7A7A89', fontSize: '12px' }}>{start}–{end}</span>
                                </div>
                                <div style={{ color: '#9C2BFF', fontWeight: 600 }}>{s.price ? Number(s.price).toLocaleString() : ''}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : (
              <div style={{ padding: '0.5rem 0', color: '#A8A8B3' }}>{t('noSchedules') || 'Jadval yo\'q'}</div>
            )}
          </div>
        ) : null}
        {employeesLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            {t('loading')}...
          </div>
        ) : showWait ? (
          filteredWaitingEmployees.length > 0 ? (
            filteredWaitingEmployees.map((item) => (
              <EmployWaitingCard
                key={item.id}
                {...item}
                isOpen={openCardId === item.id}
                handleToggleMenu={() => handleToggleMenu(item.id)}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                isCheckedItem={isCheckedItem}
                setIsCheckedItem={setIsCheckedItem}
                handleRemoveWaitingEmp={handleRemoveWaitingEmp}
              />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#A8A8B3' }}>
              {searchQuery ? t('searchNoResults') : t('noWaitingEmployees')}
            </div>
          )
        ) : (
          filteredWorkingEmployees.length > 0 ? (
            filteredWorkingEmployees.map((item) => (
              <div key={item.id} style={{ position: 'relative' }}>
                <EmployeeCard
                  {...item}
                  isOpen={openCardId === item.id}
                  handleToggleMenu={() => handleToggleMenu(item.id)}
                  isMenuOpen={isMenuOpen}
                  setIsMenuOpen={setIsMenuOpen}
                  isCheckedItem={isCheckedItem}
                  setIsCheckedItem={setIsCheckedItem}
                  handleAddWaitingEmp={handleAddWaitingEmp}
                />
                
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#A8A8B3' }}>
              {searchQuery ? t('searchNoResults') : t('noEmployees')}
            </div>
          )
        )}
      </div>
      
      <div className="employ-menuBar">
        {isMenuOpen.menu === 'edit' && <EditEmployeeBar employee={selectedEmployee} onClose={handleCloseSidebar} />}
        {isMenuOpen.menu === 'see' && <AboutEmployeeBar employee={selectedEmployee} onClose={handleCloseSidebar} />}
      </div>
      
      {showAddEmployeeModal && (
        <AddEmployeeModal 
          onClose={() => setShowAddEmployeeModal(false)}
          onEmployeeAdded={() => {
            setShowAddEmployeeModal(false);
            fetchEmployees(user?.salon_id);
          }}
        />
      )}
      {showBusyModal && busyEmployeeId ? (
        <div className='schedule-modal' onClick={() => { setShowBusyModal(false); setBusyEmployeeId(null); }}>
          <div className='schedule-modal-cont' onClick={(e) => e.stopPropagation()}>
            <h4>{t('busy') || 'Band'}</h4>
            <div className='schedule-modal-form'>
              <label htmlFor=''>{t('schedule.date') || 'Дата'}</label>
              <input type='date' className='form-inputs' value={busyDate} onChange={(e) => setBusyDate(e.target.value)} />
              <label htmlFor=''>{t('schedule.startTime') || 'Время начала'}</label>
              <input type='time' className='form-inputs' value={busyStart} onChange={(e) => setBusyStart(e.target.value)} />
              <label htmlFor=''>{t('schedule.endTime') || 'Время окончания'}</label>
              <input type='time' className='form-inputs' value={busyEnd} onChange={(e) => setBusyEnd(e.target.value)} />
              <label htmlFor=''>{t('schedule.title') || 'Титул'}</label>
              <input type='text' className='form-inputs' value={busyNote} onChange={(e) => setBusyNote(e.target.value)} placeholder={t('busy') || 'Band'} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button className='schedule-btn' onClick={() => { setShowBusyModal(false); setBusyEmployeeId(null); }}>{t('cancel') || 'Bekor qilish'}</button>
              <button className='schedule-btn' onClick={async () => {
                await markEmployeeBusy(busyEmployeeId, busyDate, busyStart, busyEnd, busyNote);
                setShowBusyModal(false);
                setBusyEmployeeId(null);
                const d = new Date().toISOString().substring(0,10);
                await fetchMySchedules(d);
              }}>{t('save') || 'Saqlash'}</button>
            </div>
          </div>
        </div>
      ) : null}
      {showBookingModal && bookingEmployeeId ? (
        <BookScheduleModal
          salon_id={user?.salon_id}
          date={new Date().toISOString().substring(0,10)}
          start_time={'00:00'}
          end_time={'23:59'}
          name={t('appointmentTypeBooking') || 'Band qilish'}
          service_duration={60}
          employee_list={[bookingEmployeeId]}
          whole_day={true}
          setEditModal={(v) => { if (!v) closeBookingModal() }}
        />
      ) : null}
    </section>
  );
};

export default Employees;
