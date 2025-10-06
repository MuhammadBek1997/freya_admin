import React, { useState } from 'react';

const AboutEmployeeBar = ({ employee,onClose , avg_rating, comment_count }) => {


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
              {avg_rating} ({comment_count} {t("profileReviews")})
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
        <div>

        </div>
      </div>
    </div>
  );
};

// b58ee8c0-2015-43c9-90df-3215fd6ad493

export default AboutEmployeeBar;

{/* <div className='posts-body'>
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
            </div> */}