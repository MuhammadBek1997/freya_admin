import React, { useState, useEffect } from 'react';
import { UseGlobalContext } from '../Context';
import EmployeeCard from '../components/EmployeeCard';
import EditEmployeeBar from '../components/EditEmployeeBar';
import AboutEmployeeBar from '../components/AboutEmployeeBar';
import EmployWaitingCard from '../components/EmployWaitingCard';
import AddEmployeeModal from '../components/AddEmployeeModal';

const Employees = () => {
  const { t, waitingEmp, setWaitingEmp, employees, handleAddWaitingEmp, handleRemoveWaitingEmp, isCheckedItem, setIsCheckedItem, fetchEmployees, employeesLoading } = UseGlobalContext();
  const [openCardId, setOpenCardId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState({ menu: null, cardId: null });
  const [showWait, setShowWait] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sahifa ochilganda xodimlarni yuklash
  useEffect(() => {
    fetchEmployees();
  }, []);

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

  // Filter working employees (not in waiting list)
  let workingEmployees = employees.filter(
    (employee) => !waitingEmp.some((emp) => emp.id === employee.id)
  );

  // Apply search filter
  const filteredWorkingEmployees = filterEmployees(workingEmployees);
  const filteredWaitingEmployees = filterEmployees(waitingEmp);

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
  const selectedEmployee = employees.find((item) => item.id === isMenuOpen.cardId);

  return (
    <section>
      <nav className="employ-nav">
        <div className="employ-nav-top">
          <div className="employ-nav-logo">
            <img src="/images/employIcon.png" alt="" />
            <h2>{t('employHT')}</h2>
          </div>
          <div className="employ-nav-summ">
            <h2>{employees.length}</h2>
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
                {t('employWait')} ({waitingEmp.length})
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
              <EmployeeCard
                key={item.id}
                {...item}
                isOpen={openCardId === item.id}
                handleToggleMenu={() => handleToggleMenu(item.id)}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                isCheckedItem={isCheckedItem}
                setIsCheckedItem={setIsCheckedItem}
                handleAddWaitingEmp={handleAddWaitingEmp}
              />
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
    </section>
  );
};

export default Employees;