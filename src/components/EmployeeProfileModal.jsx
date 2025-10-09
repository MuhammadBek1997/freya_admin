import { useState, useRef, useEffect } from 'react';
import '../styles/EmployeeProfileModal.css';
import { UseGlobalContext } from '../Context';

const EmployeeProfileModal = ({ isOpen, onClose, user, handleChangeEmployeePage }) => {
  const {
    t,
    updateEmployee,
    uploadPhotosToServer,
    setUser,
    fetchEmployeeComments,
    fetchEmployeePosts
  } = UseGlobalContext();

  const [commentsLoading, setCommentsLoading] = useState(false);
  const [employeeComments, setEmployeeComments] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [changePhoto, setChangePhoto] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const fileInputRef = useRef(null);

  

const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Fayl validatsiyasi
    if (!file.type?.startsWith('image/')) {
      alert('Faqat rasm fayllarini yuklash mumkin');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Rasm hajmi 5MB dan oshmasligi kerak');
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const employeeId = user?.id || user?.employee_id;
      
      // ✅ Faqat updateEmployeeAvatar chaqiriladi
      const avatarUrl = await updateEmployeeAvatar(employeeId, file);
      
      console.log('✅ Avatar muvaffaqiyatli yangilandi:', avatarUrl);

    } catch (error) {
      console.error('Avatar yuklashda xatolik:', error);
      setAvatarError(error.message);
      alert(error.message);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  // Comments va rating olish
  useEffect(() => {
    const loadEmployeeComments = async () => {
      if (!user) return;

      setCommentsLoading(true);
      try {
        const employeeId = user?.id || user?.employee_id;
        const data = await fetchEmployeeComments(employeeId, 1, 100);

        setEmployeeComments(data?.comments || []);
        setAvgRating(data?.avg_rating || 0);
      } catch (error) {
        console.error('Comments olishda xatolik:', error);
      } finally {
        setCommentsLoading(false);
      }
    };

    if (isOpen && user) {
      loadEmployeeComments();
    }
  }, [isOpen, user]);

  // EmployeeProfileModal.jsx da
  const [employeePosts, setEmployeePosts] = useState([]);

  useEffect(() => {
    const loadEmployeePosts = async () => {
      if (!user) return;
      try {
        const employeeId = user?.id || user?.employee_id;
        const data = await fetchEmployeePosts(employeeId, 1, 100);
        setEmployeePosts(data?.data || data || []);
      } catch (error) {
        console.error('Posts olishda xatolik:', error);
      }
    };

    if (isOpen && user) {
      loadEmployeePosts();
    }
  }, [isOpen, user]);


  if (!isOpen) return null;

  if (!changePhoto) {
    return (
      <div className="employee-profile-modal-overlay" style={{ background: "#38383866", backdropFilter: "blur(4px)" }}>
        <div className="employee-profile-modal" style={{ background: "#E9EDEE", borderRadius: "1vw" }}>
          <div className='employee-profile-modal-top' style={{ width: "100%", height: "10vh", display: "flex", background: "#9C2BFF", borderTopLeftRadius: "1vw", borderTopRightRadius: "1vw" }}>
            {user.role === 'employee' && (
              <div style={{ display: "flex", alignItems: "center", gap: "1vw", padding: "1vw" }}>
                <img src="" alt="salonIcon" />
                <h2>Glamface</h2>
              </div>
            )}
            <button
              className="employee-profile-modal-close"
              onClick={onClose}
              style={{
                color: "white",
                background: "#9C2BFF",
                border: "none",
                fontSize: "1.5vw",
                fontWeight: "bold"
              }}
            >
              ×
            </button>
          </div>

          <div className='employee-profile-modal-content'>
            <div className='employee-profile-modal-header-top' style={{ display: 'flex', gap: "1vw", padding: "1vw" }}>
              {/* ✅ Avatar bilan container */}
              <div style={{ position: 'relative' }}>
                <img
                  src={user?.avatar || user?.profile_image || user?.avatar_url || user?.photo || "/Avatar.svg"}
                  alt="avatar"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    opacity: avatarUploading ? 0.5 : 1,
                    transition: 'opacity 0.3s'
                  }}
                />

                {/* Loading indicator */}
                {avatarUploading && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '30px',
                    height: '30px',
                    border: '3px solid #f3f3f3',
                    borderTop: '3px solid #9C2BFF',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
              </div>

              <div>
                <div>
                  <h2>{user?.username}</h2>
                  <p className='chat-profile-role'>{t('trainer')}</p>
                </div>
                <div
                  className="stars"
                  style={{ '--rating': avgRating || user?.rating || 0 }}
                  aria-label={`Rating: ${avgRating || user?.rating || 0} out of 5 stars`}
                />
                <p style={{ fontSize: "0.5vw" }}>
                  {avgRating || user?.rating || 0} ({employeeComments?.length || 0} {t('profileReviews')})
                </p>
              </div>
            </div>

            {/* ✅ Avatar yangilash tugmasi */}
            <button
              className='employee-profile-modal-edit-button'
              onClick={handleAvatarClick}
              disabled={avatarUploading}
              style={{
                opacity: avatarUploading ? 0.6 : 1,
                cursor: avatarUploading ? 'not-allowed' : 'pointer'
              }}
            >
              <img src="/images/change-foto.png" alt="" />
              {avatarUploading ? t('uploading') || 'Yuklanmoqda...' : t('changePhoto')}
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </div>

          <div className='employee-profile-modal-details'>
            {user.role !== "private_admin" && (
              <button
                className='employee-profile-modal-button'
                onClick={() => handleChangeEmployeePage('schedule')}
              >
                <img src="/images/schedule-light.png" alt="" />
                <p>{t('scheduleTab')}</p>
              </button>
            )}

            <button
              className='employee-profile-modal-button'
              onClick={() => handleChangeEmployeePage('comments')}
            >
              <img src="/images/chat-light.png" alt="" />
              <p>{t('commentsCount') || 'Комментарии'} ({employeeComments?.length || 0})</p>
            </button>

            <button
              className='employee-profile-modal-button'
              onClick={() => handleChangeEmployeePage('posts')}
            >
              <img src="/images/posts.png" alt="" />
              <p>{t('postsCount') || 'Посты'} ({employeePosts?.length || 0})</p>
            </button>
          </div>
        </div>

        {/* ✅ CSS Animation */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <div />;
}

export default EmployeeProfileModal;