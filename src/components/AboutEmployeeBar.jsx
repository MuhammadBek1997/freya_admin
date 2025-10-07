import { useEffect, useState } from 'react';
import { UseGlobalContext } from '../Context';

const AboutEmployeeBar = ({ id, employee, onClose, avg_rating, comment_count }) => {
  const { t, fetchEmployeeComments, fetchEmployeePosts } = UseGlobalContext()

  const [selectedInfo, setSelectedInfo] = useState('post');
  
  // ✅ Comments states
  const [comments, setComments] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // ✅ Posts states - O'ZGARTIRILDI
  const [aboutEmployeePosts, setAboutEmployeePosts] = useState([]);
  const [aboutPostsLoading, setAboutPostsLoading] = useState(false);
  const [aboutPostsError, setAboutPostsError] = useState(null);
  const [aboutPostSlideIndex, setAboutPostSlideIndex] = useState({}); // { [postId]: currentIndex }

  // Commentlarni yuklash
  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const result = await fetchEmployeeComments(employee.id, 1, 10);
      setComments(result.comments);
      setAvgRating(result.avg_rating);
      console.log('Comments loaded:', result);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [employee.id]);

  // ✅ Load posts when switching to Posts tab
  useEffect(() => {
    const loadAboutPosts = async () => {
      if (!employee.id) {
        console.error('Employee ID topilmadi');
        return;
      }

      setAboutPostsLoading(true);
      setAboutPostsError(null);
      
      try {
        const employeeIdToUse = employee.id;
        console.log('📤 Fetching posts for employee:', employeeIdToUse);
        
        const data = await fetchEmployeePosts(employeeIdToUse, 1, 10);
        console.log('📥 Posts data received:', data);
        
        const list = data?.data || data || [];
        console.log('📋 Posts list:', list);
        
        setAboutEmployeePosts(list);
      } catch (e) {
        console.error('❌ Error fetching posts:', e);
        setAboutPostsError(e?.message || 'Postlarni olishda xatolik');
      } finally {
        setAboutPostsLoading(false);
      }
    };

    if (selectedInfo === 'post') {
      loadAboutPosts();
    }
  }, [selectedInfo, employee.id]);

  // ✅ Carousel helpers - O'ZGARTIRILDI
  const nextAboutPostSlide = (postId, total) => {
    setAboutPostSlideIndex(prev => {
      const current = prev[postId] || 0;
      const next = (current + 1) % Math.max(total, 1);
      return { ...prev, [postId]: next };
    });
  };

  const prevAboutPostSlide = (postId, total) => {
    setAboutPostSlideIndex(prev => {
      const current = prev[postId] || 0;
      const prev_index = (current - 1 + total) % Math.max(total, 1);
      return { ...prev, [postId]: prev_index };
    });
  };

  const goToAboutPostSlide = (postId, index) => {
    setAboutPostSlideIndex(prev => ({ ...prev, [postId]: index }));
  };

  return (
    <div className="aboutEmployeeBar">
      <div className="aboutEmployeeBar-cont">
        <button className="aboutEmployeeBar-cont-close" onClick={onClose}>
          <img src="/images/closeSidebar.png" alt="" />
        </button>
        <img src="/images/masterImage.png" alt="Employee" className='aboutEmployeeBar-cont-img' />
        <div className='aboutEmployeeBar-masterJob'>
          <p>{employee.profession}</p>
        </div>
        <div className="aboutEmployeeBar-cont-info">
          <h3>{employee.name}</h3>
          <div className='aboutEmployeeBar-cont-rating'>
            <img src="/images/Star1.png" alt="" />
            <p>
              {avg_rating} ({comment_count} {t("profileReviews")})
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className='aboutEmployeeBar-cont-selectinfo'>
          <div
            className='aboutEmployeeBar-cont-selectinfo-item'
            onClick={() => setSelectedInfo('post')}
            id={selectedInfo === 'post' ? 'selected' : ''}
          >
            <img src="/images/employPostIcon.png" alt="" />
            <p>Посты ({aboutEmployeePosts.length})</p>
          </div>
          <div
            className='aboutEmployeeBar-cont-selectinfo-item'
            onClick={() => setSelectedInfo('comment')}
            id={selectedInfo === 'comment' ? 'selected' : ''}
          >
            <img src="/images/employCommentIcon.png" alt="" />
            <p>Комментарии ({comments.length})</p>
          </div>
          <div
            className='aboutEmployeeBar-cont-selectinfo-item'
            onClick={() => setSelectedInfo('schedule')}
            id={selectedInfo === 'schedule' ? 'selected' : ''}
          >
            <img src="/images/employSchedIcon.png" alt="" />
            <p>Расписание</p>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ maxHeight: '50vh', overflowY: 'auto', padding: '1vw' }}>
          
          {/* ✅ Comments Tab */}
          {selectedInfo === 'comment' && (
            <div className='aboutEmp-comments'>
              {commentsLoading ? (
                <div style={{ textAlign: 'center', padding: '2vw' }}>
                  <div style={{
                    width: "2vw",
                    height: "2vw",
                    border: "3px solid #f3f3f3",
                    borderTop: "3px solid #9C2BFF",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 1vw"
                  }}></div>
                  <p style={{ color: "#A8A8B3", fontSize: "0.9vw" }}>Yuklanmoqda...</p>
                </div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2vw' }}>
                  <p style={{ color: "#A8A8B3", fontSize: "1vw" }}>Izohlar yo'q</p>
                </div>
              ) : (
                comments.map((item, index) => (
                  <div className='aboutEmp-comment' key={index} style={{
                    marginBottom: '1.5vw',
                    padding: '1vw',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '0.5vw'
                  }}>
                    <div className='aboutEmp-user' style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "1vw",
                      marginBottom: "0.5vw"
                    }}>
                      <img
                        src={item.user_avatar || '/images/customerImage.png'}
                        alt=""
                        style={{ width: "2.5vw", height: "2.5vw", borderRadius: "50%", objectFit: "cover" }}
                      />
                      <p style={{ fontSize: "0.9vw", fontWeight: "500" }}>Client</p>
                    </div>
                    <p style={{ fontWeight: "300", fontSize: "0.8vw", marginBottom: "0.5vw", lineHeight: "1.4" }}>
                      {item.text}
                    </p>
                    <div className='aboutEmp-rating' style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "0.5vw"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
                        <div
                          className="stars"
                          style={{ '--rating': item.rating }}
                          aria-label={`Rating: ${item.rating} out of 5 stars`}
                        />
                        <p style={{ fontWeight: "300", fontSize: "0.75vw", color: "#666" }}>
                          ({item.rating})
                        </p>
                      </div>
                      <p style={{ fontWeight: "300", fontSize: "0.7vw", color: "#999" }}>
                        {item.created_at.split("T").at(0).split("-").reverse().join(".")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ✅ Posts Tab */}
          {selectedInfo === 'post' && (
            <div className='aboutEmp-posts'>
              {aboutPostsLoading ? (
                <div style={{
                  width: "100%",
                  padding: '2vw',
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  gap: '1vw'
                }}>
                  <div style={{
                    width: "2.5vw",
                    height: "2.5vw",
                    border: "3px solid #f3f3f3",
                    borderTop: "3px solid #9C2BFF",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></div>
                  <p style={{ color: "#A8A8B3", fontSize: "0.9vw" }}>
                    Postlar yuklanmoqda...
                  </p>
                </div>
              ) : aboutPostsError ? (
                <div style={{
                  padding: '2vw',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1vw',
                  alignItems: 'center'
                }}>
                  <p style={{ color: '#FF6B6B', fontSize: '0.9vw' }}>
                    {aboutPostsError}
                  </p>
                </div>
              ) : aboutEmployeePosts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3vw', color: '#A8A8B3' }}>
                  <p style={{ fontSize: '1vw' }}>Postlar yo'q</p>
                </div>
              ) : (
                aboutEmployeePosts.map((post) => {
                  const files = post.media_files || [];
                  const currentIndex = aboutPostSlideIndex[post.id] || 0;
                  const currentFile = files[currentIndex];
                  const isVideo = typeof currentFile === 'string' && /\.(mp4|webm|ogg)$/i.test(currentFile);

                  return (
                    <div key={post.id} style={{
                      marginBottom: '1.5vw',
                      
                      overflow: 'hidden'
                    }}>
                      {/* Media Carousel */}
                      <div style={{ position: 'relative', width: '100%' }}>
                        <div style={{ 
                          position: 'relative', 
                          overflow: 'hidden', 
                          height: "35vh",
                        }}>
                          {files.length > 0 ? (
                            <>
                              {isVideo ? (
                                <video
                                  src={currentFile}
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover' 
                                  }}
                                  controls
                                />
                              ) : (
                                <img
                                  src={currentFile}
                                  alt={`Slide ${currentIndex + 1}`}
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover' 
                                  }}
                                />
                              )}

                             
                            </>
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#A8A8B3',
                              fontSize: '0.9vw'
                            }}>
                              Media fayllar mavjud emas
                            </div>
                          )}
                        </div>

                        {/* Dots Indicator */}
                        {files.length > 1 && (
                          <div style={{
                            position: 'absolute',
                            bottom: '1vw',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '0.5vw'
                          }}>
                            {files.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => goToAboutPostSlide(post.id, index)}
                                style={{
                                  width: index === currentIndex ? '1.5vw' : '0.5vw',
                                  height: '0.55vw',
                                  borderRadius: '30vw',
                                  border: 'none',
                                  background: index === currentIndex ? '#9C2BFF':'#9C2BFF' ,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s',
                                  padding: 0
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Post Content */}
                      <div style={{ padding: '1vw' }}>
                        <h2 style={{ 
                          fontSize: '1.1vw', 
                          margin: '0 0 0.5vw 0', 
                          fontWeight: '600',
                          color: '#333'
                        }}>
                          {post.title}
                        </h2>
                        <p style={{ 
                          color: '#666', 
                          fontSize: '0.85vw', 
                          lineHeight: '1.5',
                          marginBottom: '0.8vw'
                        }}>
                          {post.description}
                        </p>
                        <div style={{ 
                          color: '#999', 
                          fontSize: '0.75vw',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5vw'
                        }}>
                         <span>{post.created_at.split("T").at(0).split("-").reverse().join(".")}</span>
                          
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutEmployeeBar;