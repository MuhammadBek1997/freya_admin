import { useState, useEffect, useRef } from 'react';
import '../styles/ChatStyles.css'
import '../styles/AdminChatOverrides.css'
import i18next from 'i18next';
import { UseGlobalContext, getAuthToken } from '../Context';
import { scheduleGroupedUrl, mobileEmployeesMeSchedulesUrl } from '../apiUrls';
import AddScheduleModal from '../components/AddScheduleModal';
import BookScheduleModal from '../components/BookScheduleModal';
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
    setMessages,
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
    updateEmployeeAvatar,
    getEmployeeById,
    ts,
    addSched,
    setAddSched,
    wsStatus,
    connectChatWs,
    disconnectChatWs,
    sendWsMessage,
    sendWsMarkRead,
    waitWsOpenFor,
    appendLocalMessage,
  } = UseGlobalContext();

  const handleBack = () => {
    setSelectedUser(null);
    setIsMobileChatOpen(false);
  };

  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedPageEmployee, setSelectedPageEmployee] = useState('chat');
  const chatBodyRef = useRef(null);
  const profileRefreshIdRef = useRef(null);
  const conversationsUserIdRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const imageInputRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Schedule state
  const [groupedSchedules, setGroupedSchedules] = useState({});
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingState, setBookingState] = useState({ open: false, schedule: null, employeeId: null });

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
    if (!user || user.role !== 'employee') return;
    const eid = user?.employee_id || user?.id;
    if (!eid) return;

    const hasAvatar = !!(user?.avatar_url || user?.avatar || user?.profile_image || user?.photo);
    if (!hasAvatar && profileRefreshIdRef.current !== eid) {
      profileRefreshIdRef.current = eid;
      (async () => {
        try {
          const data = await getEmployeeById(eid);
          const emp = data?.data || data || {};
          const url = emp.avatar_url || emp.avatar || emp.profile_image || emp.photo || null;
          if (url && url !== (user?.avatar_url || user?.avatar || user?.profile_image || user?.photo || '')) {
            setUser(prev => ({ ...prev, avatar_url: url, avatar: url, profile_image: url }));
          }
        } catch (_) {}
      })();
    }

    if (conversationsUserIdRef.current !== eid) {
      fetchConversations();
      conversationsUserIdRef.current = eid;
    }
  }, [user?.employee_id, user?.id, user?.role]);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    if (user && user.role === 'employee') {
      loadUnreadCount();
    }
  }, [user, conversations]);

  useEffect(() => {
    return () => {
      try { disconnectChatWs(); } catch {}
    };
  }, []);

  useEffect(() => {
    // no global employee WS connection
  }, [user?.employee_id, user?.id, user?.role]);

  useEffect(() => {
    if (chatBodyRef.current && messages.length > 0) {
      requestAnimationFrame(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
          try { console.log('📜 Scrolled to bottom'); } catch {}
        }
      });
    }
  }, [messages]);

  useEffect(() => {
    if (selectedPageEmployee === 'schedule' && user) {
      fetchGroupedSchedules();
    }
  }, [selectedPageEmployee, user]);

  useEffect(() => {
    if (selectedPageEmployee === 'schedule' && user && !addSched) {
      fetchGroupedSchedules();
    }
  }, [addSched, selectedPageEmployee, user]);

  

  const fetchGroupedSchedules = async () => {
    setSchedulesLoading(true);
    setSchedulesError(null);

    try {
      const uid = String(user?.id || user?.employee_id || '');
      const qs = uid ? `?employee_id=${encodeURIComponent(uid)}` : '';
      const response = await fetch(
        `${scheduleGroupedUrl}${qs}`,
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
      const raw = data?.data ?? data;
      // Normalize: backend may return object keyed by date or array of schedules
      let normalized = {};
      if (Array.isArray(raw)) {
        // Array of schedules → group by schedule.date
        for (const item of raw) {
          const dateKey = String(item?.date || '').substring(0, 10);
          if (!dateKey) continue;
          if (!normalized[dateKey]) normalized[dateKey] = [];
          normalized[dateKey].push(item);
        }
      } else if (raw && typeof raw === 'object') {
        normalized = raw;
      } else {
        normalized = {};
      }

      let filteredSchedules = {};
      const onlyEmployee = user.role === 'employee';
      Object.keys(normalized).forEach(date => {
        const list = Array.isArray(normalized[date]) ? normalized[date] : [];
        const employeeSchedules = onlyEmployee
          ? list.filter(schedule => {
              const sEmpId = schedule?.employee_id;
              const sEmpList = Array.isArray(schedule?.employee_list)
                ? schedule.employee_list.map(id => String(id))
                : [];
              return (uid && String(sEmpId) === uid) || (uid && sEmpList.includes(uid));
            })
          : list;
        if (employeeSchedules.length > 0) {
          filteredSchedules[date] = employeeSchedules;
        }
      });

      // If employee and nothing found, fallback to mobile employee daily API for next 7 days
      if (user.role === 'employee' && Object.keys(filteredSchedules).length === 0) {
        const makeDate = (d) => {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        };
        const now = new Date();
        const headers = {
          'Content-Type': 'application/json',
          ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
        };
        const promises = Array.from({ length: 7 }).map((_, i) => {
          const day = new Date(now);
          day.setDate(now.getDate() + i);
          const dateStr = makeDate(day);
          return fetch(`${mobileEmployeesMeSchedulesUrl}/${dateStr}`, { headers })
            .then(resp => resp.ok ? resp.json() : null)
            .then(j => {
              const items = Array.isArray(j?.data) ? j.data : [];
              const converted = items.map(it => {
                const parts = String(it.time || '').split('-');
                const st = parts[0] || '';
                const en = parts[1] || '';
                return {
                  date: dateStr,
                  name: it.service_name || it.direction || it.title || 'Schedule',
                  employee_id: it.employee_id,
                  employee_name: it.employee_name,
                  start_time: st,
                  end_time: en,
                  is_private: it.is_private,
                };
              });
              return { dateStr, converted };
            })
            .catch(() => null);
        });
        const results = await Promise.allSettled(promises);
        results.forEach(r => {
          const val = r?.value;
          if (val && Array.isArray(val.converted) && val.converted.length > 0) {
            filteredSchedules[val.dateStr] = val.converted;
          }
        });
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
      console.log('📞 Opening conversation with user:', userId);
      
      // 1. WS ulanishni ochish
      const connected = connectChatWs(userId, 'user');
      
      if (connected) {
        // 2. WS ochilguncha kutish
        const wsOpened = await waitWsOpenFor(userId, 'user', 3000);
        
        if (wsOpened) {
          console.log('✅ WS opened, history will be loaded via WS');
          // ❌ fetchMessages ni CHAQIRMASLIK! WS history avtomatik keladi
          
          // 3. Mark as read
          const marked = sendWsMarkRead();
          if (!marked) {
            await markConversationAsRead(userId);
          }
        } else {
          // WS ochilmasa, fallback: REST API
          console.warn('⚠️ WS failed to open, falling back to REST API');
          await fetchMessages(userId);
          await markConversationAsRead(userId);
        }
      } else {
        // WS ulanish bo'lmasa, REST API
        console.warn('⚠️ WS connection failed, using REST API');
        await fetchMessages(userId);
        await markConversationAsRead(userId);
      }
      
      // 4. Unread count yangilash
      const count = await getUnreadCount();
      setUnreadCount(count);
      
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
      // Fallback: REST API
      try {
        await fetchMessages(userId);
      } catch (e) {
        console.error('❌ Failed to load messages:', e);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Input tozalash va tekshirish
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || trimmedMessage.length === 0) {
      console.warn('⚠️ Empty message, skipping');
      return;
    }
    
    if (!selectedUser || !selectedUser.id) {
      console.warn('⚠️ No selected user, skipping');
      return;
    }

    const messageText = trimmedMessage;
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Optimistic UI: darhol ko'rsatish
    const optimisticMessage = {
      id: tempId,
      sender_id: user?.id || user?.employee_id,
      sender_type: 'employee',
      receiver_id: selectedUser.id,
      receiver_type: 'user',
      message_text: messageText,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      _isOptimistic: true // Optimistic flag
    };

    try {
      // 1. Darhol UI ga qo'shish va input tozalash
      setMessages(prev => [...(Array.isArray(prev) ? prev : []), optimisticMessage]);
      setNewMessage(''); // Input tozalash
      
      console.log('📤 Sending message via WS...', { messageText, receiverId: selectedUser.id });
      
      // 2. WS ochilganligini ta'minlash
      const wsOpened = await waitWsOpenFor(selectedUser.id, 'user', 5000);
      
      if (!wsOpened) {
        console.error('❌ WS failed to open');
        setMessages(prev => prev.filter(m => m.id !== tempId));
        alert(t('messageSendError') || 'Xabar yuborishda xatolik: WebSocket ulanmadi!');
        return;
      }
      
      // 3. WS orqali yuborish (retry bilan)
      const sendWithRetry = async (retries = 3) => {
        for (let i = 0; i <= retries; i++) {
          const sent = sendWsMessage(messageText, 'text');
          if (sent) {
            console.log('✅ Message sent via WS');
            return true;
          }
          if (i < retries) {
            console.warn(`⚠️ WS send failed, retry ${i + 1}/${retries}`);
            await new Promise(r => setTimeout(r, 500));
          }
        }
        return false;
      };
      
      const sent = await sendWithRetry();
      
      if (!sent) {
        // Yuborilmasa optimistic xabarni o'chirish
        setMessages(prev => prev.filter(m => m.id !== tempId));
        throw new Error('WS send failed after retries');
      }
      
      // Backend echo xabar kelganda optimistic xabar o'rniga qo'yiladi
      // (Context.jsx dagi onmessage handler dublikatni tekshiradi)
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Optimistic xabarni o'chirish
      setMessages(prev => prev.filter(m => m.id !== tempId));
      
      alert(t('messageSendError') || 'Xabar yuborishda xatolik yuz berdi!');
    }
  };

  const handleAttachClick = () => {
    if (imageInputRef.current) imageInputRef.current.click();
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;
    try {
      if (!file.type?.startsWith('image/')) {
        alert(t('onlyImageFiles') || 'Faqat rasmlarni yuklash mumkin');
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(t('imageTooLarge') || 'Rasm juda katta (maks. 4 MB)');
        return;
      }
      const urls = await uploadPhotosToServer([file]);
      const url = Array.isArray(urls) ? urls[0] : urls;
      if (!url) throw new Error('Yuklangan rasm URLi topilmadi');
      await waitWsOpenFor(selectedUser.id, 'user', 3000);
      
      const tempId = `temp-img-${Date.now()}-${Math.random()}`;
      const optimisticImage = {
        id: tempId,
        sender_id: user?.id || user?.employee_id,
        sender_type: 'employee',
        receiver_id: selectedUser.id,
        receiver_type: 'user',
        message_text: '',
        message_type: 'image',
        file_url: url,
        is_read: false,
        created_at: new Date().toISOString(),
        _isOptimistic: true
      };
      
      // Optimistic UI: darhol ko'rsatish
      setMessages(prev => [...(Array.isArray(prev) ? prev : []), optimisticImage]);
      
      const sendImageWithRetry = async () => {
        const ok1 = sendWsMessage('', 'image', url);
        if (ok1) return true;
        await new Promise(r => setTimeout(r, 200));
        const ok2 = sendWsMessage('', 'image', url);
        return ok2;
      };
      const sent = await sendImageWithRetry();
      if (!sent) {
        // Yuborilmasa optimistic xabarni o'chirish
        setMessages(prev => prev.filter(m => m.id !== tempId));
        throw new Error('WS image send failed');
      }
      // Backend echo kelganda optimistic xabar almashtiriladi
    } catch (err) {
      console.error('Error sending image:', err);
      alert(t('messageSendError') || 'Xabar yuborishda xatolik yuz berdi!');
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
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
    try { disconnectChatWs(); } catch {}
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}`;
  };

  const formatDateWithDay = (dateString) => {
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const weekday = date.toLocaleDateString(i18next.language || 'ru-RU', { weekday: 'short' });
    return `${dd}-${mm}, ${weekday}`;
  };

  const formatWeekdayShort = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(i18next.language || 'ru-RU', { weekday: 'short' });
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

  // Admin UI enabled: private_admin/private_salon_admin can use chat now

  return (
    <div>
      <div className={`chat-container ${isMobileChatOpen ? 'chat-open' : ''} ${(user?.role === 'private_admin' || user?.role === 'private_salon_admin') ? 'admin-layout' : ''}`}>
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
                  src={user?.avatar_url || user?.avatar || user?.profile_image || user?.photo || '/images/masterImage.png'}
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
                  {messagesError ? (
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
                      {messagesLoading && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div className="loading-spinner" style={{
                            width: '16px',
                            height: '16px',
                            border: "3px solid #f3f3f3",
                            borderTop: "3px solid #9C2BFF",
                            borderRadius: '50%'
                          }}></div>
                          <span style={{ color: "#A8A8B3", fontSize: '12px' }}>{t('loading') || 'Yuklanmoqda...'}</span>
                        </div>
                      )}
                      {(() => {
                        const groupedMessages = {};
                        const uid = selectedUser?.id;
                        const visibleMessages = Array.isArray(messages)
                          ? messages.filter(m => !uid || String(m.sender_id) === String(uid) || String(m.receiver_id) === String(uid))
                          : [];
                        visibleMessages.forEach(message => {
                          const messageDate = new Date(message.created_at_local || message.created_at);
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
                              new Date(a.created_at_local || a.created_at) - new Date(b.created_at_local || b.created_at)
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
                                        {message.message_type === 'image' && message.file_url ? (
                                          <img
                                            src={message.file_url}
                                            alt="image"
                                            style={{ maxWidth: '180px', borderRadius: '8px' }}
                                          />
                                        ) : (
                                          <p className={isMyMessage ? 'message-send-text' : 'message-receive-text'}>
                                            {message.message_text || message.message}
                                          </p>
                                        )}
                                          <span className={isMyMessage ? 'message-time-sent' : 'message-time'}>
                                          {new Date(message.created_at_local || message.created_at).toLocaleTimeString('uz-UZ', {
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
                  <button type="button" className="attach-button" onClick={handleAttachClick} style={{ background: 'none', border: 'none' }}>
                    <img className="message-pdf" src="pdff.svg" alt="" />
                  </button>
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelected} style={{ display: 'none' }} />
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
                <button
                  onClick={() => setAddSched(true)}
                  style={{
                    marginLeft: 'auto',
                    padding: '8px 12px',
                    backgroundColor: '#9C2BFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {t('schedule.add') || 'Добавить'}
                </button>
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
                          border: selectedDate === date ? '2px solid #9C2BFF' : '1px solid #ddd',
                          backgroundColor: selectedDate === date ? '#f7f0ff' : 'white',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column-reverse',
                          alignItems: 'center',
                          padding:"1.5vw"
                        }}
                      >
                        <span style={{  color: '#A8A8B3' }}>{formatWeekdayShort(date)}</span>
                        <span style={{ fontWeight: selectedDate === date ? 'bold' : 'normal' }}>{formatDisplayDate(date)}</span>
                      </button>
                    ))}
                  </div>

                  <div className='scheduleEmployee-body' style={{
                    padding: '1vw',
                    overflowY: 'auto'
                  }}>
                    {selectedDate && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '1vw'
                      }}>
                        <span style={{
                          padding: '6px 10px',
                          backgroundColor: '#FFF',
                          border: '1px solid #eee',
                          borderRadius: '12px',
                          color: '#333'
                        }}>
                          {formatDateWithDay(selectedDate)}
                        </span>
                      </div>
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
                            position:"relative"
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}>
                            <span style={{
                              fontWeight: 'bold',
                              color: '#333'
                            }}>
                              {item.title || item.name || item.service_name || t('notAvailable') || 'Noma\'lum'}
                            </span>
                            <span style={{
                              borderRadius: '12px',
                              fontWeight: 'bold',
                              color: '#9C2BFF',
                              backgroundColor: '#F3E8FF'
                            }}>
                              {item.start_time && item.end_time ? `${item.start_time} - ${item.end_time}` : (formatTime(item.appointment_time || item.time) || '')}
                            </span>
                            <button
                              onClick={() => setBookingState({ open: true, schedule: item, employeeId: (Array.isArray(item.employee_list) && item.employee_list.length === 1) ? item.employee_list[0] : null })}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                position:"absolute",
                                top:"3vw",
                                right:"3vw"
                              }}
                              title={t('appointmentTypeBooking') || 'Band qilish'}
                            >
                              <img src="/images/reserveIcon.png" alt="reserve" />
                            </button>
                          </div>

                          <div style={{  color: '#666' }}>
                            <div style={{ marginBottom: '0.3vw' }}>
                              <strong>{t('service') || 'Xizmat'}:</strong> {item.service_name || item.name || t('notAvailable') || 'Noma\'lum'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            {addSched ? <AddScheduleModal /> : null}
            {bookingState?.open && bookingState?.schedule ? (
              <BookScheduleModal
                {...bookingState.schedule}
                employee_list={bookingState.employeeId ? [bookingState.employeeId] : (bookingState.schedule.employee_list || [])}
                setEditModal={(v) => {
                  if (!v) setBookingState({ open: false, schedule: null, employeeId: null })
                }}
              />
            ) : null}
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
            <div className='comments-container'>
              <div className='comments-header'>
                <h3 className='comments-title'>
                  {comments.length || '0'} {t('comments') || 'Комментарии'}
                </h3>
              </div>

              {commentsLoading ? (
                <div className='comments-loading'>
                  <p className='comments-loading-text'>{t('commentsLoading') || 'Izohlar yuklanmoqda...'}</p>
                </div>
              ) : commentsError ? (
                <div className='comments-error'>
                  <p className='comments-error-text'>{commentsError}</p>
                </div>
              ) : comments.length > 0 ? (
                <div className='comments-list'>
                  {comments.map(comment => (
                    <div key={comment.id} className='comment-item'>
                      <img
                        src={comment.user?.avatar || '/images/Avatar.svg'}
                        className='comment-avatar'
                        alt={comment.user?.name}
                      />
                      <div className='comment-content'>
                        <div className='comment-top'>
                          <span className="comment-author">{comment.user?.name}</span>
                          <span className="comment-date">{comment.created_at?.split("T").at(0).split("-").reverse().join(".")}</span>
                        </div>
                        <div className='comment-stars'>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <img
                              key={i}
                              src={i < (comment.rating || 4) ? '/images/starFilled.svg' : '/images/starEmpty.svg'}
                              className='comment-star'
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
                <div className='comments-empty'>
                  <p className='comments-empty-text'>
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
