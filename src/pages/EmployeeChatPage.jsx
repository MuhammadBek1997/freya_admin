import '../styles/ChatStyles.css'

const EmployeeChatPage = () => {
  return (
    <div>
       <div className="chat-container">
      {/* LEFT SIDEBAR */}
      <aside className="chatSidebar">
        <div className="chatSidebar-top">
          <img className="chatSidebarLogo" src="sidebarLogo.svg" alt="Logo" />
          <img src="Avatar.svg" alt="User" className="profile-avatar" />
        </div>

        <div className="profile-card">
          <span className="profile-info">
            <h2 className="profile-name">Анастасия</h2>
            <span className="profile-role">Тренер</span>
          </span>
          <button className="profile-btn">
            <img className="profile-btn-icon" src="btnicon.svg" alt="" />
            <p>Мой профиль →</p>
          </button>
          <div className="stats">
            <div className="stat-item">
              <span className="stats-label">Чаты</span>
              <span className="stats-number">18</span>
            </div>
            <span>
              <img src="chatline.svg" alt="" />
            </span>
            <div className="stat-item">
              <span className="stats-label">Новые</span>
              <span className="stats-number">9</span>
            </div>
          </div>
        </div>

        <div className="chat-list">
          <h3 className="chat-section-title">Непрочитанные (3)</h3>

          <div className="chat-item unread">
            <div className="avatar-wrapper">
              <img
                className="chat-avatar"
                src="Непрочитонные_img1.svg"
                alt=""
              />
              <span className="unread-dot"></span>
            </div>
            <div className="chat-info">
              <span className="chat-info-logo">
                <img className="chat-info-logo-img" src="chatIcon.svg" alt="" />
                <p className="chat-name">Анастасия</p>
              </span>
              <p className="chat-msg">
                Может перенесем ещё на пол часа сегод...
              </p>
            </div>
            <div className="chat-header-info">
              <span className="chat-badge">3</span>
              <span className="chat-time">17:32</span>
            </div>
          </div>

          <div className="chat-item unread">
            <div className="avatar-wrapper">
              <img className="chat-avatar" src="chatIcon2.svg" alt="" />
              <span className="unread-dot"></span>
            </div>
            <div className="chat-info">
              <span className="chat-info-logo">
                <img className="chat-info-logo-img" src="chatIcon.svg" alt="" />
                <p className="chat-name">Алиса</p>
              </span>
              <p className="chat-msg">
                Добрый день я очень рада что вы оценили ...
              </p>
            </div>
            <div className="chat-header-info">
              <span className="chat-badge">1</span>
              <span className="chat-time">17:32</span>
            </div>
          </div>

          <div className="chat-item unread">
            <div className="avatar-wrapper">
              <img className="chat-avatar" src="chatIcon3.svg" alt="" />
              <span className="unread-dot"></span>
            </div>
            <div className="chat-info">
              <span className="chat-info-logo">
                <img className="chat-info-logo-img" src="chatIcon.svg" alt="" />
                <p className="chat-name">Наташа</p>
              </span>
              <p className="chat-msg">Ну как придешь в следующий раз?</p>
            </div>
            <div className="chat-header-info">
              <span className="chat-badge">4</span>
              <span className="chat-time">17:32</span>
            </div>
          </div>

          <h3 className="chat-section-title">Прочитанные (6)</h3>

          <div className="chat-item unread">
            <div className="avatar-wrapper">
              <img className="chat-avatar" src="Anastita.svg" alt="" />
              <span className="unread-dot"></span>
            </div>
            <div className="chat-info">
              <span className="chat-info-logo">
                <img className="chat-info-logo-img" src="chatIcon.svg" alt="" />
                <p className="chat-name">Анастасия</p>
              </span>
              <p className="chat-msg">
                Может перенесем ещё на пол часа сегод...
              </p>
            </div>
            <div className="chat-header-info">
              <span>
                <img src="galochka.svg" alt="" />
              </span>
              <span className="chat-time">17:32</span>
            </div>
          </div>

          <div className="chat-item unread">
            <div className="avatar-wrapper">
              <img className="chat-avatar" src="Alisa.svg" alt="" />
              <span className="unread-dot"></span>
            </div>
            <div className="chat-info">
              <span className="chat-info-logo">
                <img className="chat-info-logo-img" src="chatIcon.svg" alt="" />
                <p className="chat-name">Алиса</p>
              </span>
              <p className="chat-msg">
                Добрый день я очень рада что вы оценили ...
              </p>
            </div>
            <div className="chat-header-info">
              <span>
                <img src="galochka1.svg" alt="" />
              </span>
              <span className="chat-time">17:32</span>
            </div>
          </div>

          <div className="chat-item unread">
            <div className="avatar-wrapper">
              <img className="chat-avatar" src="natasha.svg" alt="" />
              <span className="unread-dot"></span>
            </div>
            <div className="chat-info">
              <span className="chat-info-logo">
                <img className="chat-info-logo-img" src="chatIcon.svg" alt="" />
                <p className="chat-name">Наташа</p>
              </span>
              <p className="chat-msg">Ну как придешь в следующий раз?</p>
            </div>
            <div className="chat-header-info">
              <span>
                <img src="galochka.svg" alt="" />
              </span>
              <span className="chat-time">17:32</span>
            </div>
          </div>
        </div>
      </aside>

      {/* CHAT WINDOW */}
      <main className="chat-window">
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
              <span className="chat-header-name">Алиса</span>
              <span className="online-status-wrapper">
                <span className="online-status"></span>
                <span className="chat-header-status">в сети</span>
              </span>
            </div>
          </div>
        </div>

        <div className="chat-body">
          <div className="chat-date">Сегодня</div>

          <div className="message received">
            <div className="message-content">
              <p className="message-receive-text">
                Классическое — 80 000 сум, с тушью — 95 000 сум. Экспресс — 65
                000 сум. Все материалы профессиональные, гипоаллергенные.
              </p>
              <span className="message-time">12:03</span>
            </div>
          </div>

          <div className="message sent">
            <div className="message-content-sent">
              <p className="message-send-text">
                Хорошо, хотела бы сделать с тушью. Когда можно записаться?
              </p>
              <span className="message-time-sent">12:04</span>
            </div>
          </div>

          <div className="message received">
            <div className="message-content">
              <p className="message-receive-text">
                Отлично! Сегодня свободны такие часы: 14:00, 15:30, 17:00.
                Завтра также есть места. Какой день удобен?
              </p>
              <span className="message-time">12:04</span>
            </div>
          </div>

          <div className="message sent">
            <div className="message-content-sent">
              <p className="message-send-text">
                На сегодня в 15:30 подойдет. Можно забронировать?
              </p>
              <span className="message-time-sent">12:04</span>
            </div>
          </div>
        </div>

        <div className="chat-input-container">
          <img className="message-pdf" src="pdff.svg" alt="" />
          <div className="chat-input">
            <input type="text" placeholder="Сообщение ..." />
          </div>
          <img className="send-button" src="telegram.svg" alt="" />
        </div>
      </main>
    </div>
    </div>
  )
}

export default EmployeeChatPage