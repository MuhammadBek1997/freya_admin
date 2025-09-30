import { useState, useEffect } from 'react';
import '../styles/ChatStyles.css'
import { UseGlobalContext } from '../Context';

const EmployeeChatPage = () => {
  const { 
    user, 
    loginEmployee,
    conversations,
    conversationsLoading,
    conversationsError,
    fetchConversations,
    currentConversation,
    setCurrentConversation,
    messages,
    messagesLoading,
    messagesError,
    fetchMessages,
    sendMessage,
    getUnreadCount
  } = UseGlobalContext();

  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);

  // Employee login qilganda user obyektini console'da ko'rsatish
  console.log('Employee user object:', user);

  // Component yuklanganda conversations va unread count ni olish
  useEffect(() => {
    if (user && user.role === 'employee') {
      fetchConversations();
      loadUnreadCount();
    }
  }, [user]);

  // Unread count ni olish
  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Conversation tanlash
  const handleSelectConversation = async (userId, userName) => {
    setSelectedUser({ id: userId, name: userName });
    await fetchMessages(userId);
  };

  // Xabar yuborish
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

  // Test funksiyalari
  const testEmployeeLogin1 = async () => {
    console.log('🧪 Testing employee1_1 login...');
    const result = await loginEmployee('employee1_1', 'password123');
    console.log('🧪 employee1_1 login result:', result);
  };

  const testEmployeeLogin2 = async () => {
    console.log('🧪 Testing employee123 login...');
    const result = await loginEmployee('employee123', 'password123');
    console.log('🧪 employee123 login result:', result);
  };

  // Global obyektga test funksiyalarini qo'shish
  if (typeof window !== 'undefined') {
    window.testEmployeeLogin1 = testEmployeeLogin1;
    window.testEmployeeLogin2 = testEmployeeLogin2;
    window.currentUser = user;
    window.conversations = conversations;
    window.messages = messages;
    console.log('🧪 Test functions added to window object:');
    console.log('🧪 - window.testEmployeeLogin1() - Test employee1_1/employee123');
    console.log('🧪 - window.testEmployeeLogin2() - Test employee123/employee123');
    console.log('🧪 - window.currentUser - Current user object');
    console.log('🧪 - window.conversations - Current conversations');
    console.log('🧪 - window.messages - Current messages');
  }

  // Agar employee login qilmagan bo'lsa
  if (!user || user.role !== 'employee') {
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
       <div className="chat-container">
      {/* LEFT SIDEBAR */}
      <aside className="chatSidebar">
        <div className="chatSidebar-top">
          <img className="chatSidebarLogo" src="sidebarLogo.svg" alt="Logo" />
          <img src="Avatar.svg" alt="User" className="profile-avatar" />
        </div>

        <div className="chat-profile-card">
          <span className="chat-profile-info">
            <h2 className="chat-profile-name">{user.name || user.username}</h2>
            <span className="chat-profile-role">Employee</span>
          </span>
          <button className="profile-btn">
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
                  key={conversation.id || index} 
                  className={`chat-item ${selectedUser?.id === conversation.user_id ? 'selected' : ''}`}
                  onClick={() => handleSelectConversation(conversation.user_id, conversation.user_name)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="chat-avatar-wrapper">
                    <img
                      className="chat-avatar"
                      src="chatIcon.svg"
                      alt=""
                    />
                    {conversation.unread_count > 0 && <span className="unread-dot"></span>}
                  </div>
                  <div className="chat-info">
                    <span className="chat-info-logo">
                      <img className="chat-info-logo-img" src="chatIcon.svg" alt="" />
                      <p className="chat-name">{conversation.user_name || `User ${conversation.user_id}`}</p>
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
      <main className="chat-window">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-partner-info">
                <div className="avatar-container">
                  <img
                    src="ChatAvatar.svg"
                    alt="Chat"
                    className="chat-header-avatar"
                  />
                </div>
                <div className="partner-details">
                  <span className="chat-header-name">{selectedUser.name}</span>
                  <span className="online-status-wrapper">
                    <span className="online-status"></span>
                    <span className="chat-header-status">в сети</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="chat-body">
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
                <>
                  <div className="chat-date">Bugun</div>
                  {messages.map((message, index) => (
                    <div 
                      key={message.id || index} 
                      className={`message ${message.sender_id === user.id ? 'sent' : 'received'}`}
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
                </>
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
    </div>
    </div>
  )
}

export default EmployeeChatPage