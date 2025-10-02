import { useState } from 'react';
import '../styles/EmployeeProfileModal.css';
import { UseGlobalContext } from '../Context';

const EmployeeProfileModal = ({ isOpen, onClose, user, handleChangeEmployeePage }) => {

  const { t } = UseGlobalContext();
  const [changePhoto, setChangePhoto] = useState(false);

  if (!isOpen) return null;


  console.log('user in EmployeeProfileModal:', user);

  if (!changePhoto) {



    return (
      <div className="employee-profile-modal-overlay" style={{ background: "#38383866", backdropFilter: "blur(4px)" }}>
        <div className="employee-profile-modal" style={{ background: "#E9EDEE", borderRadius: "1vw"}}>
          <div className='employee-profile-modal-top' style={{ width:"100%",height:"10vh",display: "flex" , background: "#9C2BFF", borderTopLeftRadius:"1vw", borderTopRightRadius:"1vw"}}>
            {
              user.role == 'employee' &&
              <div style={{ display: "flex", alignItems: "center", gap: "1vw", padding: "1vw" }}>
                <img src="" alt="salonIcon" />
                <h2>
                  Glamface
                </h2>
              </div>
            }
            <button className="employee-profile-modal-close" onClick={onClose} style={{color: "white", background: "#9C2BFF", border: "none", fontSize: "1.5vw", fontWeight: "bold"}}>
              ×
            </button>
          </div>
          <div className='employee-profile-modal-content'>
            <div className='employee-profile-modal-header-top' style={{ display: 'flex', gap: "1vw", padding: "1vw" }}>
              <img src="/Avatar.svg" />
              <div>
                <div>
                  <h2>{user?.username}</h2>
                  <p className='chat-profile-role'>тренер</p>
                </div>
                <div
                  className="stars"
                  style={{ '--rating': user?.rating }}
                  aria-label={`Rating: ${user?.rating} out of 5 stars`}
                >
                </div>
                <p style={{ fontSize: "0.5vw" }}>
                  {user.rating} ({user?.length} {t('profileReviews')} )
                </p>
              </div>
            </div>
            <button className='employee-profile-modal-edit-button'>
              <img src="/images/change-foto.png" alt="" />
              Изменить фото
            </button>
          </div>
          <div className='employee-profile-modal-details'>
            <button className='employee-profile-modal-button' onClick={() => handleChangeEmployeePage('schedule')}>
              <img src="/images/edit-admin.png" alt="" />
              <p>
                Расписание (12)
              </p>
            </button>
            <button className='employee-profile-modal-button' onClick={() => handleChangeEmployeePage('comments')}>
              <img src="/images/chat-light.png" alt="" />
              <p>
                Комментарии (19)
              </p>
            </button>
            <button className='employee-profile-modal-button' onClick={() => handleChangeEmployeePage('posts')}>
              <img src="/images/posts.png" alt="" />
              <p>
                Посты (24)
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }
  else {
    return (
      <div>

      </div>
    )
  }

}
export default EmployeeProfileModal;
