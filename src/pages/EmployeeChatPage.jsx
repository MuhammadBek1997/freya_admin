import { useState, useEffect, useRef } from 'react';
import '../styles/ChatStyles.css'
import { UseGlobalContext, getAuthToken } from '../Context';
import EmployeeProfileModal from '../components/EmployeeProfileModal';
import EmployeePostForm from '../components/EmployeePostForm';

const EmployeeChatPage = () => {
  const {
    user,
    conversations,
    conversationsLoading,
    conversationsError,
    fetchConversations,
    messages,
    messagesLoading,
    messagesError,
    fetchMessages,
    sendMessage,
    getUnreadCount,
    markConversationAsRead,
    createEmployeePost,
    fetchEmployeePosts,
    updateEmployeePost,
    deleteEmployeePost,
    updateEmployeeAvatar,
    t
  } = UseGlobalContext();

  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPageEmployee, setSelectedPageEmployee] = useState('chat');
  const chatBodyRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Schedule state
  const [groupedSchedules, setGroupedSchedules] = useState({});
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Posts state and carousel indices
  const [employeePosts, setEmployeePosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [postSlideIndex, setPostSlideIndex] = useState({});

  // ✅ Post modal state
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      if (!user) return;
      setPostsLoading(true);
      setPostsError(null);
      try {
        const employeeIdToUse = user?.id || user?.employee_id;
        const data = await fetchEmployeePosts(employeeIdToUse, 1, 10);
        const list = data?.data || data || [];
        setEmployeePosts(list);
      } catch (e) {
        setPostsError(e?.message || t('postsLoadError') || 'Postlarni olishda xatolik');
      } finally {
        setPostsLoading(false);
      }
    };

    if (selectedPageEmployee === 'posts' && user) {
      loadPosts();
    }
  }, [selectedPageEmployee, user]);

  const nextPostSlide = (postId, total) => {
    setPostSlideIndex(prev => {
      const current = prev[postId] || 0;
      const next = (current + 1) % Math.max(total, 1);
      return { ...prev, [postId]: next };
    });
  };

  console.log(user);


  const goToPostSlide = (postId, index) => {
    setPostSlideIndex(prev => ({ ...prev, [postId]: index }));
  };

  useEffect(() => {
    if (user && (user.role === 'employee' || user.role === 'private_admin' || user.role === 'private_salon_admin')) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    if (user && (user.role === 'employee' || user.role === 'private_admin' || user.role === 'private_salon_admin')) {
      loadUnreadCount();
    }
  }, [user, conversations]);

  useEffect(() => {
    if (chatBodyRef.current && messages.length > 0) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (selectedPageEmployee === 'schedule' && user) {
      fetchGroupedSchedules();
    }
  }, [selectedPageEmployee, user]);

  const fetchGroupedSchedules = async () => {
    setSchedulesLoading(true);
    setSchedulesError(null);

    try {
      const response = await fetch(
        'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api/schedules/grouped/by-date',
        {
          headers: {
            'Content-Type': 'application/json',
            ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
          }
        }
      );

      if (!response.ok) {
        throw new Error(t('scheduleLoadError') || 'Jadval yuklanmadi');
      }

      const data = await response.json();
      const schedulesData = data.data || data;
      let filteredSchedules = {};

      if (user.role === 'employee') {
        Object.keys(schedulesData).forEach(date => {
          const employeeSchedules = schedulesData[date].filter(
            schedule => schedule.employee_id === user.id
          );
          if (employeeSchedules.length > 0) {
            filteredSchedules[date] = employeeSchedules;
          }
        });
      } else {
        filteredSchedules = schedulesData;
      }

      setGroupedSchedules(filteredSchedules);

      const dates = Object.keys(filteredSchedules).sort();
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
      }

    } catch (error) {
      console.error('Error fetching grouped schedules:', error);
      setSchedulesError(error.message);
      setGroupedSchedules({});
    } finally {
      setSchedulesLoading(false);
    }
  };

  const getSchedulesForDate = () => {
    if (!selectedDate || !groupedSchedules[selectedDate]) return [];
    return groupedSchedules[selectedDate];
  };

  const getAvailableDates = () => {
    return Object.keys(groupedSchedules).sort();
  };

  const handleSelectConversation = async (userId, userName, userAvatar) => {
    handleChangeEmployeePage('chat');
    setSelectedUser({ id: userId, name: userName, avatar: userAvatar });

    try {
      await fetchMessages(userId);
      await markConversationAsRead(userId);
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      await sendMessage(selectedUser.id, newMessage.trim());
      setNewMessage('');

      // ✅ Xabarlar ro'yxatini darhol yangilash
      await fetchMessages(selectedUser.id);

      // ✅ Conversations ro'yxatini yangilash (oxirgi xabarni ko'rsatish uchun)
      await fetchConversations();

      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error sending message:', error);
      alert(t('messageSendError') || 'Xabar yuborishda xatolik yuz berdi!');
    }
  };

  const handleOpenProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const handleChangeEmployeePage = (page) => {
    setSelectedPageEmployee(page);
    handleCloseProfileModal();
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatDateWithDay = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('today') || 'Bugun';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('tomorrow') || 'Ertaga';
    } else {
      return date.toLocaleDateString('uz-UZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': t('statusPending') || 'Kutilmoqda',
      'confirmed': t('statusConfirmed') || 'Tasdiqlangan',
      'completed': t('statusCompleted') || 'Bajarilgan',
      'cancelled': t('statusCancelled') || 'Bekor qilingan'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#FF9800',
      'confirmed': '#4CAF50',
      'completed': '#2196F3',
      'cancelled': '#F44336'
    };
    return colorMap[status] || '#757575';
  };

  // ✅ Post qo'shilgandan keyin callback
  const handlePostAdded = async (newPost) => {
    setIsAddPostModalOpen(false);
    // Postlar ro'yxatini yangilash
    const employeeIdToUse = user?.id || user?.employee_id;
    const data = await fetchEmployeePosts(employeeIdToUse, 1, 10);
    const list = data?.data || data || [];
    setEmployeePosts(list);
  };

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const fileInputRef = useRef(null);

  // Avatar yuklash funksiyasi
  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const employeeId = user?.id || user?.employee_id;
      const newAvatarUrl = await updateEmployeeAvatar(employeeId, file);

      // Muvaffaqiyatli yuklandi
      console.log('✅ Avatar yangilandi:', newAvatarUrl);

      // Toast yoki notification ko'rsatish mumkin
      // alert(t('avatarUpdated') || 'Avatar muvaffaqiyatli yangilandi!');

    } catch (error) {
      console.error('Avatar yuklashda xatolik:', error);
      setAvatarError(error.message);
      alert(error.message);
    } finally {
      setAvatarUploading(false);
      // Input ni tozalash (bir xil faylni qayta yuklash mumkin bo'lishi uchun)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Avatar click handler
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };


  return (
    <div>
      <div className="chat-container" style={user.role === 'private_admin' ? { flexDirection: "row-reverse" } : {}}>
        <aside className="chatSidebar">
          <div className="chatSidebar-top">
            <img className="chatSidebarLogo" src="sidebarLogo.svg" alt="Logo" />

            {/* ✅ Avatar ni user state'dan olish */}
            <img
              src={user?.avatar || user?.profile_image || "Avatar.svg"}
              alt="User"
              className="profile-avatar"
            />

            {user.role !== 'private_admin' && (
              <button
                style={{ marginLeft: "15%" }}
                onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('userData');
                  localStorage.removeItem('whiteBoxPos');
                  window.location.href = '/login';
                }}
              >
                <img src="/images/exit.png" alt="" style={{ width: "3vw" }} />
              </button>
            )}
          </div>

          <div className="chat-profile-card">
            <span className="chat-profile-info">
              <h2 className="chat-profile-name">{user.name || user.username}</h2>
              <span className="chat-profile-role">{user?.role}</span>
            </span>
            <button className="profile-btn" onClick={handleOpenProfileModal}>
              <img className="profile-btn-icon" src="btnicon.svg" alt="" />
              <p>{t('myProfile') || 'Мой профиль'} →</p>
            </button>
            <div className="chat-stats">
              <div className="chat-stat-item">
                <span className="chat-stats-label">{t('chats') || 'Чаты'}</span>
                <span className="chat-stats-number">{conversations?.length || 0}</span>
              </div>
              <span>
                <img src="chatline.svg" alt="" />
              </span>
              <div className="chat-stat-item">
                <span className="chat-stats-label">{t('new') || 'Новые'}</span>
                <span className="chat-stats-number">{unreadCount}</span>
              </div>
            </div>
          </div>

          <div className="chat-list">
            {conversationsLoading ? (
              <div style={{
                width: "100%",
                padding: '20px',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                gap: '1vw'
              }}>
                <div style={{
                  width: "2vw",
                  height: "2vw",
                  border: "3px solid #f3f3f3",
                  borderTop: "3px solid #9C2BFF",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }}></div>
                <p style={{ color: "#A8A8B3", fontSize: "0.9vw" }}>
                  {t('conversationsLoading') || 'Suhbatlar yuklanmoqda...'}
                </p>
              </div>
            ) : conversationsError ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                alignItems: 'center'
              }}>
                <p style={{ color: '#A8A8B3', fontSize: '0.9vw' }}>
                  {t('noConversations') || 'Yozishmalar mavjud emas'}
                </p>
                <p style={{ color: '#FF6B6B', fontSize: '0.8vw' }}>
                  {conversationsError}
                </p>
                <button
                  onClick={() => fetchConversations()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#9C2BFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.8vw'
                  }}
                >
                  {t('retry') || 'Qayta urinish'}
                </button>
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                alignItems: 'center'
              }}>
                <p style={{ color: '#A8A8B3', fontSize: '1vw' }}>
                  {t('noConversations') || 'Yozishmalar mavjud emas'}
                </p>
              </div>
            ) : (
              <>
                <h3 className="chat-section-title">
                  {t('conversations') || 'Suhbatlar'} ({conversations.length})
                </h3>
                {conversations.map((conversation, index) => (
                  <div
                    key={conversation.other_user_id || index}
                    className={`chat-item ${selectedUser?.id === conversation.other_user_id ? 'selected' : ''}`}
                    onClick={() => handleSelectConversation(
                      conversation.other_user_id,
                      conversation.other_user_name,
                      conversation.other_user_avatar
                    )}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="chat-avatar-wrapper">
                      <img
                        className="chat-avatar"
                        src={conversation.other_user_avatar || "ChatAvatar.svg"}
                        alt={conversation.other_user_name || "User"}
                      />
                      {conversation.unread_count > 0 && <span className="unread-dot"></span>}
                    </div>
                    <div className="chat-info">
                      <span className="chat-info-logo">
                        <img
                          className="chat-info-logo-img"
                          src={conversation.other_user_avatar || "ChatAvatar.svg"}
                          alt={conversation.other_user_name || "User"}
                        />
                        <p className="chat-name">
                          {conversation.other_user_name || `User ${conversation.other_user_id}`}
                        </p>
                      </span>
                      <p className="chat-msg">
                        {conversation.last_message || t('noMessage') || 'Xabar yo\'q'}
                      </p>
                    </div>
                    <div className="chat-header-info">
                      {conversation.unread_count > 0 && (
                        <span className="chat-badge">{conversation.unread_count}</span>
                      )}
                      <span className="chat-time">
                        {conversation.last_message_time ?
                          new Date(conversation.last_message_time).toLocaleTimeString('uz-UZ', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : ''
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>

        {selectedPageEmployee === 'chat' ? (
          <main className="chat-window">
            {selectedUser ? (
              <>
                <div className="chat-header">
                  <div className="chat-partner-info">
                    <div className="avatar-container">
                      <img
                        src={selectedUser.avatar || "ChatAvatar.svg"}
                        alt={selectedUser.name || "User"}
                        className="chat-header-avatar"
                      />
                    </div>
                    <div className="partner-details">
                      <span className="chat-header-name">{selectedUser.name}</span>
                      <span className="online-status-wrapper">
                        <span className="online-status"></span>
                        <span className="chat-header-status">{t('online') || 'онлайн'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="chat-body" ref={chatBodyRef}>
                  {messagesLoading ? (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'column',
                      gap: '1vw',
                      minHeight: '50vh'
                    }}>
                      <div style={{
                        width: "2vw",
                        height: "2vw",
                        border: "3px solid #f3f3f3",
                        borderTop: "3px solid #9C2BFF",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }}></div>
                      <p style={{ color: "#A8A8B3", fontSize: "0.9vw" }}>
                        {t('messagesLoading') || 'Xabarlar yuklanmoqda...'}
                      </p>
                    </div>
                  ) : messagesError ? (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '15px',
                      alignItems: 'center',
                      minHeight: '50vh',
                      justifyContent: 'center'
                    }}>
                      <p style={{ color: '#A8A8B3', fontSize: '1vw' }}>
                        {t('messagesLoadError') || 'Xabarlar yuklanmadi'}
                      </p>
                      <p style={{ color: '#FF6B6B', fontSize: '0.8vw' }}>
                        {messagesError}
                      </p>
                    </div>
                  ) : !messages || messages.length === 0 ? (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '15px',
                      alignItems: 'center',
                      minHeight: '50vh',
                      justifyContent: 'center'
                    }}>
                      <p style={{ color: '#A8A8B3', fontSize: '1vw' }}>
                        {t('noMessages') || 'Hozircha xabarlar yo\'q'}
                      </p>
                      <p style={{ color: '#A8A8B3', fontSize: '0.8vw' }}>
                        {t('beFirstToMessage') || 'Birinchi bo\'lib xabar yozing'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      {(() => {
                        const groupedMessages = {};
                        messages.forEach(message => {
                          const messageDate = new Date(message.created_at);
                          const dateKey = messageDate.toDateString();
                          if (!groupedMessages[dateKey]) {
                            groupedMessages[dateKey] = [];
                          }
                          groupedMessages[dateKey].push(message);
                        });

                        const formatDate = (dateString) => {
                          const date = new Date(dateString);
                          const today = new Date();
                          const yesterday = new Date(today);
                          yesterday.setDate(yesterday.getDate() - 1);

                          if (date.toDateString() === today.toDateString()) {
                            return t('today') || 'Bugun';
                          } else if (date.toDateString() === yesterday.toDateString()) {
                            return t('yesterday') || 'Kecha';
                          } else {
                            return date.toLocaleDateString('uz-UZ', {
                              day: 'numeric',
                              month: 'long',
                              year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                            });
                          }
                        };

                        return Object.entries(groupedMessages)
                          .sort(([a], [b]) => new Date(a) - new Date(b))
                          .map(([dateKey, dayMessages]) => (
                            <div key={dateKey}>
                              <div className="chat-date">{formatDate(dateKey)}</div>
                              {dayMessages.map((message, index) => (
                                <div
                                  key={message.id || index}
                                  className={`message ${message.sender_id === user.id ? 'send' : 'receive'}`}
                                >
                                  <div className={message.sender_id === user.id ? 'message-content-sent' : 'message-content'}>
                                    <p className={message.sender_id === user.id ? 'message-send-text' : 'message-receive-text'}>
                                      {message.message_text}
                                    </p>
                                    <span className={message.sender_id === user.id ? 'message-time-sent' : 'message-time'}>
                                      {new Date(message.created_at).toLocaleTimeString('uz-UZ', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ));
                      })()}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="chat-input-container">
                  <img className="message-pdf" src="pdff.svg" alt="" />
                  <div className="chat-input">
                    <input
                      type="text"
                      placeholder={t('writeMessage') || 'Xabar yozing...'}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="send-button" style={{ background: 'none', border: 'none' }}>
                    <img src="telegram.svg" alt="Send" />
                  </button>
                </form>
              </>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: '15px'
              }}>
                <p style={{ color: '#A8A8B3', fontSize: '1vw' }}>
                  {t('selectConversation') || 'Suhbatni tanlang'}
                </p>
              </div>
            )}
          </main>
        ) : selectedPageEmployee === 'schedule' ? (
          <div className='chat-schedule'>
            <div className='schedule-cont'>
              <div className='schedule-header'>
                <button className='schedule-back-button' onClick={() => handleChangeEmployeePage('chat')}>
                  <img src="/images/arrowLeft.png" alt="" />
                </button>
                <p>{t('schedHT')}</p>
              </div>

              {schedulesLoading ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  gap: '1vw',
                  padding: '2vw'
                }}>
                  <div style={{
                    width: "2vw",
                    height: "2vw",
                    border: "3px solid #f3f3f3",
                    borderTop: "3px solid #9C2BFF",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></div>
                  <p style={{ color: "#A8A8B3", fontSize: "0.9vw" }}>
                    {t('loading') || 'Jadval yuklanmoqda...'}
                  </p>
                </div>
              ) : schedulesError ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1vw',
                  padding: '2vw'
                }}>
                  <p style={{ color: '#FF6B6B', fontSize: '0.9vw' }}>
                    {schedulesError}
                  </p>
                  <button
                    onClick={fetchGroupedSchedules}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#9C2BFF',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('retry') || 'Qayta urinish'}
                  </button>
                </div>
              ) : Object.keys(groupedSchedules).length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1vw',
                  padding: '2vw'
                }}>
                  <p style={{ color: '#A8A8B3', fontSize: '1vw' }}>
                    {t('noSchedules') || 'Jadval mavjud emas'}
                  </p>
                </div>
              ) : (
                <>
                  <div className='schedule-nav' style={{
                    display: 'flex',
                    gap: '0.5vw',
                    overflowX: 'auto',
                    padding: '1vw',
                    scrollbarWidth: 'thin'
                  }}>
                    {getAvailableDates().map((date, index) => (
                      <button
                        key={index}
                        className={`schedule-nav-item ${selectedDate === date ? 'active' : ''}`}
                        onClick={() => setSelectedDate(date)}
                        style={{
                          padding: '10px 16px',
                          border: selectedDate === date ? '2px solid #9C2BFF' : '1px solid #ddd',
                          backgroundColor: selectedDate === date ? '#f0e6ff' : 'white',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontSize: '0.85vw',
                          fontWeight: selectedDate === date ? 'bold' : 'normal',
                          transition: 'all 0.2s'
                        }}
                      >
                        {formatDisplayDate(date)}
                      </button>
                    ))}
                  </div>

                  <div className='scheduleEmployee-body' style={{
                    padding: '1vw',
                    overflowY: 'auto',
                    maxHeight: '60vh'
                  }}>
                    {selectedDate && (
                      <h3 style={{
                        fontSize: '1.2vw',
                        marginBottom: '1vw',
                        color: '#333'
                      }}>
                        {formatDateWithDay(selectedDate)}
                      </h3>
                    )}

                    {getSchedulesForDate().length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '2vw',
                        color: '#A8A8B3'
                      }}>
                        {t('noScheduleThisDay') || 'Bu kunda jadval yo\'q'}
                      </div>
                    ) : (
                      getSchedulesForDate().map((item, index) => (
                        <div
                          className='scheduleEmployee-list-item'
                          key={index}
                          style={{
                            padding: '1.2vw',
                            marginBottom: '0.8vw',
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5vw'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{
                              fontSize: '1.1vw',
                              fontWeight: 'bold',
                              color: '#333'
                            }}>
                              {formatTime(item.appointment_time || item.time)}
                            </span>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '0.75vw',
                              fontWeight: 'bold',
                              color: 'white',
                              backgroundColor: getStatusColor(item.status)
                            }}>
                              {getStatusText(item.status)}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.9vw', color: '#666' }}>
                            <div style={{ marginBottom: '0.3vw' }}>
                              <strong>{t('client') || 'Mijoz'}:</strong> {item.client_name || item.client || t('notAvailable') || 'Noma\'lum'}
                            </div>
                            <div style={{ marginBottom: '0.3vw' }}>
                              <strong>{t('service') || 'Xizmat'}:</strong> {item.service_name || item.service || t('notAvailable') || 'Noma\'lum'}
                            </div>
                            {item.employee_name && (
                              <div>
                                <strong>{t('employee') || 'Xodim'}:</strong> {item.employee_name}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : selectedPageEmployee === 'posts' ? (
          <div className='chat-posts'>
            <div className='posts employee-header' style={user.role === "private_admin" ? { left: "10vw", zIndex: "-10" } : null}>
              <h1>{t('postsCount') || 'Postlar'}</h1>

              <button
                className='add-post-button'
                onClick={() => setIsAddPostModalOpen(true)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#9C2BFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
              >
                <img src="/images/addPostImg.png" alt="" style={{ width: '20px', height: '20px' }} />
                {t('addPost') || 'Добавить пост'}
              </button>
            </div>
            <div className='posts-body'>
              {postsLoading ? (
                <div style={{
                  width: "100%",
                  padding: '20px',
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  gap: '1vw'
                }}>
                  <div style={{
                    width: "2vw",
                    height: "2vw",
                    border: "3px solid #f3f3f3",
                    borderTop: "3px solid #9C2BFF",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></div>
                  <p style={{ color: "#A8A8B3", fontSize: "0.9vw" }}>
                    {t('postsLoading') || 'Postlar yuklanmoqda...'}
                  </p>
                </div>
              ) : postsError ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                  alignItems: 'center'
                }}>
                  <p style={{ color: '#FF6B6B', fontSize: '0.9vw' }}>
                    {postsError}
                  </p>
                </div>
              ) : employeePosts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3vw',
                  color: '#A8A8B3'
                }}>
                  <p style={{ fontSize: '1vw', marginTop: '1vw' }}>
                    {t('noPosts') || 'Postlar tez orada qo\'shiladi'}
                  </p>
                </div>
              ) : (
                employeePosts.map((post) => {
                  const files = post.media_files || [];
                  const currentIndex = postSlideIndex[post.id] || 0;
                  const currentFile = files[currentIndex];
                  const isVideo = typeof currentFile === 'string' && /\.(mp4|webm|ogg)$/i.test(currentFile);

                  return (
                    <div key={post.id} style={{
                      width: "32vw",
                      marginBottom: '2vw',
                      backgroundColor: '#fff',
                      borderRadius: '1vw',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                      <div className="relative w-full" style={{ width: "30vw", padding: '1vw' }}>
                        <div className="relative overflow-hidden" style={{ width: "30vw", height: "50vh", borderRadius: "1vw" }}>
                          {files.length > 0 ? (
                            <div className="w-full h-full">
                              {isVideo ? (
                                <video
                                  src={currentFile}
                                  className="w-full h-full object-cover"
                                  style={{ borderRadius: '1vw' }}
                                  controls
                                />
                              ) : (
                                <img
                                  src={currentFile}
                                  className="w-full h-full object-cover"
                                  alt={`Slide ${currentIndex + 1}`}
                                  style={{ borderRadius: '1vw' }}
                                />
                              )}

                              {files.length > 1 && (
                                <button
                                  onClick={() => nextPostSlide(post.id, files.length)}
                                  className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all z-10"
                                >
                                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-full" style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f7f7f7',
                              borderRadius: '1vw',
                              color: '#A8A8B3'
                            }}>
                              {t('noMediaFiles') || 'Media fayllar mavjud emas'}
                            </div>
                          )}
                        </div>

                        {files.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {files.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => goToPostSlide(post.id, index)}
                                className={`w-3 h-3 rounded-full transition-all ${index === currentIndex
                                  ? 'bg-white'
                                  : 'bg-white/50 hover:bg-white/75'
                                  }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '1vw' }}>
                        <h2 style={{ fontSize: '1.2vw', margin: 0 }}>{post.title}</h2>
                        <p style={{ color: '#666', fontSize: '0.9vw', marginTop: '0.5vw' }}>{post.description}</p>
                        <div style={{ color: '#999', fontSize: '0.8vw', marginTop: '0.5vw' }}>
                          <span>{post.created_at.split("T").at(0).split("-").reverse().join(".")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className='chat-comments'>
            <div className='comments employee-header' style={user.role === "private_admin" ? { left: "10vw", zIndex: "0" } : null}>
              <h1>{t('commentsCount') || 'Izohlar'}</h1>
            </div>
            <div className='comments-body' style={{ padding: '1vw' }}>
              <div style={{
                textAlign: 'center',
                padding: '3vw',
                color: '#A8A8B3'
              }}>
                <p style={{ fontSize: '1vw' }}>
                  {t('noComments') || 'Izohlar tez orada qo\'shiladi'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Profile Modal */}
      <EmployeeProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        user={user}
        handleChangeEmployeePage={handleChangeEmployeePage}
      />

      {/* ✅ Post Form Modal */}
      {isAddPostModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <EmployeePostForm
              employeeId={user?.id || user?.employee_id}
              onClose={() => setIsAddPostModalOpen(false)}
              onPostAdded={handlePostAdded}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeChatPage;