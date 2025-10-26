import { useState, useEffect, useRef } from 'react';
import '../styles/ChatStyles.css'
import i18next from 'i18next';
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
  fetchEmployeePosts,
  fetchEmployeeComments,
    t,
    uploadPhotosToServer,
    updateEmployee,
    setUser,
    updateEmployeeAvatar
  } = UseGlobalContext();

  const handleBack = () => {
    setSelectedUser(null);
    setIsMobileChatOpen(false);
  };

  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPageEmployee, setSelectedPageEmployee] = useState('chat');
  const chatBodyRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

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

  // Track which posts are expanded (read-more)
  const [expandedPosts, setExpandedPosts] = useState({});

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);

  // Post modal state
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const fileInputRef = useRef(null);

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

  // Fetch comments when viewing comments section for a post
  useEffect(() => {
    const loadComments = async () => {
      if (!user) return;
      setCommentsLoading(true);
      setCommentsError(null);
      try {
        const employeeIdToUse = user?.id || user?.employee_id;
        const data = await fetchEmployeeComments(employeeIdToUse, 1, 20);
        setComments(data.comments || []);
      } catch (e) {
        setCommentsError(e?.message || t('commentsLoadError') || 'Izohlarni olishda xatolik');
      } finally {
        setCommentsLoading(false);
      }
    };
    if (selectedPageEmployee === 'comments' && user) {
      loadComments();
    }
  }, [selectedPageEmployee, user]);

  const nextPostSlide = (postId, total) => {
    setPostSlideIndex(prev => {
      const current = prev[postId] || 0;
      const next = (current + 1) % Math.max(total, 1);
      return { ...prev, [postId]: next };
    });
  };

  const toggleExpand = (postId) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const getFontSizeByLength = (len) => {
    if (len < 100) return '1.05rem';
    if (len < 300) return '1rem';
    if (len < 600) return '0.95rem';
    return '0.9rem';
  };

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
    setIsMobileChatOpen(true);

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
      await fetchMessages(selectedUser.id);
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
    // On small screens behave like opening chat: show the content as overlay
    try {
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        setIsMobileChatOpen(true);
        // clear selectedUser when opening posts/comments as a separate panel
        setSelectedUser(null);
      }
    } catch (e) {
      // ignore in non-browser environments
    }
  };

  const handleMobileBack = () => {
    setIsMobileChatOpen(false);
    setSelectedUser(null);
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

  const handlePostAdded = async (newPost) => {
    setIsAddPostModalOpen(false);
    const employeeIdToUse = user?.id || user?.employee_id;
    const data = await fetchEmployeePosts(employeeIdToUse, 1, 10);
    const list = data?.data || data || [];
    setEmployeePosts(list);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

  return (
    <div>
      <div className={`chat-container ${isMobileChatOpen ? 'chat-open' : ''}`} style={user.role === 'private_admin' ? { flexDirection: "row-reverse" } : {}}>
        {isMobileChatOpen && (
          <button className="back-button" onClick={() => {
            setSelectedUser(null);
            setIsMobileChatOpen(false);
          }}>
            ←
          </button>
        )}
        <aside className="chatSidebar">
          <div className="chatSidebar-top">
            <img className="chatSidebarLogo" src="sidebarLogo.svg" alt="Logo" />

            <div className="avatar-logout-wrapper">
              <div className="avatar-wrapper">
                <img
                  src={user?.avatar || user?.profile_image || user?.avatar_url || user?.photo || "Avatar.svg"}
                  alt="User"
                  className="profile-avatar"
                />
                <button
                  className="avatar-edit-btn"
                  onClick={handleAvatarClick}
                  disabled={avatarUploading}
                  title={avatarUploading ? (t('uploading') || 'Yuklanmoqda...') : (t('changePhoto') || 'Rasmni almashtirish')}
                >
                  ✎
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {user.role !== 'private_admin' && (
                <button
                  className="logout-btn"
                  onClick={() => {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                    localStorage.removeItem('whiteBoxPos');
                    window.location.href = '/login';
                  }}
                >
                  <img src="/images/exit.png" alt="" className="logout-img" />
                </button>
              )}
            </div>
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
                <div className="loading-spinner" style={{
                  border: "3px solid #f3f3f3",
                  borderTop: "3px solid #9C2BFF",
                }}></div>
                <p style={{ color: "#A8A8B3" }}>
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
                  style={{ padding: '8px 14px', borderRadius: '8px', background: '#9C2BFF', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  {t('retry') || "Qayta urinib ko'rish"}
                </button>
              </div>
            ) : (
              <>
                <h3 className="chat-section-title">
                  {t('conversations') || 'Suhbatlar'} ({conversations.length})
                </h3>
                {conversations.map((conversation) => {
                  const participant = conversation.participant || {};
                  const userId = participant.id || conversation.other_user_id || conversation.userId;
                  const userName = participant.name || conversation.other_user_name || conversation.userName || 'Unknown User';
                  const userAvatar = participant.avatar_url || conversation.other_user_avatar || conversation.user_avatar_url || conversation.avatar || "ChatAvatar.svg";

                  if (!userId) {
                    console.warn('⚠️ Conversation without userId:', conversation);
                    return null;
                  }

                  return (
                    <div
                      key={userId}
                      className={`chat-item ${selectedUser?.id === userId ? 'selected' : ''}`}
                      onClick={() => handleSelectConversation(userId, userName, userAvatar)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="chat-avatar-wrapper">
                        {conversation.unread_count > 0 && <span className="unread-dot"></span>}
                      </div>
                      <div className="chat-info">
                        <span className="chat-info-logo">
                          <img
                            className="chat-avatar"
                            src={userAvatar}
                            alt={userName}
                          />
                          <p className="chat-name">{userName}</p>
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
                  );
                })}
              </>
            )}
          </div>
        </aside>

        {selectedPageEmployee === 'chat' ? (
          <main className="chat-window">
            {selectedUser ? (
              <>
                <div className="chat-header">
                  <button
                    className="mobile-back-button"
                    onClick={handleMobileBack}
                    style={{
                      display: 'none',
                      position: 'absolute',
                      left: '4vw',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '1vh',
                      zIndex: 10
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                  </button>

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
                      <div className="loading-spinner" style={{
                        border: "3px solid #f3f3f3",
                        borderTop: "3px solid #9C2BFF",
                      }}></div>
                      <p style={{ color: "#A8A8B3" }}>
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
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const year = date.getFullYear();
                            return `${day}.${month}.${year}`;
                          }
                        };

                        return Object.entries(groupedMessages)
                          .sort(([a], [b]) => new Date(a) - new Date(b))
                          .map(([dateKey, dayMessages]) => {
                            const sortedMessages = dayMessages.sort((a, b) =>
                              new Date(a.created_at) - new Date(b.created_at)
                            );

                            return (
                              <div key={dateKey}>
                                <div className="chat-date">{formatDate(dateKey)}</div>
                                {sortedMessages.map((message, index) => {
                                  const isMyMessage = message.sender_id === user.id || message.sender_type === 'employee';

                                  return (
                                    <div
                                      key={message.id || index}
                                      className={`message ${isMyMessage ? 'send' : 'receive'}`}
                                    >
                                      <div className={isMyMessage ? 'message-content-sent' : 'message-content'}>
                                        <p className={isMyMessage ? 'message-send-text' : 'message-receive-text'}>
                                          {message.message_text}
                                        </p>
                                        <span className={isMyMessage ? 'message-time-sent' : 'message-time'}>
                                          {new Date(message.created_at).toLocaleTimeString('uz-UZ', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          });
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
                  <div className="loading-spinner" style={{
                    border: "3px solid #f3f3f3",
                    borderTop: "3px solid #9C2BFF",
                  }}></div>
                  <p style={{ color: "#A8A8B3" }}>
                    {t('loading') || 'Jadval yuklanmoqda...'}
                  </p>
                </div>
              ) : schedulesError ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems:'center',
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
                    overflowY: 'auto'
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
                onClick={() => setIsAddPostModalOpen(true)}>
                <img src="/images/addPostImg.png" alt="" />
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
                  <div className="loading-spinner" style={{
                    border: "3px solid #f3f3f3",
                    borderTop: "3px solid #9C2BFF",
                  }}></div>
                  <p style={{ color: "#A8A8B3" }}>
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
                  color: '#A8A8B3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}>
                  <p style={{ fontSize: '1vw', marginTop: '1vw' }}>
                    {t('noPosts') || 'Postlar tez orada qo\'shiladi'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2vw', padding: '2vw' }}>
                  {employeePosts.map((post) => {
                    const files = post.media_files || [];
                    const currentIndex = postSlideIndex[post.id] || 0;
                    const currentFile = files[currentIndex];
                    const isVideo = typeof currentFile === 'string' && /\.(mp4|webm|ogg)$/i.test(currentFile);

                    return (
                      <div key={post.id} style={{
                        width: "100%",
                        backgroundColor: '#fff',
                        borderRadius: '1vw',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                        overflowY:"auto"
                      }}>
                        <div style={{ position: 'relative', width: "100%", height: "50vh" }}>
                          {files.length > 0 ? (
                            <div style={{ width: "100%", height: "100%" }}>
                              {isVideo ? (
                                <video
                                  src={currentFile}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  controls
                                />
                              ) : (
                                <img
                                  src={currentFile}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  alt={`Slide ${currentIndex + 1}`}
                                />
                              )}

                              {files.length > 1 && (
                                <div style={{
                                  position: "absolute",
                                  bottom: "20px",
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  display: "flex",
                                  gap: "8px",
                                  zIndex: 2
                                }}>
                                  {files.map((_, index) => (
                                    <button
                                      key={index}
                                      onClick={() => goToPostSlide(post.id, index)}
                                      style={{
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        backgroundColor: index === currentIndex ? "#fff" : "rgba(255,255,255,0.5)",
                                        border: "none",
                                        padding: 0,
                                        cursor: "pointer"
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{
                              width: "100%",
                              height: "100%",
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f7f7f7',
                              color: '#A8A8B3'
                            }}>
                              {t('noMediaFiles') || 'Media fayllar mavjud emas'}
                            </div>
                          )}
                        </div>

                        <div style={{ padding: '1vw' }}>
                          <h2 className="post-title">{post.title}</h2>
                          {
                            (() => {
                              const desc = post.description || post.text || '';
                              const len = (desc || '').length;
                              const isLong = len > 50;
                              const isExpanded = !!expandedPosts[post.id];
                              const displayText = isLong && !isExpanded ? desc.slice(0, 50) + '...' : desc;
                              const fontSize = getFontSizeByLength(len);

                              return (
                                <>
                                  <p className="post-description" style={{ fontSize, lineHeight: 1.5 }}>{displayText}</p>
                                  {isLong && (
                                    <button
                                      type="button"
                                      className="read-more-button"
                                      onClick={() => toggleExpand(post.id)}
                                    >
                                      {t('readMore') || (i18next.language === 'uz' ? 'davomi' : 'else')}
                                    </button>
                                  )}
                                </>
                              );
                            })()
                          }
                          <div className="post-date">
                            {post.created_at.split("T").at(0).split("-").reverse().join(".")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className='chat-comments'>
            <div className='comments employee-header' style={user.role === "private_admin" ? { left: "10vw", zIndex: "0" } : null}>
              <h1>{t('commentsCount') || 'Izohlar'}</h1>
            </div>
            <div style={{ 
              padding: '1vw',
              backgroundColor: '#fff',
              borderRadius: '1vw',
              marginTop: '1vw'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1vw',
                paddingBottom: '0.5vw',
                borderBottom: '1px solid #eee'
              }}>
                <h3 style={{
                  fontSize: '1.1vw',
                  fontWeight: '600',
                  color: '#333',
                  margin: 0
                }}>
                  {comments.length || '0'} {t('comments') || 'Комментарии'}
                </h3>
              </div>

              {commentsLoading ? (
                <div style={{ textAlign: 'center', padding: '2vw', color: '#A8A8B3' }}>
                  <p style={{ fontSize: '3vw', margin: 0 }}>{t('commentsLoading') || 'Izohlar yuklanmoqda...'}</p>
                </div>
              ) : commentsError ? (
                <div style={{ textAlign: 'center', padding: '2vw', color: '#FF6B6B' }}>
                  <p style={{ fontSize: '3vw', margin: 0 }}>{commentsError}</p>
                </div>
              ) : comments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1vw' }}>
                  {comments.map(comment => (
                    <div key={comment.id} style={{
                      display: 'flex',
                      gap: '1vw',
                      padding: '0.8vw',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '0.8vw'
                    }}>
                      <img
                        src={comment.user?.avatar || '/images/Avatar.svg'}
                        style={{
                          width: '3vw',
                          height: '3vw',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                        alt={comment.user?.name}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.4vw'
                        }}>
                          <span className="comment-author">{comment.user?.name}</span>
                          <span className="comment-date">{comment.created_at?.split("T").at(0).split("-").reverse().join(".")}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '0.2vw',
                          marginBottom: '0.4vw'
                        }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <img
                              key={i}
                              src={i < (comment.rating || 4) ? '/images/starFilled.svg' : '/images/starEmpty.svg'}
                              style={{ width: '1vw', height: '1vw' }}
                              alt="star"
                            />
                          ))}
                        </div>
                        <p className="comment-text">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2vw',
                  color: '#A8A8B3'
                }}>
                  <p style={{ fontSize: '1vw', margin: 0 }}>
                    {t('noComments') || 'Izohlar tez orada qo\'shiladi'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <EmployeeProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        user={user}
        handleChangeEmployeePage={handleChangeEmployeePage}
      />

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