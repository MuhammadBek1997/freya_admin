import { useState, useEffect, useRef } from 'react';
import '../styles/ChatStyles.css'
import { UseGlobalContext, getHeaders } from '../Context';
import EmployeeProfileModal from '../components/EmployeeProfileModal';

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
    deleteEmployeePost
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
  const [postSlideIndex, setPostSlideIndex] = useState({}); // { [postId]: currentIndex }

  // Load posts when switching to Posts tab
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
        setPostsError(e?.message || 'Postlarni olishda xatolik');
      } finally {
        setPostsLoading(false);
      }
    };

    if (selectedPageEmployee === 'posts' && user) {
      loadPosts();
    }
  }, [selectedPageEmployee, user]);

  // Carousel helpers per post
  const nextPostSlide = (postId, total) => {
    setPostSlideIndex(prev => {
      const current = prev[postId] || 0;
      const next = (current + 1) % Math.max(total, 1);
      return { ...prev, [postId]: next };
    });
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

  // Fetch grouped schedules when page changes to schedule
  useEffect(() => {
    if (selectedPageEmployee === 'schedule' && user) {
      fetchGroupedSchedules();
    }
  }, [selectedPageEmployee, user]);

  // Fetch grouped schedules from /api/schedules/grouped/by-date
  const fetchGroupedSchedules = async () => {
    setSchedulesLoading(true);
    setSchedulesError(null);

    try {
      const response = await fetch(
        'https://freya-salon-backend-cc373ce6622a.herokuapp.com/api/schedules/grouped/by-date',
        {
          headers: getHeaders(true)
        }
      );

      if (!response.ok) {
        throw new Error('Jadval yuklanmadi');
      }

      const data = await response.json();
      console.log('Grouped schedules response:', data);

      // Data struktura: { "2025-10-05": [...schedules], "2025-10-06": [...schedules] }
      const schedulesData = data.data || data;

      // Employee role bo'lsa, faqat o'z schedule'larini filter qilamiz
      let filteredSchedules = {};

      if (user.role === 'employee') {
        // Employee faqat o'z appointment'larini ko'radi
        Object.keys(schedulesData).forEach(date => {
          const employeeSchedules = schedulesData[date].filter(
            schedule => schedule.employee_id === user.id
          );
          if (employeeSchedules.length > 0) {
            filteredSchedules[date] = employeeSchedules;
          }
        });
      } else {
        // Admin yoki private_admin barcha schedule'larni ko'radi (salon filter backend'da)
        filteredSchedules = schedulesData;
      }

      setGroupedSchedules(filteredSchedules);

      // Birinchi sanani tanlash
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

  // Get schedules for selected date
  const getSchedulesForDate = () => {
    if (!selectedDate || !groupedSchedules[selectedDate]) return [];
    return groupedSchedules[selectedDate];
  };

  // Get available dates
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

      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Xabar yuborishda xatolik yuz berdi!');
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

  // Format date for display (DD.MM)
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Format date with day name
  const formatDateWithDay = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Bugun';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Ertaga';
    } else {
      return date.toLocaleDateString('uz-UZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
  };

  // Format time
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


  // 1. Post yaratish
const handleCreatePost = async () => {
    try {
        const newPost = await createEmployeePost('employee-uuid-here', {
            title: 'Yangi post',
            content: 'Post matni',
            image_url: 'https://example.com/image.jpg' // ixtiyoriy
        });
        console.log('Post yaratildi:', newPost);
    } catch (error) {
        console.error('Xato:', error.message);
    }
};


// 2. Postlarni olish
const handleFetchPosts = async () => {
    try {
        const posts = await fetchEmployeePosts('employee-uuid-here', 1, 10);
        console.log('Postlar:', posts);
    } catch (error) {
        console.error('Xato:', error.message);
    }
};


// 3. Post yangilash
const handleUpdatePost = async () => {
    try {
        const updated = await updateEmployeePost(
            'employee-uuid-here',
            'post-uuid-here',
            {
                title: 'Yangilangan sarlavha',
                content: 'Yangilangan matn'
            }
        );
        console.log('Post yangilandi:', updated);
    } catch (error) {
        console.error('Xato:', error.message);
    }
};


// 4. Post o'chirish
const handleDeletePost = async () => {
    try {
        await deleteEmployeePost('employee-uuid-here', 'post-uuid-here');
        console.log('Post o\'chirildi');
    } catch (error) {
        console.error('Xato:', error.message);
    }
};


  // Status text
  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Kutilmoqda',
      'confirmed': 'Tasdiqlangan',
      'completed': 'Bajarilgan',
      'cancelled': 'Bekor qilingan'
    };
    return statusMap[status] || status;
  };



  // Status color
  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#FF9800',
      'confirmed': '#4CAF50',
      'completed': '#2196F3',
      'cancelled': '#F44336'
    };
    return colorMap[status] || '#757575';
  };






  return (
    <div>
      <div className="chat-container" style={user.role === 'private_admin' ? { flexDirection: "row-reverse" } : {}}>
        {/* LEFT SIDEBAR */}
        <aside className="chatSidebar">
          <div className="chatSidebar-top">
            <img className="chatSidebarLogo" src="sidebarLogo.svg" alt="Logo" />
            <img src="Avatar.svg" alt="User" className="profile-avatar" />

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
              <span className="chat-profile-role">Employee</span>
            </span>
            <button className="profile-btn" onClick={handleOpenProfileModal}>
              <img className="profile-btn-icon" src="btnicon.svg" alt="" />
              <p>Мой профиль →</p>
            </button>
            <div className="chat-stats">
              <div className="chat-stat-item">
                <span className="chat-stats-label">Чаты</span>
                <span className="chat-stats-number">{conversations?.length || 0}</span>
              </div>
              <span>
                <img src="chatline.svg" alt="" />
              </span>
              <div className="chat-stat-item">
                <span className="chat-stats-label">Новые</span>
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
                  Suhbatlar yuklanmoqda...
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
                  Yozishmalar mavjud emas
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
                  Qayta urinish
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
                  Yozishmalar mavjud emas
                </p>
              </div>
            ) : (
              <>
                <h3 className="chat-section-title">Suhbatlar ({conversations.length})</h3>
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
                        {conversation.last_message || 'Xabar yo\'q'}
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

        {/* MAIN CONTENT AREA */}
        {selectedPageEmployee === 'chat' ? (
          <main className="chat-window" >
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
                        <span className="chat-header-status">онлайн</span>
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
                        Xabarlar yuklanmoqda...
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
                        Xabarlar yuklanmadi
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
                        Hozircha xabarlar yo'q
                      </p>
                      <p style={{ color: '#A8A8B3', fontSize: '0.8vw' }}>
                        Birinchi bo'lib xabar yozing
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
                            return 'Bugun';
                          } else if (date.toDateString() === yesterday.toDateString()) {
                            return 'Kecha';
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
                      placeholder="Xabar yozing..."
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
                  Suhbatni tanlang
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
                <p>Расписание</p>
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
                    Jadval yuklanmoqda...
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
                    Qayta urinish
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
                    Jadval mavjud emas
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
                        Bu kunda jadval yo'q
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
                              <strong>Mijoz:</strong> {item.client_name || item.client || 'Noma\'lum'}
                            </div>
                            <div style={{ marginBottom: '0.3vw' }}>
                              <strong>Xizmat:</strong> {item.service_name || item.service || 'Noma\'lum'}
                            </div>
                            {item.employee_name && (
                              <div>
                                <strong>Xodim:</strong> {item.employee_name}
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
            <div className='posts employee-header' style={user.role == "private_admin" ? {left:"10vw" , zIndex:"-10"}:null}>
              <h1>Postlar</h1>
              <button className='add-post-button'>
                <img src="/images/addPostImg.png" alt="" />
                Добавить пост
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
                    Postlar yuklanmoqda...
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
                    Postlar tez orada qo'shiladi
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
                      width:"32vw",
                      marginBottom: '2vw',
                      backgroundColor: '#fff',
                      borderRadius: '1vw',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'

                    }}>

                      <div className="relative w-full" style={{width:"30vw", padding: '1vw' }}>
                        <div className="relative overflow-hidden" style={{width:"30vw", height: "50vh", borderRadius: "1vw" }}>
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
                              Media fayllar mavjud emas
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
                          <span>{new Date(post.created_at).toLocaleString('uz-UZ')}</span>
                          {post.employee_name && (
                            <span> · {post.employee_name} {post.employee_surname || ''}</span>
                          )}
                          {post.employee_profession && (
                            <span> · {post.employee_profession}</span>
                          )}
                          {post.salon_name && (
                            <span> · {post.salon_name}</span>
                          )}
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
            <div className='comments employee-header' style={user.role == "private_admin" ? {left:"10vw" , zIndex:"0"}:null}>
              <h1>Izohlar</h1>
            </div>
            <div className='comments-body' style={{ padding: '1vw' }}>
              <div style={{
                textAlign: 'center',
                padding: '3vw',
                color: '#A8A8B3'
              }}>
                <p style={{ fontSize: '1vw' }}>
                  Izohlar tez orada qo'shiladi
                </p>
              </div>
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
    </div>

  );
};
export default EmployeeChatPage;