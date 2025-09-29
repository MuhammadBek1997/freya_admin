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

  const [changeMode, setChangeMode] = useState(false)
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
    phone_number: '',
    card_type: 'HUMO'
  })
  const [showAddCard, setShowAddCard] = useState(false)

  // SMS verifikatsiya uchun state
  const [smsCode, setSmsCode] = useState('')
  const [isSmsSent, setIsSmsSent] = useState(false)
  const [smsLoading, setSmsLoading] = useState(false)
  const [isSmsVerified, setIsSmsVerified] = useState(false)
  const [smsError, setSmsError] = useState('')
  const [cardPhoneNumber, setCardPhoneNumber] = useState('')

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

  // profArr yuklanganda editPayment state'ini database ma'lumotlari bilan to'ldirish
  useEffect(() => {
    if (profArr && profArr.length > 0 && profArr[0]?.paymentSystem) {
      const paymentData = profArr[0].paymentSystem;
      setEditPayment({
        card_number: paymentData.card_number || '',
        phone_number: paymentData.phone_number || '',
        card_type: paymentData.card_type || 'HUMO'
      });
    }
  }, [profArr]);

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

  // Telefon raqamiga SMS yuborish
  const sendSmsToPhone = async (phoneNumber) => {
    if (!phoneNumber) return

    setSmsLoading(true)
    try {
      // SMS yuborish API'sini chaqirish
      const token = localStorage.getItem('authToken')
      const response = await fetch('https://freya-salon-backend-cc373ce6622a.herokuapp.com/api/admin/send-sms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber.replace(/\s/g, '').replace(/\D/g, '') // Faqat raqamlarni qoldirish
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCardPhoneNumber(data.phone)
        setIsSmsSent(true)
        
        // Muvaffaqiyatli xabar
        alert(`SMS kod yuborildi: ${data.phone}`)
        console.log(`SMS kod yuborildi: ${data.phone}`)
        
        // Test uchun verification code'ni console'ga chiqarish
        if (data.verificationCode) {
          console.log(`Test uchun SMS kod: ${data.verificationCode}`)
        }
      } else {
        // Xatolik holatini ko'rsatish
        const errorMessage = data.message || 'SMS yuborishda xatolik'
        alert(errorMessage)
        console.error('SMS yuborishda xatolik:', errorMessage)
      }
    } catch (error) {
      console.error('SMS yuborishda xatolik:', error)
      alert('SMS yuborishda xatolik yuz berdi')
    } finally {
      setSmsLoading(false)
    }
  }

  // SMS kodni tasdiqlash
  const handleVerifySms = async () => {
    if (!smsCode || smsCode.length !== 6) {
      alert('SMS kodni to\'liq kiriting (6 ta raqam)')
      return
    }

    if (!editPayment.card_number || !editPayment.phone_number || !editPayment.card_type) {
      alert('Barcha ma\'lumotlarni to\'ldiring')
      return
    }

    setSmsLoading(true)
    try {
      // SMS kodni tasdiqlash API'sini chaqirish
      const token = localStorage.getItem('authToken')
      const response = await fetch('https://freya-salon-backend-cc373ce6622a.herokuapp.com/api/admin/verify-sms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_number: editPayment.card_number.replace(/\s/g, '').replace(/\D/g, ''),
          sms_code: smsCode,
          phone_number: editPayment.phone_number.replace(/\s/g, '').replace(/\D/g, ''),
          card_type: editPayment.card_type
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('Karta muvaffaqiyatli qo\'shildi va tasdiqlandi!')
        
        // SMS tasdiqlandi deb belgilash
        setIsSmsVerified(true)
        
        // Avtomatik save - karta allaqachon API orqali saqlangan
        console.log('Card automatically saved:', data.card_data);
        
        // State'larni tozalash
        setSmsCode('')
        setIsSmsSent(false)
        setCardPhoneNumber('')
        setSmsError('')
        setEditPayment({
          card_number: '',
          phone_number: '',
          card_type: 'HUMO'
        })
        setShowAddCard(false)
        
        // Salon ma'lumotlarini qayta yuklash
        await fetchAdminSalon()
      } else {
        setSmsError(data.message || 'SMS kod noto\'g\'ri')
      }
    } catch (error) {
      console.error('SMS tasdiqlashda xatolik:', error)
      setSmsError('Tasdiqlashda xatolik yuz berdi')
    } finally {
      setSmsLoading(false)
    }
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

  if (!changeMode) {
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
            <div className='profile-nav-lang' style={{ marginRight: "-45vw", width: "20vw", gap: "0.3vw" }}>
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
                            className={`w-3 h-3 rounded-full transition-all ${index === currentSlide
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
                  {getSalonData(profArr[0], 'salon_title') == "" ? t('profileTitle2') : getSalonData(profArr[0], 'salon_title')}
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
                          textDecoration: "underline"
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
                      profArr[0]?.salon_additionals?.map((item, index) => {
                        return (
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
                      {profArr[0]?.paymentSystem?.card_number ? (
                        <>
                          <span>
                            {profArr[0].paymentSystem.card_number.replace(/\s/g, '').slice(0, 4)}
                          </span>
                          <span>
                            {' **** **** '}
                          </span>
                          <span>
                            {profArr[0].paymentSystem.card_number.replace(/\s/g, '').slice(-4)}
                          </span>
                        </>
                      ) : (
                        <span>**** **** **** ****</span>
                      )}
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
  } else {
    return (
      <section>
        <nav className='profile-nav' style={{ height: "10vh" }}>
          <div className='profile-nav-top' style={{ height: "10vh" }}>
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
        <div className='profile-body' style={{ paddingTop: "12vh" }}>
          <div className="profile-body-left">
            <div className="company-data" style={{ minHeight: "70vh" }}>
              <div className={getSalonData(profArr[0], 'salon_title') == "" ? 'company-title-empty' : 'company-title-full'}>
                {/* <img src="/images/titleIcon.png" alt="" /> */}
                <h3>
                  {getSalonData(profArr[0], 'salon_title') == "" ? t('profileTitle2') : getSalonData(profArr[0], 'salon_title')}
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
                          textDecoration: "underline"
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
                      profArr[0]?.salon_additionals?.map((item, index) => {
                        return (
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
                    onChange={(e) => setEditSale({ ...editSale, amount: e.target.value })}
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
                    onChange={(e) => setEditSale({ ...editSale, date: e.target.value })}
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
                        onChange={(e) => setEditContacts(prev => ({ ...prev, phone1: e.target.value }))}
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
                        onChange={(e) => setEditContacts(prev => ({ ...prev, phone2: e.target.value }))}
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
                      onChange={(e) => setEditContacts(prev => ({ ...prev, instagram: e.target.value }))}
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
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1vh'
                }}>
                  <h5 style={{
                    fontSize: '0.8vw',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0
                  }}>
                    {t('profileAddNewCard') || 'Добавить новую карту'}
                  </h5>
                </div>

                <div style={{ display: 'flex', gap: '1vw' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.7vw',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '1vh'
                    }}>
                      {t('profileCardNumber') || 'Номер карты'}
                    </label>
                    <input
                      type="text"
                      value={editPayment.card_number}
                      onChange={(e) => {
                        // Bo'shliqlarni va raqam bo'lmagan belgilarni olib tashlash
                        const cleanValue = e.target.value.replace(/\s/g, '').replace(/\D/g, '').slice(0, 16);
                        
                        // 4 ta raqamdan keyin bo'shliq qo'yish (ko'rsatish uchun)
                        const formattedValue = cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ');
                        
                        // Yangi karta raqami kiritilganda SMS state'larni tozalash
                        if (cleanValue.length < 16) {
                          setIsSmsSent(false);
                          setIsSmsVerified(false);
                          setSmsCode('');
                          setSmsError('');
                          setCardPhoneNumber('');
                        }
                        
                        setEditPayment(prev => ({ ...prev, card_number: formattedValue }));
                      }}
                      placeholder={profArr[0]?.paymentSystem?.card_number || "1234 5678 9123 4567"}
                      disabled={smsLoading}
                      style={{
                        width: '100%',
                        backgroundColor: smsLoading ? '#f5f5f5' : 'white',
                        padding: '12px 16px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1vh' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.7vw',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '1vh'
                    }}>
                      {t('profilePhoneNumber') || 'Telefon raqami'}
                    </label>
                    <input
                      type="tel"
                      value={editPayment.phone_number}
                      onChange={(e) => {
                        // Telefon raqami formatini tekshirish
                        const cleanValue = e.target.value.replace(/\D/g, '');
                        let formattedValue = cleanValue;
                        
                        // +998 bilan boshlash
                        if (cleanValue.length > 0 && !cleanValue.startsWith('998')) {
                          if (cleanValue.startsWith('9')) {
                            formattedValue = '998' + cleanValue;
                          } else {
                            formattedValue = '998' + cleanValue;
                          }
                        }
                        
                        // Maksimal uzunlik 12 (998 + 9 raqam)
                        if (formattedValue.length > 12) {
                          formattedValue = formattedValue.slice(0, 12);
                        }
                        
                        // Format: +998 XX XXX XX XX
                        if (formattedValue.length >= 3) {
                          const formatted = '+' + formattedValue.slice(0, 3) + 
                            (formattedValue.length > 3 ? ' ' + formattedValue.slice(3, 5) : '') +
                            (formattedValue.length > 5 ? ' ' + formattedValue.slice(5, 8) : '') +
                            (formattedValue.length > 8 ? ' ' + formattedValue.slice(8, 10) : '') +
                            (formattedValue.length > 10 ? ' ' + formattedValue.slice(10, 12) : '');
                          setEditPayment(prev => ({ ...prev, phone_number: formatted }));
                        } else {
                          setEditPayment(prev => ({ ...prev, phone_number: formattedValue }));
                        }
                        
                        // SMS state'larni tozalash
                        setIsSmsSent(false);
                        setIsSmsVerified(false);
                        setSmsCode('');
                        setSmsError('');
                        setCardPhoneNumber('');
                      }}
                      placeholder={profArr[0]?.paymentSystem?.phone_number || "+998 XX XXX XX XX"}
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

                  <div style={{ marginBottom: '1vh' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.7vw',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '1vh'
                    }}>
                      {t('profileCardType') || 'Тип карты'}
                    </label>
                    <select
                      value={editPayment.card_type}
                      onChange={(e) => setEditPayment(prev => ({ ...prev, card_type: e.target.value }))}
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
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px'
                }}>

                  <button
                    onClick={() => {
                      if (!isSmsVerified) {
                        alert('Avval SMS orqali kartani tasdiqlang!')
                        return
                      }
                      // Karta saqlash logikasi
                      console.log('Saving card:', editPayment);
                      setShowAddCard(false);
                    }}
                    disabled={!isSmsVerified}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: !isSmsVerified ? '#ccc' : '#9C2BFF',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: !isSmsVerified ? 'not-allowed' : 'pointer',
                      opacity: !isSmsVerified ? 0.6 : 1
                    }}
                  >
                    {t('profileSave') || 'Изменить'}
                  </button>
                </div>
              </div>
              {
                
              }
              <div className="payment-system" style={{ marginTop: "1vw" , height:"12vh" , paddingTop:"1vh" }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom:"1vh"
                }}>
                  <h5 style={{
                    fontSize: '0.8vw',
                    fontWeight: '600',
                    color: '#111827',
                    margin: 0
                  }}>
                    {t('profileAcceptCard') || 'Подтвердить карту'}
                  </h5>
                </div>
                {smsLoading && (
                  <div style={{ marginBottom: '1vh' }}>
                    <p style={{
                      fontSize: '0.7vw',
                      color: '#9C2BFF',
                      marginBottom: '1vh',
                      fontWeight: '500'
                    }}>
                      📱 Telefon raqami qidirilmoqda va SMS yuborilmoqda...
                    </p>
                  </div>
                )}
                {isSmsSent && !smsLoading && (
                  <div style={{ marginBottom: '1vh' }}>
                    <p style={{
                      fontSize: '0.7vw',
                      color: '#10B981',
                      marginBottom: '1vh',
                      fontWeight: '500'
                    }}>
                      ✅ SMS kod yuborildi: {cardPhoneNumber}
                    </p>
                  </div>
                )}
                
                {smsError && (
                  <div style={{ marginBottom: '1vh' }}>
                    <p style={{
                      fontSize: '0.7vw',
                      color: '#EF4444',
                      marginBottom: '1vh',
                      fontWeight: '500'
                    }}>
                      ❌ {smsError}
                    </p>
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  gap: '1vw'
                }}>
                  <input 
                    type="text" 
                    placeholder={isSmsSent ? 'SMS kodni kiriting (6 ta raqam)' : '******'}
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={!isSmsSent}
                    style={{
                      width:"25%",
                      padding: '12px 16px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      backgroundColor: !isSmsSent ? '#f5f5f5' : 'white'
                    }} 
                  />
                  <button 
                    onClick={() => {
                      setSmsError('') // Xatolikni tozalash
                      
                      // Agar SMS yuborilmagan bo'lsa, avval SMS yuborish
                      if (!isSmsSent) {
                        const cleanPhone = editPayment.phone_number.replace(/\s/g, '').replace(/\D/g, '');
                        if (cleanPhone.length === 12 && cleanPhone.startsWith('998')) {
                          sendSmsToPhone(editPayment.phone_number);
                        } else {
                          alert('To\'liq telefon raqamini kiriting');
                        }
                      } else {
                        // SMS yuborilgan bo'lsa, tasdiqlash
                        handleVerifySms()
                      }
                    }}
                    disabled={smsLoading || (!editPayment.phone_number && !isSmsSent) || (isSmsSent && smsCode.length !== 6)}
                    style={{
                      width:"74%",
                      padding: '12px 24px',
                      backgroundColor: (smsLoading || (!editPayment.phone_number && !isSmsSent) || (isSmsSent && smsCode.length !== 6)) ? '#ccc' : '#9C2BFF',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: (smsLoading || (!editPayment.phone_number && !isSmsSent) || (isSmsSent && smsCode.length !== 6)) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {smsLoading ? 'Yuborilmoqda...' : 
                     !isSmsSent ? 'SMS yuborish' : 
                     smsError ? 'Qayta urinish' : 'Tasdiqlash'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
    )
  }
}

export default Profile