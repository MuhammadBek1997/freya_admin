import React, { useState } from 'react';

const AboutEmployeeBar = ({ employee,onClose }) => {


  const [selectedInfo,setSelectedInfo] = useState('post');


  return (
    <div className="aboutEmployeeBar">
      <div className="aboutEmployeeBar-cont">
        <button className="aboutEmployeeBar-cont-close" onClick={onClose}>
                <img src="/images/closeSidebar.png" alt="" />
            </button>
        <img src="/images/masterImage.png" alt="Employee" className='aboutEmployeeBar-cont-img' />
        <div className='aboutEmployeeBar-masterJob'>
          <p>
            {employee.profession}
          </p>
        </div>
        <div className="aboutEmployeeBar-cont-info">
          <h3>
            {employee.name}
          </h3>
          <div className='aboutEmployeeBar-cont-rating'>
            <img src="/images/Star1.png" alt="" />
            <p>
              4.8 (13 отзывов)
            </p>
          </div>
        </div>
        <div className='aboutEmployeeBar-cont-selectinfo'>
          <div className='aboutEmployeeBar-cont-selectinfo-item' onClick={() => setSelectedInfo('post')} id={selectedInfo == 'post' ? 'selected' : ''}>
            <img src="/images/employPostIcon.png" alt="" />
            <p>
              Посты (28)
            </p>
          </div>
          <div className='aboutEmployeeBar-cont-selectinfo-item' onClick={() => setSelectedInfo('comment')} id={selectedInfo == 'comment' ? 'selected' : ''}>
            <img src="/images/employCommentIcon.png" alt="" />
            <p>
              Комментарии (179)
            </p>
          </div>
          <div className='aboutEmployeeBar-cont-selectinfo-item' onClick={() => setSelectedInfo('schedule')} id={selectedInfo == 'schedule' ? 'selected' : ''}>
            <img src="/images/employSchedIcon.png" alt="" />
            <p>
              Расписание
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutEmployeeBar;