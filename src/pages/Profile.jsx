import React, { useEffect, useState, useRef } from 'react'
import { UseGlobalContext } from '../Context'
import YandexMap from '../components/YandexMap'
import ReadMoreReact from 'read-more-react';


const Profile = () => {

  const { 
    t, language, handleChange, profArr, commentsArr,
    adminSalonLoading, adminSalonError, fetchAdminSalon, updateSalon,
    uploadSalonPhotos, deleteSalonPhoto
  } = UseGlobalContext()

  const [changeMode,setChangeMode] = useState(false)
  const [editDescription, setEditDescription] = useState('')
  const [editAdditionals, setEditAdditionals] = useState('')
  const [editComfort, setEditComfort] = useState([])
  const [editSale, setEditSale] = useState({ amount: '', date: '' })
  const [currentSale, setCurrentSale] = useState({ amount: '', date: '' })
  
  // Rasmlar uchun ref va state'lar
  const imageListRef = useRef(null)
  const fileInputRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [companyImages, setCompanyImages] = useState([])
  const [pendingImages, setPendingImages] = useState([])
  
  // Carousel uchun state
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Kontaktlar uchun state
  const [editContacts, setEditContacts] = useState({
    phone1: '',
    phone2: '',
    instagram: ''
  })
  
  // To'lov tizimi uchun state
  const [editPayment, setEditPayment] = useState({
    card_number: '',
    card_holder: '',
    card_type: 'HUMO'
  })
  const [showAddCard, setShowAddCard] = useState(false)

  // Komponent yuklanganda admin salon ma'lumotlarini olish
  useEffect(() => {
    const loadAdminSalon = async () => {
      try {
        await fetchAdminSalon();
      } catch (error) {
        console.error('Failed to load admin salon:', error);
      }
    };

    // Agar profArr bo'sh bo'lsa, ma'lumotlarni yuklash
    if (!profArr || profArr.length === 0) {
      loadAdminSalon();
    }
  }, []);

  // Edit mode ga kirganda current ma'lumotlarni yuklash
  useEffect(() => {
    if (changeMode && profArr && profArr.length > 0) {
      const currentDescription = getSalonData(profArr[0], 'salon_description');
      const currentAdditionals = profArr[0]?.salon_additionals || [];
      const currentComfort = profArr[0]?.salon_comfort || [];
      const currentSaleData = profArr[0]?.salon_sale || { amount: '', date: '' };
      
      setEditDescription(currentDescription);
      setEditAdditionals(Array.isArray(currentAdditionals) ? currentAdditionals.join('\n') : '');
      setEditComfort([...currentComfort]); // Deep copy qilish
      setEditSale({ ...currentSaleData });
    }
  }, [changeMode, profArr, language]);

  // currentSale ni yuklash
  useEffect(() => {
    if (profArr && profArr.length > 0) {
      const saleData = profArr[0]?.salon_sale || { amount: '', date: '' };
      setCurrentSale({ ...saleData });
      
      // Salon photos ni yuklash
      const images = profArr[0]?.salon_photos || [];
      setCompanyImages(Array.isArray(images) ? images : []);
    }
  }, [profArr]);

  // Tilga qarab salon ma'lumotlarini olish funksiyasi
  const getSalonData = (salon, field) => {
    if (!salon) return '';
    
    switch (language) {
      case 'uz':
        return salon[`${field}_uz`] || salon[field] || '';
      case 'en':
        return salon[`${field}_en`] || salon[field] || '';
      case 'ru':
        return salon[`${field}_ru`] || salon[field] || '';
      default:
        return salon[field] || '';
    }
  };

  // Rasmlar uchun scroll funksiyalari
  const checkScrollButtons = () => {
    if (imageListRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = imageListRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (imageListRef.current) {
      imageListRef.current.scrollBy({ left: -220, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 300);
    }
  };

  const scrollRight = () => {
    if (imageListRef.current) {
      imageListRef.current.scrollBy({ left: 220, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 300);
    }
  };

  // Carousel navigation funksiyalari
  const nextSlide = () => {
    const totalImages = companyImages.length + pendingImages.length;
    if (totalImages > 0) {
      setCurrentSlide((prev) => (prev + 1) % totalImages);
    }
  };

  const prevSlide = () => {
    const totalImages = companyImages.length + pendingImages.length;
    if (totalImages > 0) {
      setCurrentSlide((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  const goToSlide = (index) => {
    const totalImages = companyImages.length + pendingImages.length;
    if (index >= 0 && index < totalImages) {
      setCurrentSlide(index);
    }
  };

  // Rasm yuklash funksiyasi (faqat preview uchun)
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Fayllarni preview uchun URL yaratish
    const newImagePreviews = files.map(file => {
      return {
        file: file,
        preview: URL.createObjectURL(file)
      };
    });

    // Pending images ga qo'shish
    setPendingImages(prev => [...prev, ...newImagePreviews]);
    
    // Input ni tozalash
    event.target.value = '';
  };

  // Rasmni o'chirish funksiyasi
  const handleDeleteImage = async (index) => {
    if (!window.confirm('Rasmni o\'chirishni xohlaysizmi?')) {
      return;
    }

    const totalExistingImages = companyImages.length;
    
    if (index < totalExistingImages) {
      // Mavjud rasmni serverdan o'chirish
      if (!profArr || profArr.length === 0) {
        alert('Salon ma\'lumotlari yuklanmagan');
        return;
      }

      const salonId = profArr[0].id;

      try {
        // Serverdan o'chirish (index ni yuborish)
        const result = await deleteSalonPhoto(salonId, index);
        console.log('Photo deleted successfully:', result);
        
        // Local state ni yangilash (server javobidan)
        if (result.salon_photos) {
          setCompanyImages(result.salon_photos);
        }
        
        alert('Rasm muvaffaqiyatli o\'chirildi!');
      } catch (error) {
        console.error('Error deleting photo:', error);
        alert('Rasmni o\'chirishda xatolik yuz berdi: ' + error.message);
      }
    } else {
      // Pending rasmni o'chirish (faqat local state dan)
      const pendingIndex = index - totalExistingImages;
      setPendingImages(prev => {
        const newPendingImages = [...prev];
        // URL ni tozalash (memory leak oldini olish uchun)
        if (newPendingImages[pendingIndex]) {
          URL.revokeObjectURL(newPendingImages[pendingIndex].preview);
          newPendingImages.splice(pendingIndex, 1);
        }
        return newPendingImages;
      });
    }
  };

  // Scroll tugmalarini tekshirish uchun useEffect
  useEffect(() => {
    checkScrollButtons();
    
    const handleResize = () => checkScrollButtons();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [companyImages, pendingImages]);

  useEffect(() => {
    if (imageListRef.current) {
      const imageList = imageListRef.current;
      imageList.addEventListener('scroll', checkScrollButtons);
      
      return () => imageList.removeEventListener('scroll', checkScrollButtons);
    }
  }, []);

  // Carousel currentSlide ni reset qilish
  useEffect(() => {
    const totalImages = companyImages.length + pendingImages.length;
    if (currentSlide >= totalImages && totalImages > 0) {
      setCurrentSlide(0);
    }
  }, [companyImages, pendingImages, currentSlide]);

  // Comfort item ni toggle qilish funksiyasi
  const toggleComfortItem = (index) => {
    if (!changeMode) return; // Faqat edit mode da ishlaydi
    
    const updatedComfort = [...editComfort];
    updatedComfort[index] = {
      ...updatedComfort[index],
      isActive: !updatedComfort[index].isActive
    };
    setEditComfort(updatedComfort);
  };

  // Saqlash funksiyasi
  const handleSave = async () => {
    if (!profArr || profArr.length === 0) return;
    
    try {
      const salonId = profArr[0].id;
      const updateData = {};
      
      // Til bo'yicha ma'lumotlarni yangilash
      const fieldSuffix = language === 'uz' ? '_uz' : language === 'en' ? '_en' : '_ru';
      
      // Description yangilash
      if (editDescription !== '') {
        updateData[`salon_description${fieldSuffix}`] = editDescription;
      }
      
      // Additionals yangilash
      if (editAdditionals !== '') {
        // Additionals ni array ga aylantirish (har bir qator alohida element)
        const additionalsArray = editAdditionals.split('\n').filter(item => item.trim() !== '');
        updateData['salon_additionals'] = additionalsArray;
      }
      
      // Comfort yangilash
      if (editComfort.length > 0) {
        updateData['salon_comfort'] = editComfort;
      }
      
      // Sale yangilash
      if (editSale.amount !== '' || editSale.date !== '') {
        updateData['salon_sale'] = {
          amount: editSale.amount,
          date: editSale.date
        };
      }
      
      // Agar yangilanishi kerak bo'lgan ma'lumotlar bo'lsa
      if (Object.keys(updateData).length > 0) {
        await updateSalon(salonId, updateData);
        console.log('Salon ma\'lumotlari muvaffaqiyatli yangilandi');
      }

      // Pending rasmlarni yuklash
      if (pendingImages.length > 0) {
        try {
          const files = pendingImages.map(img => img.file);
          const result = await uploadSalonPhotos(salonId, files);
          console.log('Photos uploaded successfully:', result);
          
          // Local state ni yangilash (server javobidan)
          if (result.salon_photos) {
            setCompanyImages(result.salon_photos);
          }
          
          // Pending images ni tozalash
          pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
          setPendingImages([]);
          
          console.log('Rasmlar muvaffaqiyatli yuklandi');
        } catch (error) {
          console.error('Error uploading photos:', error);
          alert('Rasmlarni yuklashda xatolik yuz berdi: ' + error.message);
          return; // Xatolik bo'lsa, edit mode dan chiqmaslik
        }
      }
      
      // Edit mode dan chiqish
      setChangeMode(false);
      
      // Edit state larni tozalash
      setEditDescription('');
      setEditAdditionals('');
      setEditComfort([]);
      setEditSale({ amount: '', date: '' });
    } catch (error) {
      console.error('Salon yangilashda xatolik:', error);
    }
  };

  const formatSumm = (num) => {
    if (!num || num === 0) return '0';
    let init = 5
    if (num >= 10000000000) {
      init = 9
    }
    else if (num >= 1000000000) {
      init = 7
    } else if (num >= 100000000) {
      init = 5
    } else if (num >= 10000000) {
      init = 3
    }
    else if (num >= 1000000) {
      init = 1
    }
    return num
      .toString()
      .split('')
      .reverse()
      .reduce((acc, digit, i) => (i > 0 && (num.toString().length - (i - init)) % 3 === 0 ? ` ${digit}${acc}` : `${digit}${acc}`), '');
  }
  
  // Loading va error holatlarini ko'rsatish
  if (adminSalonLoading || (!profArr || profArr.length === 0 || !profArr[0])) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        {t('loading')}...
      </div>
    );
  }

  // Error holatini ko'rsatish
  if (adminSalonError) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#d32f2f'
      }}>
        <p>Xatolik yuz berdi: {adminSalonError}</p>
        <button 
          onClick={() => fetchAdminSalon()}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  let salonComments = commentsArr.filter(item => item.salon == profArr[0]?.id)

  if(!changeMode){
  return (
    <section>
      <nav className='profile-nav'>
        <div className='profile-nav-top'>
          <div className='profile-nav-logo'>
            <img src="/images/profileIcon.png" alt="" />
            <h2>
              {t('profileTitle')}
            </h2>
          </div>
          <div className='profile-nav-lang' style={{marginRight:"-45vw" , width:"20vw" , gap:"0.3vw"}}>
            <img src="/images/globusGray.png" alt="" className='globus' />
            <select value={language} onChange={handleChange}>
              <option value="ru">RU</option>
              <option value="uz">UZ</option>
              <option value="en">EN</option>
            </select>
            <img src="/images/Arrow.png" alt="Arrow" className='arrow' />
          </div>
          <button onClick={() => {
            localStorage.removeItem('token')
            window.location.href = '/login'
          }}>
            {t('profileLogout')}
          </button>
        </div>
        <div className='profile-nav-bottom'>
          <div className="profile-nav-left">
            <div className='company-image' style={{
          background: profArr[0].icon ? `url(${profArr[0].icon})` : "/images/ForCompanyImage.png",
              backgroundSize: profArr[0].icon ? "cover" : "30%",
              backgroundPosition: "center center"
            }}>

            </div>
            <div className='profile-nav-info'>
              <div className='profile-salon-name'>
                <h2>
                  {getSalonData(profArr[0], 'salon_name') || profArr[0].name}
                </h2>
                {changeMode ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleSave} style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                      <img src="/images/editPen.png" alt="" />
                      {t('profileSave')}
                    </button>
                    <button onClick={() => {
                      setChangeMode(false)
                      setEditDescription('')
                      setEditAdditionals('')
                      setEditComfort([])
                      setEditSale({ amount: '', date: '' })
                    }} style={{ backgroundColor: '#f44336', color: 'white' }}>
                      Bekor qilish
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setChangeMode(true)}>
                    <img src="/images/editPen.png" alt="" />
                    {t('profileEdit')}
                  </button>
                )}
              </div>
              <div className='profile-salon-rating'>
                <div
                  className="stars"
                  style={{ '--rating': profArr[0].rating }}
                  aria-label={`Rating: ${profArr[0].rating} out of 5 stars`}
                >
                </div>
                <p>
                  {profArr[0].rating} ({salonComments.length} {t('profileReviews')} )
                </p>
              </div>
              <div className='profile-salon-sale'>

              </div>
            </div>
          </div>
          <div className="profile-nav-right">
            <div className='profile-nav-clientsAmount'>
              <div>
                <img src="/images/profileAv.png" alt="" />
                <p>
                  {t('profileClientsMonth')}
                </p>
              </div>
              <h4>
                <span>
                  1,7
                </span> тыс
              </h4>
              <img src="/images/clientGraph.png" alt="" />
            </div>
            <div className='profile-nav-workTime'>
              <div>
                <img src="/images/workTimeIcon.png" alt="" />
                <h3>
                  8:00 - 22:00
                </h3>
              </div>
              <div>
                <img src="/images/workDateIcon.png" alt="" />
                <h3>
                  {t('profileWorkDays')}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className='profile-body'>
        <div className="profile-body-left">
          <div className="company-data">
            <div className='company-images'>
              {(companyImages?.length > 0 || pendingImages?.length > 0)
                ?
                <div className="relative w-full">
                  {/* Carousel wrapper */}
                  <div className="relative overflow-hidden" style={{ height: "50vh", borderRadius: "1vw" }}>
                    {/* Current image display */}
                    {(() => {
                      const allImages = [...companyImages, ...pendingImages];
                      if (allImages.length === 0) return null;
                      
                      const currentImage = allImages[currentSlide];
                      const isExisting = currentSlide < companyImages.length;
                      
                      return (
                        <div className="w-full h-full">
                          <img
                            src={isExisting ? currentImage : currentImage.preview}
                            className="w-full h-full object-cover"
                            alt={`Slide ${currentSlide + 1}`}
                            style={{ borderRadius: "1vw" }}
                          />
                          {/* Delete button for edit mode */}
                          {changeMode && (
                            <button
                              onClick={() => handleDeleteImage(currentSlide)}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 z-10 transition-colors"
                              title="Delete image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Navigation arrows */}
                  {[...companyImages, ...pendingImages].length > 1 && (
                    <>
                      
                      
                      <button
                        onClick={nextSlide}
                        className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all z-10"
                      >
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                  
                  {/* Indicators */}
                  {[...companyImages, ...pendingImages].length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {[...companyImages, ...pendingImages].map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToSlide(index)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index === currentSlide 
                              ? 'bg-white' 
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                :
                <img src="/images/NoCompImg.png" alt="" className='compNoImg' />
              }
            </div>
            <div className={getSalonData(profArr[0], 'salon_title') == "" ? 'company-title-empty' : 'company-title-full'}>
              <img src="/images/titleIcon.png" alt="" />
              <h3>
                {getSalonData(profArr[0], 'salon_title') == "" ? t('profileTitle2') : getSalonData(profArr[0], 'salon_title') }
              </h3>
            </div>
            <div className='company-about'>
              <h3>
                {t('profileAbout')}
              </h3>
              <div className={getSalonData(profArr[0], 'salon_description') == "" ? 'empty' : 'info'}>
                {changeMode ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder={t('profileAboutPlaceholder')}
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                ) : (
                  getSalonData(profArr[0], 'salon_description') == "" 
                  ? 
                  t('profileEmpty')
                  : 
                  <ReadMoreReact
                    text={getSalonData(profArr[0], 'salon_description')}
                    min={120}
                    ideal={350}
                    max={770}
                    readMoreText={<span style={{
                      cursor: "pointer",
                      color: "#0060CE",
                      fontSize: "1.1vw",
                      textDecoration:"underline"
                    }}>
                      {t('profileReadMore')}
                    </span>}
                    />
                )}
              </div>
            </div>
            <div className='company-add'>
              <h3>
                {t('profileNote')}
              </h3>
              <div className={profArr[0]?.salon_additionals?.length == 0 ? 'empty' : 'info'}>
                {changeMode ? (
                  <textarea
                    value={editAdditionals}
                    onChange={(e) => setEditAdditionals(e.target.value)}
                    placeholder={t('profileNotePlaceholder')}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                ) : (
                  profArr[0]?.salon_additionals?.length == 0
                  ? 
                  t('profileEmpty')
                  : 
                  profArr[0]?.salon_additionals?.map((item,index)=>{
                    return(
                      <p key={index}>
                      ✨ {item}
                      </p>
                    )
                  })
                )}
              </div>
            </div>
            <div className='company-number'>
              <h3>
                {t('profilePhone')}
              </h3>
              <div className='company-number-list'>
                {
                  profArr[0]?.salon_phone && (
                    <div className='company-number-card'>
                      <img src="/images/callIcon.png" alt="" />
                      <a href={`tel:${profArr[0].salon_phone}`}>
                        {profArr[0].salon_phone}
                      </a>
                    </div>
                  )
                }
                {
                  profArr[0]?.salon_add_phone && (
                    <div className='company-number-card'>
                      <img src="/images/callIcon.png" alt="" />
                      <a href={`tel:${profArr[0].salon_add_phone}`}>
                        {profArr[0].salon_add_phone}
                      </a>
                    </div>
                  )
                }
              </div>
            </div>
            <div className='company-sale'>
              <div className='company-sale-amount'>
                <h3>Скидка</h3>
                <div className='sale-info'>
                  {currentSale.amount ? `${currentSale.amount}%` : 'Скидка не установлена'}
                </div>
              </div>
              <div className='company-sale-date'>
                <h3>Срок действия</h3>
                <div className='sale-info'>
                  {currentSale.date ? new Date(currentSale.date).toLocaleDateString('ru-RU') : 'Не указан'}
                </div>
              </div>
            </div>
            {
              profArr[0]?.social_media?.length > 0
                ?
                <div className='company-social'>
                  <h3>
                    {t('profileSocial')}
                  </h3>
                  <div className='company-social-list'>
                    {
                      profArr[0]?.social_media?.map((item, index) => {
                        return (
                          <div className='company-social-card' key={index}>
                            <img src={`/images/${item.type}.png`} alt="" />
                            <a href={item.link}>
                              {item.type}
                            </a>
                            <img src="/images/arrowLeft.png" alt="" />
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
                :
                null
            }
          </div>
          <div className="company-facilities">
            <h3>
              {t('profileFacilities')}
            </h3>
            <div className="facilities-list">
              {
                profArr[0]?.salon_comfort?.map((item, index) => {
                  return (
                    <div key={index} className='facilities-list-item'>
                      <img src={item.isActive ? `/images/${item.name}true.png` : `/images/${item.name}.png`} alt="" />
                      <p style={{
                        color: item.isActive ? "#2C2C2C" : "#2C2C2C80",
                        textDecoration: item.isActive ? "none" : "line-through"
                      }}>
                        {t(item.name)}
                      </p>
                    </div>
                  )
                })
              }
            </div>
          </div>
          <div className="company-comments">
            <h3>
              Комментарии ({salonComments.length})
            </h3>
            {
              salonComments.length == 0
                ?
                <div style={{
                  padding: "10vh",
                  textAlign: "center"
                }}>
                  <img src="/images/noComments.png" alt="" style={{
                    margin: "0 auto"
                  }} />
                  <h2 style={{
                    color: "#A8A8B3"
                  }}>
                    Комментарии пока что нет
                  </h2>
                </div>
                :
                <div>
                  {
                    salonComments.map((item, index) => {
                      return (
                        <div key={index} className='comment-card'>
                          <div className='comment-author'>
                            <img src={'/images/customerImage.png'} alt="" />
                            <h3>
                              {item.customer_name}
                            </h3>
                          </div>
                          <p>
                            {item.comment}
                          </p>
                          <div className='comment-bottom'>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5vw"
                            }}>
                              <div
                                className="stars"
                                style={{ '--rating': item.rating }}
                                aria-label={`Rating: ${item.rating} out of 5 stars`}
                              >
                              </div>
                              <p style={{ fontSize: "0.8vw", paddingTop: "0.1vw" }}>
                                ({item.rating})
                              </p>
                            </div>
                            <div className='comment-date'>
                              {
                                item.date
                              }
                            </div>
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
            }
          </div>
        </div>
        <div className="profile-body-right">
          <div className="payment-system">
            <h3>
              Система монетизации
            </h3>
            <div className='payment-system-bottom'>
              <div className='payment-system-summ'>
                <div className='payment-system-summ-top'>
                  <img src="/images/paymentTop.png" alt="" />
                  <h4>
                    Было оплачено
                  </h4>
                </div>
                <div style={{ minHeight: "10vh", display: "flex", alignItems: "end" }}>
                  <h1>
                    {formatSumm(profArr[0]?.paymentSystem?.summ)}
                  </h1>
                  <p>
                    UZS
                  </p>
                </div>
              </div>
              <div className='payment-system-card'>
                <div className='payment-system-card-top'>
                  <img src="/images/paymentCard.png" alt="" />
                  <h4>
                    Привязанная карта
                  </h4>
                </div>
                <div className='payment-system-card-bottom'>
                  <p>
                    <span>
                      {profArr[0]?.paymentSystem?.card_number?.split('').map((item, index) => {
                        if (index <= 3) {
                          return item
                        }
                      })}
                    </span>
                    <span>
                      **** ****
                    </span>
                    <span>
                      {profArr[0]?.paymentSystem?.card_number?.split('').map((item, index) => {
                        if (index >= 12) {
                          return item
                        }
                      })}
                    </span>
                  </p>
                  <h3>
                    {profArr[0]?.paymentSystem?.card_type}
                  </h3>
                </div>
              </div>
            </div>
          </div>
          <div className="company-location">
            <div className='company-location-top'>
              <h3>
                Местоположение
              </h3>
            </div>
            <div className='company-location-map'>
              <YandexMap lat={profArr[0]?.location?.lat} long={profArr[0]?.location?.long} />
            </div>
            <div className='company-location-bottom'>
              <div className='company-location-address'>
                <img src="/images/markerMap.png" alt="" />
                <p>
                  ул. Мустакиллик, 12, Ташкент
                </p>
              </div>
              <div className='company-location-navigate'>
                <img src="/images/navigateMap.png" alt="" />
                <p>
                  ст. метро: Мустакиллик майдони
                </p>
              </div>
            </div>
          </div>
          <div className="company-clients">
            <h3>
              Постоянные клиенты
            </h3>
            <div>
              {
                profArr[0]?.top_clients?.length > 0
                  ?
                  profArr[0]?.top_clients?.map((item, index) => {
                    return (
                      <div className='company-clients-card' key={index}>
                        <img src="/images/customerImage.png" alt="" className='top-client-image' />
                        <div className='company-clients-card-info'>
                          <img src="/images/profileTopClient.png" alt="" />
                          <p>
                            {item.name}
                          </p>
                          <img src="/images/callingBlackIcon.png" alt="" />
                          <a href="">
                            {item.phone}
                          </a>
                          <img src="/images/visitsIcon.png" alt="" />
                          <p>
                            {item.visits} посещений
                          </p>
                        </div>
                      </div>
                    )
                  })
                  :
                  <div>
                    <img
                      src="/images/noClientsImg.png"
                      style={{
                        margin: "10vh auto 2vh auto",
                        width: "7vw"
                      }}
                      alt=""
                    />
                    <p style={{ color: "#A8A8B3", textAlign: "center", fontSize: "1vw" }}>
                      Постоянных клиентов пока что нет
                    </p>
                  </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  )
  }else{
    return (
    <section>
      <nav className='profile-nav' style={{height:"10vh"}}>
        <div className='profile-nav-top' style={{height:"10vh"}}>
          <div className='profile-nav-logo'>
            <img src="/images/editProfile.png" alt="" />
            <h2>
              Редактировать Профиль
            </h2>
          </div>
          <div className="profile-nav-buttons">
            <button
            className='profile-nav-cancel' 
            onClick={() => {
              setChangeMode(false)
              setEditDescription('')
              setEditAdditionals('')
              setEditComfort([])
              setEditSale({ amount: '', date: '' })
            }}>
              Отмена
            </button>
            <button
            className='profile-nav-save'
            onClick={handleSave}>
              Сохранить
            </button>
          </div>
        </div>
      </nav>
      <div className='profile-body' style={{paddingTop:"12vh"}}>
        <div className="profile-body-left">
          <div className="company-data" style={{minHeight:"70vh"}}>
            <div className={getSalonData(profArr[0], 'salon_title') == "" ? 'company-title-empty' : 'company-title-full'}>
              {/* <img src="/images/titleIcon.png" alt="" /> */}
              <h3>
                {getSalonData(profArr[0], 'salon_title') == "" ? t('profileTitle2') : getSalonData(profArr[0], 'salon_title') }
              </h3>
            </div>
            <div className='company-about'>
              <h3>
                {t('profileAbout')}
              </h3>
              <div className={getSalonData(profArr[0], 'salon_description') == "" ? 'empty' : 'info'}>
                {changeMode ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder={t('profileAboutPlaceholder')}
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                ) : (
                  getSalonData(profArr[0], 'salon_description') == "" 
                  ? 
                  t('profileEmpty')
                  : 
                  <ReadMoreReact
                    text={getSalonData(profArr[0], 'salon_description')}
                    min={120}
                    ideal={350}
                    max={770}
                    readMoreText={<span style={{
                      cursor: "pointer",
                      color: "#0060CE",
                      fontSize: "1.1vw",
                      textDecoration:"underline"
                    }}>
                      {t('profileReadMore')}
                    </span>}
                    />
                )}
              </div>
            </div>
            <div className='company-add'>
              <h3>
                {t('profileNote')}
              </h3>
              <div className={profArr[0]?.salon_additionals?.length == 0 ? 'empty' : 'info'}>
                {changeMode ? (
                  <textarea
                    value={editAdditionals}
                    onChange={(e) => setEditAdditionals(e.target.value)}
                    placeholder={t('profileNotePlaceholder')}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                ) : (
                  profArr[0]?.salon_additionals?.length == 0
                  ? 
                  t('profileEmpty')
                  : 
                  profArr[0]?.salon_additionals?.map((item,index)=>{
                    return(
                      <p key={index}>
                      ✨ {item}
                      </p>
                    )
                  })
                )}
              </div>
            </div>
            <div className='company-sale'>
              <div className='company-sale-amount'>
                <h4>Скидка (%)</h4>
                <input
                  type="text"
                  value={editSale.amount}
                  onChange={(e) => setEditSale({...editSale, amount: e.target.value})}
                  placeholder="28 (%)"
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div className='company-sale-date'>
                <h4>Срок действия</h4>
                <input
                  type="text"
                  value={editSale.date}
                  onChange={(e) => setEditSale({...editSale, date: e.target.value})}
                  placeholder='7 (дней)'
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            {/* <div className='company-number'>
              <h3>
                {t('profilePhone')}
              </h3>
              <div className='company-number-list'>
                {
                  profArr[0]?.salon_phone && (
                    <div className='company-number-card'>
                      <img src="/images/callIcon.png" alt="" />
                      <a href={`tel:${profArr[0].salon_phone}`}>
                        {profArr[0].salon_phone}
                      </a>
                    </div>
                  )
                }
                {
                  profArr[0]?.salon_add_phone && (
                    <div className='company-number-card'>
                      <img src="/images/callIcon.png" alt="" />
                      <a href={`tel:${profArr[0].salon_add_phone}`}>
                        {profArr[0].salon_add_phone}
                      </a>
                    </div>
                  )
                }
              </div>
            </div> */}
            {
              // profArr[0]?.social_media?.length > 0
              //   ?
              //   <div className='company-social'>
              //     <h3>
              //       {t('profileSocial')}
              //     </h3>
              //     <div className='company-social-list'>
              //       {
              //         profArr[0]?.social_media?.map((item, index) => {
              //           return (
              //             <div className='company-social-card' key={index}>
              //               <img src={`/images/${item.type}.png`} alt="" />
              //               <a href={item.link}>
              //                 {item.type}
              //               </a>
              //               <img src="/images/arrowLeft.png" alt="" />
              //             </div>
              //           )
              //         })
              //       }
              //     </div>
              // </div>
              // :
              // null
            }
          </div>
        </div>
        <div className="profile-body-right">
          <div className='profile-images'>
              <h3>Компания расмлари</h3>
              <div className='profile-image-container'>
                <div className='profile-image-list' ref={imageListRef}>
                  {/* Mavjud rasmlar */}
                  {
                    companyImages?.map((item, index) => {
                      return (
                        <div className='profile-image-item' key={`existing-${index}`}>
                          <img src={item} alt="" />
                          <div className='profile-image-delete' onClick={() => handleDeleteImage(index, false)}>
                            <img src="/images/company-image-delete.png" alt="" />
                          </div>
                        </div>
                      )
                    })
                  }
                  {/* Pending rasmlar */}
                  {
                    pendingImages?.map((item, index) => {
                      return (
                        <div className='profile-image-item' key={`pending-${index}`}>
                          <img src={item.preview} alt="" />
                          <div className='profile-image-delete' onClick={() => handleDeleteImage(companyImages.length + index, true)}>
                            <img src="/images/company-image-delete.png" alt="" />
                          </div>
                          <div className='profile-image-pending-badge'>Yangi</div>
                        </div>
                      )
                    })
                  }
                  <div className='profile-add-imageBtn' onClick={() => fileInputRef.current?.click()}>
                    <img src="/images/+.png" alt="" />
                    <span>Rasm qo'shish</span>
                  </div>
                </div>
              </div>
              <div className='profile-image-nav'>
                <button 
                  className='profile-image-nav-btn' 
                  onClick={scrollLeft}
                  disabled={!canScrollLeft}
                >
                  ‹
                </button>
                <div className='profile-image-counter'>
                  {companyImages?.length || 0} ta rasm
                </div>
                <button 
                  className='profile-image-nav-btn' 
                  onClick={scrollRight}
                  disabled={!canScrollRight}
                >
                  ›
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className='profile-image-upload-input'
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
          </div>
          <div className="company-facilities">
            <h3>
              {t('profileFacilities')}
            </h3>
            <div className="facilities-list">
              {
                editComfort?.map((item, index) => {
                  return (
                    <div key={index} className='facilities-list-item' onClick={() => toggleComfortItem(index)} style={{ cursor: 'pointer' }}>
                      <img src={item.isActive ? `/images/${item.name}true.png` : `/images/${item.name}.png`} alt="" />
                      <p style={{
                        color: item.isActive ? "#2C2C2C" : "#2C2C2C80",
                        textDecoration: item.isActive ? "none" : "line-through"
                      }}>
                        {t(item.name)}
                      </p>
                    </div>
                  )
                })
              }
            </div>
          </div>
          <div className='company-contacts' style={{
            backgroundColor: '#F8F9FA',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Номер телефона
                </label>
                {changeMode ? (
                  <input 
                    type="text" 
                    value={editContacts.phone1}
                    onChange={(e) => setEditContacts(prev => ({...prev, phone1: e.target.value}))}
                    placeholder="+998901234567"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'white',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '14px 16px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    fontSize: '16px',
                    color: '#111827',
                    border: '1px solid #E5E7EB',
                    minHeight: '52px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    +998901234567
                  </div>
                )}
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  2-Номер телефона (необязательно)
                </label>
                {changeMode ? (
                  <input 
                    type="text" 
                    value={editContacts.phone2}
                    onChange={(e) => setEditContacts(prev => ({...prev, phone2: e.target.value}))}
                    placeholder="+998901234567"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: 'white',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '14px 16px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    fontSize: '16px',
                    color: '#111827',
                    border: '1px solid #E5E7EB',
                    minHeight: '52px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    +998901234567
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Ссылка на Instagram
              </label>
              {changeMode ? (
                <input 
                  type="text" 
                  value={editContacts.instagram}
                  onChange={(e) => setEditContacts(prev => ({...prev, instagram: e.target.value}))}
                  placeholder="https://instagram.com/user"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    backgroundColor: 'white',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
              ) : (
                <div style={{
                  padding: '14px 16px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  fontSize: '16px',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  minHeight: '52px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  https://instagram.com/user
                </div>
              )}
            </div>
          </div>
          <div className="payment-system">
            <div style={{
              backgroundColor: '#F8F9FA',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <img src="/images/paymentCard.png" alt="" style={{
                  width: '24px',
                  height: '24px',
                  marginRight: '12px'
                }} />
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  {t('profilePaymentCard') || 'Привязанная карта'}
                </h4>
              </div>
              
              {profArr[0]?.paymentSystem?.card_number ? (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #E5E7EB',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                      letterSpacing: '2px'
                    }}>
                      {profArr[0]?.paymentSystem?.card_number?.slice(0, 4)} **** **** {profArr[0]?.paymentSystem?.card_number?.slice(-4)}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#6B7280',
                      backgroundColor: '#F3F4F6',
                      padding: '4px 12px',
                      borderRadius: '20px'
                    }}>
                      {profArr[0]?.paymentSystem?.card_type || 'HUMO'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>
                    {profArr[0]?.paymentSystem?.card_holder || 'Card Holder'}
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '2px dashed #D1D5DB',
                  textAlign: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    marginBottom: '12px'
                  }}>
                    {t('profileNoCard') || 'Карта не привязана'}
                  </div>
                </div>
              )}
              
              {changeMode && (
                <button
                  onClick={() => setShowAddCard(true)}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    backgroundColor: '#8B5CF6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#7C3AED'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#8B5CF6'}
                >
                  {profArr[0]?.paymentSystem?.card_number ? 
                    (t('profileChangeCard') || 'Изменить') : 
                    (t('profileAddCard') || 'Добавить карту')
                  }
                </button>
              )}
            </div>
            
            {/* Karta qo'shish modali */}
            {showAddCard && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  width: '90%',
                  maxWidth: '500px',
                  maxHeight: '90vh',
                  overflow: 'auto'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                  }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0
                    }}>
                      {t('profileAddNewCard') || 'Добавить новую карту'}
                    </h3>
                    <button
                      onClick={() => setShowAddCard(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#6B7280'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('profileCardNumber') || 'Номер карты'}
                    </label>
                    <input
                      type="text"
                      value={editPayment.card_number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setEditPayment(prev => ({...prev, card_number: value}));
                      }}
                      placeholder="1234 5678 9123 4567"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('profileCardHolder') || 'Владелец карты'}
                    </label>
                    <input
                      type="text"
                      value={editPayment.card_holder}
                      onChange={(e) => setEditPayment(prev => ({...prev, card_holder: e.target.value}))}
                      placeholder="JOHN DOE"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      {t('profileCardType') || 'Тип карты'}
                    </label>
                    <select
                      value={editPayment.card_type}
                      onChange={(e) => setEditPayment(prev => ({...prev, card_type: e.target.value}))}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontFamily: 'inherit',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="HUMO">HUMO</option>
                      <option value="UZCARD">UZCARD</option>
                      <option value="VISA">VISA</option>
                      <option value="MASTERCARD">MASTERCARD</option>
                    </select>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => setShowAddCard(false)}
                      style={{
                        flex: 1,
                        padding: '12px 24px',
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {t('profileCancel') || 'Отмена'}
                    </button>
                    <button
                      onClick={() => {
                        // Karta saqlash logikasi
                        console.log('Saving card:', editPayment);
                        setShowAddCard(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '12px 24px',
                        backgroundColor: '#8B5CF6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {t('profileSave') || 'Сохранить'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="company-location">
            <div className='company-location-top'>
              <h3>
                Местоположение
              </h3>
            </div>
            <div className='company-location-map'>
              <YandexMap lat={profArr[0]?.location?.lat} long={profArr[0]?.location?.long} />
            </div>
            <div className='company-location-bottom'>
              <div className='company-location-address'>
                <img src="/images/markerMap.png" alt="" />
                <p>
                  ул. Мустакиллик, 12, Ташкент
                </p>
              </div>
              <div className='company-location-navigate'>
                <img src="/images/navigateMap.png" alt="" />
                <p>
                  ст. метро: Мустакиллик майдони
                </p>
              </div>
            </div>
          </div>
          <div className="company-clients">
            <h3>
              Постоянные клиенты
            </h3>
            <div>
              {
                profArr[0]?.top_clients?.length > 0
                  ?
                  profArr[0]?.top_clients?.map((item, index) => {
                    return (
                      <div className='company-clients-card' key={index}>
                        <img src="/images/customerImage.png" alt="" className='top-client-image' />
                        <div className='company-clients-card-info'>
                          <img src="/images/profileTopClient.png" alt="" />
                          <p>
                            {item.name}
                          </p>
                          <img src="/images/callingBlackIcon.png" alt="" />
                          <a href="">
                            {item.phone}
                          </a>
                          <img src="/images/visitsIcon.png" alt="" />
                          <p>
                            {item.visits} посещений
                          </p>
                        </div>
                      </div>
                    )
                  })
                  :
                  <div>
                    <img
                      src="/images/noClientsImg.png"
                      style={{
                        margin: "10vh auto 2vh auto",
                        width: "7vw"
                      }}
                      alt=""
                    />
                    <p style={{ color: "#A8A8B3", textAlign: "center", fontSize: "1vw" }}>
                      Постоянных клиентов пока что нет
                    </p>
                  </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  )
  }
}

export default Profile