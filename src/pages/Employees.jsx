import React, { useState, useEffect } from 'react';
import { UseGlobalContext } from '../Context';
import BookScheduleModal from '../components/BookScheduleModal';
import EmployeeCard from '../components/EmployeeCard';
import EditEmployeeBar from '../components/EditEmployeeBar';
import AboutEmployeeBar from '../components/AboutEmployeeBar';
import EmployWaitingCard from '../components/EmployWaitingCard';
import AddEmployeeModal from '../components/AddEmployeeModal';

const Employees = () => {
  const { t, waitingEmp, setWaitingEmp, employees, employeesBySalon, handleAddWaitingEmp, handleRemoveWaitingEmp, isCheckedItem, setIsCheckedItem, fetchEmployees, employeesLoading, user } = UseGlobalContext();
  const [openCardId, setOpenCardId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState({ menu: null, cardId: null });
  const [showWait, setShowWait] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingEmployeeId, setBookingEmployeeId] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sahifa ochilganda va salon o'zgarganda xodimlarni yuklash
  useEffect(() => {
    if (user?.salon_id) {
      fetchEmployees(user.salon_id);
    } else {
      fetchEmployees();
    }
  }, [user?.salon_id]);

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
              <button className="employ-filter-add" onClick={() => setShowAddEmployeeModal(true)}>
                <img src="/images/+.png" alt="" />
                {t('employAddBtn')}
              </button>
            </>
          )}
        </div>
      </nav>
      
      <div className="employ-body">
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
                <button
                  onClick={() => openBookingForEmployee(item.id)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '10px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                  title={t('appointmentTypeBooking') || 'Band qilish'}
                >
                  <img src="/images/reserveIcon.png" alt="reserve" />
                </button>
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
            fetchEmployees();
          }}
        />
      )}
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