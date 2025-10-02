// TEST COMMENTS
const testComments = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  author: `Foydalanuvchi ${i + 1}`,
  text: `Bu test comment matni ${i + 1}`,
  date: new Date(Date.now() - i * 86400000).toISOString(),
  rating: (Math.random() * 5).toFixed(1),
}));

// TEST POSTS
const testPosts = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `Test Post ${i + 1}`,
  content: `Bu test post matni ${i + 1}`,
  image: 'Avatar.svg',
  date: new Date(Date.now() - i * 43200000).toISOString(),
}));

// TEST SCHEDULES
const testSchedules = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  day: `2025-10-${(i + 1).toString().padStart(2, '0')}`,
  time: `${9 + (i % 8)}:00`,
  client: `Mijoz ${i + 1}`,
  service: `Xizmat turi ${i + 1}`,
  status: i % 2 === 0 ? 'active' : 'completed',
}));

// testSchedules ni sanasiga (day) ko'ra group qilish
let schedulesByDay = Object.values(
  testSchedules.reduce((acc, sched) => {
    if (!acc[sched.day]) acc[sched.day] = { day: sched.day, schedules: [] };
    acc[sched.day].schedules.push(sched);
    return acc;
  }, {})
);

import { useState, useEffect, useRef } from 'react';
import '../styles/ChatStyles.css'
// import { UseGlobalContext } from '../Context';
import EmployeeProfileModal from '../components/EmployeeProfileModal';

// TEST DATA (faqat test uchun, backend yo'q bo'lsa ishlatish mumkin)
const testUser = {
  id: 999,
  name: 'Test Employee',
  username: 'testemployee',
  role: 'employee',
};

const testConversations = [
  {
    other_user_id: 1,
    other_user_name: 'Ali',
    other_user_avatar: 'Avatar.svg',
    last_message: 'Salom, qanday yordam bera olaman?',
    last_message_time: new Date().toISOString(),
    unread_count: 2,
  },
  {
    other_user_id: 2,
    other_user_name: 'Vali',
    other_user_avatar: 'Avatar.svg',
    last_message: 'Rahmat!',
    last_message_time: new Date().toISOString(),
    unread_count: 0,
  },
];

const testMessages = [
  {
    id: 1,
    sender_id: 1,
    message_text: 'Salom!',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    sender_id: 999, // user.id bo'lsa, o'zingizga tegishli
    message_text: 'Salom, qanday yordam bera olaman?',
    created_at: new Date().toISOString(),
  },
  {
    id: 1,
    sender_id: 1,
    message_text: 'Salom!',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    sender_id: 999, // user.id bo'lsa, o'zingizga tegishli
    message_text: 'Salom, qanday yordam bera olaman?',
    created_at: new Date().toISOString(),
  },
  {
    id: 1,
    sender_id: 1,
    message_text: 'Salom!',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    sender_id: 999, // user.id bo'lsa, o'zingizga tegishli
    message_text: 'Salom, qanday yordam bera olaman?',
    created_at: new Date().toISOString(),
  },
  {
    id: 1,
    sender_id: 1,
    message_text: 'Salom!',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    sender_id: 999, // user.id bo'lsa, o'zingizga tegishli
    message_text: 'Salom, qanday yordam bera olaman?',
    created_at: new Date().toISOString(),
  },
  {
    id: 1,
    sender_id: 1,
    message_text: 'Salom!',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    sender_id: 999, // user.id bo'lsa, o'zingizga tegishli
    message_text: 'Salom, qanday yordam bera olaman?',
    created_at: new Date().toISOString(),
  },
  {
    id: 1,
    sender_id: 1,
    message_text: 'Salom!',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    sender_id: 999, // user.id bo'lsa, o'zingizga tegishli
    message_text: 'Salom, qanday yordam bera olaman?',
    created_at: new Date().toISOString(),
  },
  {
    id: 1,
    sender_id: 1,
    message_text: 'Salom!',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    sender_id: 999, // user.id bo'lsa, o'zingizga tegishli
    message_text: 'Salom, qanday yordam bera olaman?',
    created_at: new Date().toISOString(),
  },
  {
    id: 1,
    sender_id: 1,
    message_text: 'Salom!',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    sender_id: 999, // user.id bo'lsa, o'zingizga tegishli
    message_text: 'Salom, qanday yordam bera olaman?',
    created_at: new Date().toISOString(),
  },
];



