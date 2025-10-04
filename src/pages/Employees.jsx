import React, { useState, useEffect } from 'react';
import { UseGlobalContext } from '../Context';
import EmployeeCard from '../components/EmployeeCard';
import EditEmployeeBar from '../components/EditEmployeeBar';
import AboutEmployeeBar from '../components/AboutEmployeeBar';
import EmployWaitingCard from '../components/EmployWaitingCard';
import AddEmployeeModal from '../components/AddEmployeeModal';

const Employees = () => {
  const { t, waitingEmp, setWaitingEmp, mastersArr, setMastersArr, handleAddWaitingEmp, handleRemoveWaitingEmp, isCheckedItem, setIsCheckedItem, fetchEmployees, employeesLoading } = UseGlobalContext();
  const [openCardId, setOpenCardId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState({ menu: null, cardId: null });
  const [showWait, setShowWait] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  
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


  // const selectedEmployees = mastersArr.filter(
  //     (employee) => ids.includes(employee.id) && !waitingEmp.some((emp) => emp.id === employee.id)
  //   );


  let workingEmployees = mastersArr.filter(
    (employee) => !waitingEmp.some((emp) => emp.id === employee.id)
  );

  // Close card menu and AboutEmployeeBar when clicking outside
  useEffect(() => {



    const handleOutsideClick = (event) => {
      // Check if click is outside the card menu, menu button, and sidebars
      if (
        !event.target.closest('.employCard-menu') &&
        !event.target.closest('.employCard-menuBtn')
      ) {
        setOpenCardId(null); // Close the card menu
      }
    };




    let timer;
    if (openCardId !== null) {
      timer = setTimeout(() => {
        setOpenCardId(null);
      }, 7000);
    }



    // Add click event listener to the document
    document.addEventListener('click', handleOutsideClick);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isMenuOpen]);


  // Find the selected employee based on isMenuOpen.cardId
  const selectedEmployee = mastersArr.find((item) => item.id === isMenuOpen.cardId);

  return (
    <section>
      <nav className="employ-nav">
        <div className="employ-nav-top">
          <div className="employ-nav-logo">
            <img src="/images/employIcon.png" alt="" />
            <h2>{t('employHT')}</h2>
          </div>
          <div className="employ-nav-summ">
            <h2>{mastersArr.length}</h2>
            <h5>{t('employSmry')}</h5>
          </div>
        </div>
        <div className="employ-nav-search">
          {
            showWait
              ?
              <button onClick={() => setShowWait(false)}
                className='employ-waiting-close'>
                <p>
                  <span>
                    ←
                  </span> Назад
                </p>
              </button>
              :
              null
          }
          <img src="/images/searchIcon.png" alt="" className='employ-nav-search-icon' />
          <input type="text" placeholder={t('homeSrchPlhdr')} />
          <button className="employ-filter-btn">
            <img src="/images/employFilterIcon.png" alt="" />
          </button>

          {
            showWait
              ?
              <>
                <button className='employ-waiting-returnEmp' onClick={() => handleRemoveWaitingEmp(isCheckedItem)}>
                  <img src="/images/returnEmployIcon.png" alt="" />
                  <p>
                    Вернуться в числа сотрудников
                  </p>
                </button>
              </>
              :
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
          }

        </div>
      </nav>
      <div className="employ-body">
        {employeesLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            {t('loading')}...
          </div>
        ) : showWait ? (
          waitingEmp.map((item)=>(
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
          workingEmployees.map((item) => (
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
        )}

        { }
      </div>
      <div className="employ-menuBar">
        {isMenuOpen.menu === 'edit' && <EditEmployeeBar employee={selectedEmployee} onClose={handleCloseSidebar} />}
        {isMenuOpen.menu === 'see' && <AboutEmployeeBar employee={selectedEmployee} onClose={handleCloseSidebar} />}
      </div>
      
      {/* Add Employee Modal */}
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