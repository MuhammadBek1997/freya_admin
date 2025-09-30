import React from 'react';
import '../styles/EmployeeProfileModal.css';

const EmployeeProfileModal = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  return (
    <div className="employee-profile-modal-overlay">
      <div className="employee-profile-modal">
        <button className="employee-profile-modal-close" onClick={onClose}>
          ×
        </button>
        <div className="employee-profile-modal-header">
          <img src="/images/logoLight.jpg" alt="GLAMFACE" className="employee-profile-modal-logo" />
          <span className="employee-profile-modal-title">GLAMFACE</span>
        </div>
        <div className="employee-profile-modal-avatar-section">
          <img src={user?.avatar || '/images/default-avatar.png'} alt="avatar" className="employee-profile-modal-avatar" />
          <div className="employee-profile-modal-name-block">
            <span className="employee-profile-modal-name">{user?.name || user?.username}</span>
            <span className="employee-profile-modal-role">Тренер</span>
            <div className="employee-profile-modal-rating">
              <span className="employee-profile-modal-stars">★★★★★</span>
              <span className="employee-profile-modal-rating-count">4.8 (127 отзывов)</span>
            </div>
          </div>
          <button className="employee-profile-modal-photo-btn">Изменить фото</button>
        </div>
        <div className="employee-profile-modal-actions">
          <button className="employee-profile-modal-action">
            <span className="employee-profile-modal-action-icon">🗨️</span>
            Комментарии (19)
          </button>
          <button className="employee-profile-modal-action">
            <span className="employee-profile-modal-action-icon">📝</span>
            Посты (24)
          </button>
          <button className="employee-profile-modal-action">
            <span className="employee-profile-modal-action-icon">📅</span>
            Расписание
          </button>
        </div>
        <button className="employee-profile-modal-logout">Выйти</button>
      </div>
    </div>
  );
};

export default EmployeeProfileModal;