const EmployeeChatPage = () => {
  // BACKEND bilan ishlovchi kodlar commentga olindi:
  // const { 
  //   loginEmployee,
  //   conversations,
  //   conversationsLoading,
  //   conversationsError,
  //   fetchConversations,
  //   currentConversation,
  //   setCurrentConversation,
  //   messages,
  //   messagesLoading,
  //   messagesError,
  //   fetchMessages,
  //   sendMessage,
  //   getUnreadCount,
  //   markConversationAsRead
  // } = UseGlobalContext();

  // TEST uchun state
  const [user] = useState(testUser);
  const [conversations, setConversations] = useState(testConversations);
  const [messages, setMessages] = useState(testMessages);
  const [conversationsLoading] = useState(false);
  const [conversationsError] = useState(null);
  const [messagesLoading] = useState(false);
  const [messagesError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(2);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPageEmployee, setSelectedPageEmployee] = useState('chat'); // 'comments', 'posts', 'schedule', 'chat'
  const chatBodyRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');





  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatBodyRef.current && messages.length > 0) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Conversation tanlash (test uchun local messages)
  const handleSelectConversation = (userId, userName, userAvatar) => {
    handleChangeEmployeePage('chat'); // Chat sahifasiga o'tish
    setSelectedUser({ id: userId, name: userName, avatar: userAvatar });
    // TEST: har doim testMessages ni ko'rsatamiz
    setMessages(testMessages);
    setUnreadCount(0);
  };

  // Xabar yuborish (test uchun local messages)
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    const newMsg = {
      id: messages.length + 1,
      sender_id: user.id,
      message_text: newMessage.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  // Profile modal ochish funksiyasi
  const handleOpenProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const handleChangeEmployeePage = (page) => {
    setSelectedPageEmployee(page);
    handleCloseProfileModal(); // Modalni yopish
  }


  /*
  // Conversation tanlash (BACKEND bilan ishlovchi kod)
  const handleSelectConversation = async (userId, userName, userAvatar) => {
    setSelectedUser({ id: userId, name: userName, avatar: userAvatar });
    await fetchMessages(userId);
    // Suhbatni tanlanganda barcha xabarlarni o'qilgan deb belgilash
    try {
      await markConversationAsRead(userId);
      // Unread count ni yangilash
      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };
  */

  /*
  // Xabar yuborish (BACKEND bilan ishlovchi kod)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    try {
      await sendMessage(selectedUser.id, newMessage.trim());
      setNewMessage('');
      // Unread count ni yangilash
      await loadUnreadCount();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Xabar yuborishda xatolik yuz berdi!');
    }
  };
  */

  /*
  // Profile modal ochish funksiyasi (BACKEND bilan ishlovchi kod)
  const handleOpenProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
  };
  */

  // Test funksiyalari
  const testEmployeeLogin1 = async () => {
    const result = await loginEmployee('employee1_1', 'password123');
  };

  const testEmployeeLogin2 = async () => {
    const result = await loginEmployee('employee123', 'password123');
  };

  // Global obyektga test funksiyalarini qo'shish
  if (typeof window !== 'undefined') {
    window.testEmployeeLogin1 = testEmployeeLogin1;
    window.testEmployeeLogin2 = testEmployeeLogin2;
    window.currentUser = user;
    window.conversations = conversations;
    window.messages = messages;
  }

  // Agar employee, private_admin yoki private_salon_admin login qilmagan bo'lsa
  if (!user || (user.role !== "private_admin" && user.role !== 'employee' && user.role !== "private_salon_admin")) {
    return (
      <div className="chat-container">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Employee Chat</h2>
          <p>Iltimos, employee sifatida login qiling.</p>
          <button onClick={testEmployeeLogin1} style={{ margin: '10px', padding: '10px 20px' }}>
            Test employee1_1 Login
          </button>
          <button onClick={testEmployeeLogin2} style={{ margin: '10px', padding: '10px 20px' }}>
            Test employee123 Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="chat-container" style={user.role === 'private_admin' ? { flexDirection: "row-reverse" } : {}}>
        {/* LEFT SIDEBAR */}
        <aside className="chatSidebar">
          <div className="chatSidebar-top">
            <img className="chatSidebarLogo" src="sidebarLogo.svg" alt="Logo" />
            <img src="Avatar.svg" alt="User" className="profile-avatar" />

            {
              user.role !== 'private_admin'
                ?
                <button style={{ marginLeft: "15%" }} onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('whiteBoxPos');
                  window.location.reload();
                }}
                >
                  <img src="/images/exit.png" alt="" style={{ width: "3vw" }} />
                </button>
                :
                null
            }
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
                <span className="chat-stats-number">{conversations.length}</span>
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
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Suhbatlar yuklanmoqda...</p>
              </div>
            ) : conversationsError ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                <p>Xatolik: {conversationsError}</p>
                <button onClick={fetchConversations} style={{ marginTop: '10px', padding: '5px 10px' }}>
                  Qayta urinish
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Hozircha suhbatlar yo'q</p>
              </div>
            ) : (
              <>
                <h3 className="chat-section-title">Suhbatlar ({conversations.length})</h3>
                {conversations.map((conversation, index) => (
                  <div
                    key={conversation.other_user_id || index}
                    className={`chat-item ${selectedUser?.id === conversation.other_user_id ? 'selected' : ''}`}
                    onClick={() => handleSelectConversation(conversation.other_user_id, conversation.other_user_name, conversation.other_user_avatar)}
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
                        <img className="chat-info-logo-img" src={conversation.other_user_avatar || "ChatAvatar.svg"} alt={conversation.other_user_name || "User"} />
                        <p className="chat-name">{conversation.other_user_name || `User ${conversation.other_user_id}`}</p>
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
                          }) :
                          ''
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>

        {/* CHAT WINDOW */}

        {
          selectedPageEmployee === 'chat'
            ?
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
                          <span className="chat-header-status">онлайн</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="chat-body" ref={chatBodyRef}>
                    {messagesLoading ? (
                      <div style={{ padding: '20px', textAlign: 'center' }}>
                        <p>Xabarlar yuklanmoqda...</p>
                      </div>
                    ) : messagesError ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                        <p>Xatolik: {messagesError}</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center' }}>
                        <p>Hozircha xabarlar yo'q</p>
                      </div>
                    ) : (
                      <div style={{ position: "relative" }}>
                        {(() => {
                          // Xabarlarni sanalar bo'yicha guruhlash
                          const groupedMessages = {};
                          messages.forEach(message => {
                            const messageDate = new Date(message.created_at);
                            const dateKey = messageDate.toDateString();
                            if (!groupedMessages[dateKey]) {
                              groupedMessages[dateKey] = [];
                            }
                            groupedMessages[dateKey].push(message);
                          });

                          // Sanalarni formatlash funksiyasi
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
                  color: '#666'
                }}>
                  <p>Suhbatni tanlang</p>
                </div>
              )}
            </main>
            :
            selectedPageEmployee === 'posts'
              ?
              <div className='chat-posts'>
                <div className='posts employee-header'>
                  <h1>
                    {testPosts.length} Posts
                  </h1>
                  <button className='add-post-button'>
                    + Yangi post
                  </button>
                </div>
                <div className='posts-body' style={{ overflowY: "auto" }}>
                  {
                    testPosts?.map((item, index) => {
                      return (
                        <div className='posts-list-item' key={index}>
                          <div className='posts-list-item-info'>
                            <p>
                              Bu yerda postning qisqacha mazmuni yoki tavsifi bo'lishi mumkin. Bu post haqida umumiy ma'lumot beradi va o'quvchini qiziqtiradi. Postning to'liq matni alohida sahifada ko'rsatiladi.
                            </p>
                            <span>12.10.2025</span>
                          </div>
                        </div>
                      )
                    })
                  }

                </div>
              </div>
              :
              selectedPageEmployee === 'schedule'
                ?
                <div className='chat-schedule'>
                  <div className='schedule-cont'>
                    <div className='schedule-header'>
                      <button className='schedule-back-button' onClick={() => handleChangeEmployeePage('chat')}>
                        <img src="/images/arrowLeft.png" alt="" />
                      </button>
                      <p>
                        Расписание
                      </p>
                    </div>
                    <div className='schedule-nav'>
                      {
                        testSchedules.map((item, index) => {
                          return (
                            <button
                              key={index}
                              className='schedule-nav-item'
                            >
                              {item.day.split('-').reverse().join('.')}
                            </button>
                          )
                        })
                      }
                    </div>
                    <div className='scheduleEmployee-body'>
                      {
                        testSchedules?.map((item, index) => {
                          return (
                            <div className='scheduleEmployee-list-item' key={index}>
                              <img src="" alt="" />
                              <p>
                                {item.day} - {item.time} - {item.client} - {item.service} - {item.status === 'active' ? 'Активный' : 'Завершённый'}
                              </p>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                </div>
                :
                <div className='chat-comments'>
                  <div className='comments employee-header'>
                    <h1>
                      {testComments.length} Comments
                    </h1>
                  </div>
                  <div className='comments-body'>
                    {
                      testComments?.map((item, index) => {
                        return (
                          <div className='comments-list-item' key={index}>
                            <div className='comments-list-item-info'>
                              <div className='comments-list-item-user'>
                                <img src="" alt="user-photo" />
                                <h2>
                                  Foydalanuvchi 1
                                </h2>
                              </div>

                              <p>
                                Bu yerda foydalanuvchining izohi yoki fikri bo'lishi mumkin. Foydalanuvchi o'z tajribasini yoki mulohazasini bu yerda qoldiradi.
                              </p>
                              <div className='comments-list-item-rating'>

                                
                                <div
                                  className="stars"
                                  style={{ '--rating': item.rating }}
                                  aria-label={`Rating: ${item.rating} out of 5 stars`}
                                >
                                </div>
                                <p>
                                  ({item.rating})
                                </p>
                                <span>12.10.2025</span>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      )}

                  </div>
                </div>
        }





      </div>

      {/* Profile Modal */}
      <EmployeeProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        user={user}
        handleChangeEmployeePage={handleChangeEmployeePage}

      />
    </div>
  )
}

export default EmployeeChatPage