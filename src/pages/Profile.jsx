import React, { useEffect, useState, useRef } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { UseGlobalContext } from '../Context'
import YandexMap from '../components/YandexMap'
import ReadMoreReact from 'read-more-react';
import { smsUrl } from '../apiUrls';
import { getAuthToken } from '../Context';


const Profile = () => {

  const {
    t, language, handleChange, salonProfile, commentsArr, user,
    adminSalonLoading, adminSalonError, fetchAdminSalon, updateSalon,
    uploadSalonPhotos, deleteSalonPhoto, logout, uploadSalonLogo
  } = UseGlobalContext()

  const [changeMode, setChangeMode] = useState(false)
  const [editDescription, setEditDescription] = useState('')
  const [editAdditionals, setEditAdditionals] = useState('')
  const [editComfort, setEditComfort] = useState([])
  const [editSale, setEditSale] = useState({ amount: '', date: '' })
  const [currentSale, setCurrentSale] = useState({ amount: '', date: '' })

  // Salon asosiy ma'lumotlari uchun state
  const [editSalonName, setEditSalonName] = useState('')
  const [editWorkHours, setEditWorkHours] = useState('')
  const [editWorkDates, setEditWorkDates] = useState('')
  const [editSalonType, setEditSalonType] = useState('')
  const [editSalonFormat, setEditSalonFormat] = useState('corporative')

  // Rasmlar uchun ref va state'lar
  const imageListRef = useRef(null)
  const fileInputRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [companyImages, setCompanyImages] = useState([])
  const [pendingImages, setPendingImages] = useState([])
  const [pendingLogo, setPendingLogo] = useState(null)

  // Faylni base64 ga o‘tkazish yordamchisi (logo/photos uchun)
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Carousel uchun state
  const [currentSlide, setCurrentSlide] = useState(0)

  // Salon profilidagi mavjud rasmlarni UI ga sync qilish
  useEffect(() => {
    if (Array.isArray(salonProfile?.salon_photos)) {
      setCompanyImages(salonProfile.salon_photos)
    }
  }, [salonProfile])

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

  // Formik/Yup: profil tahrir formasi uchun validatsiya va boshlang'ich qiymatlar
  const profileValidationSchema = Yup.object({
    salon_name: Yup.string().min(2, t('validation.min2')).max(100, t('validation.max100')).required(t('validation.required')),
    work_hours: Yup.string().max(100, t('validation.max100')),
    work_dates: Yup.string().max(100, t('validation.max100')),
    salon_type: Yup.string().required(t('validation.required')),
    salon_format: Yup.string().required(t('validation.required')),
  })

  const getInitialFormValues = (sp) => {
    const types = sp?.salon_types || []
    const initialType = Array.isArray(types)
      ? (types.find(t => t?.selected)?.type || types[0]?.type || '')
      : ''
    const format = sp?.salon_format?.format || 'corporative'
    const hours = sp?.work_schedule?.hours ?? sp?.work_schedule?.working_hours ?? ''
    const dates = sp?.work_schedule?.dates ?? sp?.work_schedule?.working_days ?? ''
    const name = getSalonData(sp, 'salon_name') || sp?.name || ''
    return {
      salon_name: name,
      work_hours: hours,
      work_dates: dates,
      salon_type: initialType,
      salon_format: format,
    }
  }

  const submitProfileForm = () => {
    const form = document.getElementById('profile-edit-form')
    if (form) form.requestSubmit()
  }

  // Faqat salonning matn maydonlarini (rasm yuksiz) saqlash
  const saveSalonInfoOnly = async () => {
    if (!salonProfile) return;
    try {
      const salonId = salonProfile.id;
      const updateData = {};

      if (editSalonName !== '') {
        // Asosiy va tilga xos maydonlarni birga yuboramiz
        updateData['salon_name'] = editSalonName;
        updateData[`salon_name_${language}`] = editSalonName;
      }
      if (editDescription !== '') updateData['salon_description'] = editDescription;
      if (editAdditionals !== '') {
        const additionalsArray = editAdditionals.split('\n').filter(item => item.trim() !== '');
        updateData['salon_additionals'] = additionalsArray;
      }
      if (editComfort.length > 0) updateData['salon_comfort'] = editComfort;
      if (editSale.amount !== '' || editSale.date !== '') {
        updateData['salon_sale'] = { amount: editSale.amount, date: editSale.date };
      }
      if (editWorkHours !== '' || editWorkDates !== '') {
        updateData['work_schedule'] = { hours: editWorkHours, dates: editWorkDates };
      }
      if (editSalonType && Array.isArray(salonProfile?.salon_types)) {
        const updatedTypes = (salonProfile?.salon_types || []).map(t => ({ ...t, selected: t.type === editSalonType }));
        updateData['salon_types'] = updatedTypes;
      }
      if (editSalonFormat) updateData['salon_format'] = { selected: true, format: editSalonFormat };

      if (Object.keys(updateData).length > 0) {
        await updateSalon(salonId, updateData);
        console.log(t('salonUpdated'));
      }
    } catch (error) {
      console.error('Salon ma\'lumotlarini saqlashda xatolik:', error);
    }
  }

  // Formik submit handler'ini to'g'ri yozish
  const handleFormikSubmit = async (values, { setSubmitting }) => {
    try {
      if (!salonProfile) return;

      const salonId = salonProfile.id;
      const updateData = {};

      // Formik values'dan ma'lumotlarni olish
      if (values.salon_name && values.salon_name !== getSalonData(salonProfile, 'salon_name')) {
        updateData['salon_name'] = values.salon_name;
        updateData[`salon_name_${language}`] = values.salon_name;
      }

      if (values.work_hours && values.work_hours !== salonProfile?.work_schedule?.hours) {
        updateData['work_schedule'] = {
          ...salonProfile?.work_schedule,
          hours: values.work_hours,
          dates: values.work_dates || salonProfile?.work_schedule?.dates || ''
        };
      } else if (values.work_dates && values.work_dates !== salonProfile?.work_schedule?.dates) {
        updateData['work_schedule'] = {
          ...salonProfile?.work_schedule,
          hours: values.work_hours || salonProfile?.work_schedule?.hours || '',
          dates: values.work_dates
        };
      }

      if (values.salon_type && Array.isArray(salonProfile?.salon_types)) {
        const currentType = salonProfile?.salon_types?.find(t => t?.selected)?.type;
        if (values.salon_type !== currentType) {
          const updatedTypes = salonProfile.salon_types.map(t => ({
            ...t,
            selected: t.type === values.salon_type
          }));
          updateData['salon_types'] = updatedTypes;
        }
      }

      if (values.salon_format && values.salon_format !== salonProfile?.salon_format?.format) {
        updateData['salon_format'] = { selected: true, format: values.salon_format };
      }

      // Description va boshqa manual state'lar
      if (editDescription && editDescription !== getSalonData(salonProfile, 'salon_description')) {
        updateData['salon_description'] = editDescription;
      }

      if (editAdditionals && editAdditionals !== (salonProfile?.salon_additionals || []).join('\n')) {
        const additionalsArray = editAdditionals.split('\n').filter(item => item.trim() !== '');
        updateData['salon_additionals'] = additionalsArray;
      }

      if (editComfort.length > 0) {
        const comfortChanged = JSON.stringify(editComfort) !== JSON.stringify(salonProfile?.salon_comfort || []);
        if (comfortChanged) {
          updateData['salon_comfort'] = editComfort;
        }
      }

      if (editSale.amount || editSale.date) {
        const saleChanged = (
          editSale.amount !== (salonProfile?.salon_sale?.amount || '') ||
          editSale.date !== (salonProfile?.salon_sale?.date || '')
        );
        if (saleChanged) {
          updateData['salon_sale'] = {
            amount: editSale.amount,
            date: editSale.date
          };
        }
      }

      console.log('=== UPDATE DEBUG ===');
      console.log('Salon ID:', salonId);
      console.log('Update Data:', updateData);

      // Matn ma'lumotlarini yangilash
      if (Object.keys(updateData).length > 0) {
        console.log('Sending update request...');
        const result = await updateSalon(salonId, updateData);
        console.log('Update result:', result);
      }

      const maxBytes = 4 * 1024 * 1024;

      // Logo yuklash (alohida)
      if (pendingLogo?.file) {
        if (pendingLogo.file.size > maxBytes) {
          alert(t('logoTooLarge'));
          setSubmitting(false);
          return;
        }
        console.log('Uploading logo...');
        await uploadSalonLogo(salonId, pendingLogo.file);

        if (pendingLogo?.preview) URL.revokeObjectURL(pendingLogo.preview);
        setPendingLogo(null);
        console.log(t('imagesUploaded'));
      }

      // Photos yuklash (alohida)
      if (pendingImages.length > 0) {
        const validImages = pendingImages.filter(img => img?.file && img.file.size <= maxBytes);

        if (validImages.length > 0) {
          const photoFiles = validImages.map(img => img.file);
          console.log('Uploading', photoFiles.length, 'photos...');
          await uploadSalonPhotos(salonId, photoFiles);

          pendingImages.forEach(img => img?.preview && URL.revokeObjectURL(img.preview));
          setPendingImages([]);
          console.log(t('imagesUploaded'));
        }
      }

      // Salonni qayta yuklash
      await fetchAdminSalon(salonId);

      // Edit mode'dan chiqish
      setChangeMode(false);
      setEditDescription('');
      setEditAdditionals('');
      setEditComfort([]);
      setEditSale({ amount: '', date: '' });

    } catch (error) {
      console.error('=== UPDATE ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
    } finally {
      setSubmitting(false);
    }
  };

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

    // Agar salonProfile bo'sh bo'lsa, ma'lumotlarni yuklash
    if (!salonProfile) {
      loadAdminSalon();
    }
  }, []);

  // salonProfile yuklanganda editPayment state'ini database ma'lumotlari bilan to'ldirish
  useEffect(() => {
    if (salonProfile?.paymentSystem) {
      const paymentData = salonProfile.paymentSystem;
      setEditPayment({
        card_number: paymentData.card_number || '',
        phone_number: paymentData.phone_number || '',
        card_type: paymentData.card_type || 'HUMO'
      });
    }
  }, [salonProfile]);

  // Edit mode ga kirganda current ma'lumotlarni yuklash
  useEffect(() => {
    if (changeMode && salonProfile) {
      const currentDescription = getSalonData(salonProfile, 'salon_description');
      const currentAdditionals = salonProfile?.salon_additionals || [];
      const currentComfort = salonProfile?.salon_comfort || [];
      const currentSaleData = salonProfile?.salon_sale || { amount: '', date: '' };

      // Asosiy maydonlarni edit uchun to'ldirish
      const currentName = getSalonData(salonProfile, 'salon_name');
      const currentSchedule = salonProfile?.work_schedule || {};
      const currentTypes = salonProfile?.salon_types || [];
      const selectedType = Array.isArray(currentTypes)
        ? (currentTypes.find(t => t.selected)?.type || '')
        : '';
      const currentFormat = (salonProfile?.salon_format && salonProfile?.salon_format.format) || 'corporative';

      setEditDescription(currentDescription);
      setEditAdditionals(Array.isArray(currentAdditionals) ? currentAdditionals.join('\n') : '');
      setEditComfort([...currentComfort]); // Deep copy qilish
      setEditSale({ ...currentSaleData });

      setEditSalonName(currentName || '');
      setEditWorkHours(currentSchedule?.hours || '');
      setEditWorkDates(currentSchedule?.dates || '');
      setEditSalonType(selectedType);
      setEditSalonFormat(currentFormat);
    }
  }, [changeMode, salonProfile, language]);

  // currentSale ni yuklash
  useEffect(() => {
    if (salonProfile) {
      const saleData = salonProfile?.salon_sale || { amount: '', date: '' };
      setCurrentSale({ ...saleData });

      // Salon photos ni yuklash
      const images = salonProfile?.photos || salonProfile?.salon_photos || [];
      setCompanyImages(Array.isArray(images) ? images : []);
    }
  }, [salonProfile]);

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



  const goToSlide = (index) => {
    const totalImages = companyImages.length + pendingImages.length;
    if (index >= 0 && index < totalImages) {
      setCurrentSlide(index);
    }
  };

  // Rasm yuklash funksiyasi (faqat preview uchun)
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    // Client-side tekshiruv: faqat image va <= 4MB
    const maxBytes = 4 * 1024 * 1024
    const validImages = files.filter(f => f && f.type && f.type.startsWith('image/') && f.size <= maxBytes)
    if (validImages.length < files.length) {
      alert(t('onlyImageAndSmallFiles'))
    }

    // Fayllarni preview uchun URL yaratish
    const newImagePreviews = validImages.map(file => ({ file, preview: URL.createObjectURL(file) }))

    // Pending images ga qo'shish
    setPendingImages(prev => [...prev, ...newImagePreviews])

    // Input ni tozalash
    try { event.target.value = '' } catch { }
  };

  // Rasmni o'chirish funksiyasi
  const handleDeleteImage = async (index) => {
    if (!window.confirm(t('confirmDeleteImage'))) {
      return;
    }

    const totalExistingImages = companyImages.length;

    if (index < totalExistingImages) {
      // Mavjud rasmni serverdan o'chirish
      if (!salonProfile) {
        alert(t('salonDataNotLoaded'));
        return;
      }

      const salonId = salonProfile.id;

      try {
        // Serverdan o'chirish (index ni yuborish)
        const result = await deleteSalonPhoto(salonId, index);
        console.log('Photo deleted successfully:', result);

        // Local state ni yangilash (server javobidan)
        const deletedImages = result?.photos || result?.salon_photos || [];
        setCompanyImages(Array.isArray(deletedImages) ? deletedImages : []);

        alert(t('imageDeleted'));
      } catch (error) {
        console.error('Error deleting photo:', error);
        alert(t('imageDeleteError') + error.message);
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
    if (!salonProfile) return;

    try {
      const salonId = salonProfile.id;
      const updateData = {};

      // Asosiy ma'lumotlarni yangilash (bazaviy maydonlar)
      // Tarjima xizmati bazaviy maydonlardan barcha tillar uchun yangilaydi
      if (editSalonName !== '') {
        updateData['salon_name'] = editSalonName;
      }

      if (editDescription !== '') {
        updateData['salon_description'] = editDescription;
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

      // Ish vaqti / Ish kunlari (work_schedule) yangilash
      if (editWorkHours !== '' || editWorkDates !== '') {
        updateData['work_schedule'] = {
          hours: editWorkHours,
          dates: editWorkDates
        };
      }

      // Salon turi (salon_types) yangilash — tanlangan bitta turga selected=true
      if (editSalonType && Array.isArray(salonProfile?.salon_types)) {
        const updatedTypes = (salonProfile?.salon_types || []).map(t => ({
          ...t,
          selected: t.type === editSalonType
        }));
        updateData['salon_types'] = updatedTypes;
      }

      // Salon format (salon_format) yangilash
      if (editSalonFormat) {
        updateData['salon_format'] = { selected: true, format: editSalonFormat };
      }

      // Fayl hajmini tekshirish (<= 4MB)
      const maxBytes = 4 * 1024 * 1024;
      if (pendingLogo?.file && pendingLogo.file.size > maxBytes) {
        alert(t('logoTooLarge'));
        return;
      }
      const tooLargePhoto = pendingImages.find(img => img?.file?.size > maxBytes);
      if (tooLargePhoto) {
        alert(t('someImagesTooLarge'));
        return;
      }
      // Avval matn ma'lumotlarini yangilash
      if (Object.keys(updateData).length > 0) {
        await updateSalon(salonId, updateData);
        console.log(t('salonUpdated'));
      }

      // Keyin rasmlarni alohida endpoint orqali yuklaymiz (agar bor bo'lsa)
      const filesToUpload = [];
      if (pendingLogo?.file) filesToUpload.push(pendingLogo.file);
      if (pendingImages.length > 0) {
        pendingImages.forEach(img => { if (img?.file) filesToUpload.push(img.file); });
      }
      if (filesToUpload.length > 0) {
        const uploaded = await uploadSalonPhotos(salonId, filesToUpload);
        const freshImages = uploaded?.photos || uploaded?.salon_photos || (Array.isArray(uploaded) ? uploaded : []);
        setCompanyImages(Array.isArray(freshImages) ? freshImages : []);
        console.log(t('imagesUploaded'));
        // Pending previewlarni tozalash
        if (pendingLogo?.preview) URL.revokeObjectURL(pendingLogo.preview);
        pendingImages.forEach(img => img?.preview && URL.revokeObjectURL(img.preview));
        setPendingLogo(null);
        setPendingImages([]);
      }

      // Edit mode dan chiqish
      setChangeMode(false);

      // Edit state larni tozalash
      setEditDescription('');
      setEditAdditionals('');
      setEditComfort([]);
      setEditSale({ amount: '', date: '' });
      setEditSalonName('');
      setEditWorkHours('');
      setEditWorkDates('');
      setEditSalonType('');
      setEditSalonFormat('corporative');
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
      const response = await fetch(`${smsUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
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
        alert(t('smsCodeSent', { phone: data.phone }))
        console.log(t('smsCodeSent', { phone: data.phone }))

        // Test uchun verification code'ni console'ga chiqarish
        if (data.verificationCode) {
          console.log(t('testSmsCode', { code: data.verificationCode }))
        }
      } else {
        // Xatolik holatini ko'rsatish
        const errorMessage = data.message || t('smsSendError')
        alert(errorMessage)
        console.error('SMS yuborishda xatolik:', errorMessage)
      }
    } catch (error) {
      console.error('SMS yuborishda xatolik:', error)
      alert(t('smsSendError'))
    } finally {
      setSmsLoading(false)
    }
  }

  // SMS kodni tasdiqlash
  const handleVerifySms = async () => {
    if (!smsCode || smsCode.length !== 6) {
      alert(t('smsCodeInvalidLength'))
      return
    }

    if (!editPayment.card_number || !editPayment.phone_number || !editPayment.card_type) {
      alert(t('fillAllFields'))
      return
    }

    setSmsLoading(true)
    try {
      // SMS kodni tasdiqlash API'sini chaqirish
      const response = await fetch(`${smsUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
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
        alert(t('cardAddedSuccessfully'))

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
        setSmsError(data.message || t('smsCodeIncorrect'))
      }
    } catch (error) {
      console.error('SMS tasdiqlashda xatolik:', error)
      setSmsError(t('verificationError'))
    } finally {
      setSmsLoading(false)
    }
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
        <p>{t('errorOccurred')}{adminSalonError}</p>
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
          {t('retryAttempt')}
        </button>
      </div>
    );
  }

  // Loading holatini ko'rsatish
  if (adminSalonLoading) {
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

  // Data hali tayyor bo'lmasa, loading holatini saqlab turamiz (minimal o'zgarish)
  if (!salonProfile) {
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

  let salonComments = commentsArr.filter(item => item.salon == salonProfile?.id)

  console.log(salonProfile);


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
            <div className='profile-nav-lang' style={{ marginRight: "-40vw", width: "20vw", gap: "0.3vw" }}>
              <img src="/images/globusGray.png" alt="" className='globus' />
              <select value={language} onChange={handleChange}>
                <option value="ru">RU</option>
                <option value="uz">UZ</option>
                <option value="en">EN</option>
              </select>
              <img src="/images/Arrow.png" alt="Arrow" className='arrow' />
            </div>
            <button onClick={() => {
              logout()
              window.location.href = '/login'
            }}
              style={{
                padding: '0.2vw 3vw',
                backgroundColor: '#FF0000',
                color: 'white',
                border: 'none',
                borderRadius: '0.5vw',
                cursor: 'pointer'

              }}>
              {t('profileLogout')}
            </button>
          </div>
          <div className='profile-nav-bottom'>
            <div className="profile-nav-left">
              {(() => {
                const staged = pendingLogo?.preview || null;
                // ✅ Logo ni to'g'ri joydan olish
                const currentLogo = !staged ? (salonProfile?.icon || salonProfile?.logo) : null;

                if (staged) {
                  return (
                    <div className='company-image' style={{
                backgroundImage: `url(${staged})`,
                backgroundSize: (salonProfile.icon || (companyImages && companyImages[0])) ? "cover" : "30%",
                backgroundPosition: "center center",
                backgroundRepeat: "no-repeat"
              }}>

              </div>
                  )
                }
                // return <img src={staged} alt="Yangi logo (saqlanmagan)" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                if (currentLogo) {
                  return(
                    <div className='company-image' style={{
                backgroundImage:  `url(${currentLogo})`,
                backgroundSize: (salonProfile.icon || (companyImages && companyImages[0])) ? "cover" : "30%",
                backgroundPosition: "center center",
                backgroundRepeat: "no-repeat"
              }}>

              </div>
                  )
                }
                // return <img src={currentLogo} alt="Salon logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                return (
                  <div className='company-image' style={{
                backgroundImage: `url(/images/ForCompanyImage.png)`,
                backgroundSize: (salonProfile.icon || (companyImages && companyImages[0])) ? "cover" : "30%",
                backgroundPosition: "center center",
                backgroundRepeat: "no-repeat"
              }}>

              </div>
                )
              })()}
              <div className='profile-nav-info'>
                <div className='profile-salon-name'>
                  <h2>
                    {getSalonData(salonProfile, 'salon_name') || salonProfile.name}
                  </h2>
                  {changeMode ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={handleSave} style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                        <img src="/images/editPen.png" alt="" />
                        {t('save')}
                      </button>
                      <button onClick={() => {
                        setChangeMode(false)
                        setEditDescription('')
                        setEditAdditionals('')
                        setEditComfort([])
                        setEditSale({ amount: '', date: '' })
                      }} style={{ backgroundColor: '#f44336', color: 'white' }}>
                        {t('cancel')}
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
                    style={{ '--rating': salonProfile.rating }}
                    aria-label={`Rating: ${salonProfile.rating} out of 5 stars`}
                  >
                  </div>
                  <p>
                    {salonProfile.rating} ({salonComments.length} {t('profileReviews')} )
                  </p>
                </div>
                <div className='profile-salon-sale'>
                  
                  {salonProfile.salon_sale 
                  &&
                  <div className='profile-salon-salecount'>
                      <p>
                        {t("sale")}{salonProfile.salon_sale}%
                      </p>
                  </div>}
                  
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
              <div className={getSalonData(salonProfile, 'salon_name') == "" ? 'company-title-empty' : 'company-title-full'}>
                <img src="/images/titleIcon.png" alt="" />
                <h3>
                  {getSalonData(salonProfile, 'salon_name') == "" ? t('profileTitle2') : getSalonData(salonProfile, 'salon_name')}
                </h3>
              </div>
              <div className='company-about'>
                <h3>
                  {t('profileAbout')}
                </h3>
                <div className={getSalonData(salonProfile, 'salon_description') == "" ? 'empty' : 'info'}>
                  {changeMode ? (
                    <textarea
                      value={editDescription ?? ''}
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
                    getSalonData(salonProfile, 'salon_description') == ""
                      ?
                      t('profileEmpty')
                      :
                      <ReadMoreReact
                        text={getSalonData(salonProfile, 'salon_description')}
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
                <div className={salonProfile?.salon_additionals?.length == 0 ? 'empty' : 'info'}>
                  {changeMode ? (
                    <textarea
                      value={editAdditionals ?? ''}
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
                    salonProfile?.salon_additionals?.length == 0
                      ?
                      t('profileEmpty')
                      :
                      salonProfile?.salon_additionals?.map((item, index) => {
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
                    salonProfile?.salon_phone && (
                      <div className='company-number-card'>
                        <img src="/images/callIcon.png" alt="" />
                        <a href={`tel:${salonProfile.salon_phone}`}>
                          {salonProfile.salon_phone}
                        </a>
                      </div>
                    )
                  }
                  {
                    salonProfile?.salon_add_phone && (
                      <div className='company-number-card'>
                        <img src="/images/callIcon.png" alt="" />
                        <a href={`tel:${salonProfile.salon_add_phone}`}>
                          {salonProfile.salon_add_phone}
                        </a>
                      </div>
                    )
                  }
                </div>
              </div>
              {currentSale.amount
                ?

                <div className='company-sale'>
                  <div className='company-sale-amount'>
                    <h3>{t('discountPercent')}</h3>
                    <div className='sale-info'>
                      {currentSale?.amount ? `${currentSale.amount}%` : t('saleNotSet')}
                    </div>
                  </div>
                  <div className='company-sale-date'>
                    <h3>{t('validityPeriod')}</h3>
                    <div className='sale-info'>
                      {currentSale?.date ? new Date(currentSale.date).toLocaleDateString('ru-RU') : t('dateNotSet')}
                    </div>
                  </div>
                </div>
                :
                null
              }
              {
                salonProfile?.social_media?.length > 0
                  ?
                  <div className='company-social'>
                    <h3>
                      {t('profileSocial')}
                    </h3>
                    <div className='company-social-list'>
                      {
                        salonProfile?.social_media?.map((item, index) => {
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
                  salonProfile?.salon_comfort?.map((item, index) => {
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
                {t('Mijoz kommentlari')} ({salonComments.length})
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
                      {t('noCommentsYet')}
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
            <div className="company-location">
              <div className='company-location-top'>
                <h3>
                  {t('location')}
                </h3>
              </div>
              <div className='company-location-map'>
                <YandexMap lat={salonProfile?.location?.lat} long={salonProfile?.location?.long} />
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
                {t('regularClients')}
              </h3>
              <div>
                {
                  salonProfile?.top_clients?.length > 0
                    ?
                    salonProfile?.top_clients?.map((item, index) => {
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
                              {item.visits} {t('visits')}
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
                        {t('noRegularClients')}
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
                {t('editProfile')}
              </h2>
            </div>
            <div className="profile-nav-buttons">
              <button
                className='profile-nav-cancel'
                onClick={() => {
                  setChangeMode(false)
                  // Matn maydonlari va selectlar uchun xavfsiz default qiymatlar
                  setEditSalonName(salonProfile?.salon_name ?? '')
                  setEditWorkHours(salonProfile?.work_schedule?.working_hours ?? '')
                  setEditWorkDates(salonProfile?.work_schedule?.working_days ?? '')
                  const initialType = (salonProfile?.salon_types?.find(t => t?.selected)?.type)
                    ?? (salonProfile?.salon_types?.[0]?.type)
                    ?? ''
                  setEditSalonType(initialType)
                  setEditSalonFormat(salonProfile?.salon_format?.format ?? 'corporative')

                  setEditDescription('')
                  setEditAdditionals('')
                  setEditComfort([])
                  setEditSale({ amount: '', date: '' })
                }}>
                {t('cancel')}
              </button>
              <button
                className='profile-nav-save'
                onClick={submitProfileForm}>
                {t('save')}
              </button>
            </div>
          </div>
        </nav>
        <div className='profile-body' style={{ paddingTop: "12vh" }}>
          <div className="profile-body-left">
            <div className='company-logo-change'>
              {/* Salon logo / asosiy rasmni yangilash */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
                <div>
                  <h3 style={{ fontSize: '1vw', marginBottom: '0.5vw' }}>{t('salonLogo')}</h3>
                  <div style={{
                    width: '10vw',
                    height: '10vw',
                    borderRadius: '0.7vw',
                    border: '0.1vw solid #ddd',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fafafa'
                  }}>
                    {(() => {
                      const staged = pendingLogo?.preview || null;
                      const currentLogo = !staged && companyImages && companyImages.length > 0 ? companyImages[0] : null;
                      if (staged) {
                        return <img src={staged} alt="Yangi logo (saqlanmagan)" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      }
                      if (currentLogo && typeof currentLogo === 'string') {
                        return <img src={currentLogo} alt="Salon logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      }
                      return <span style={{ color: '#999' }}>{t('noLogo')}</span>
                    })()}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5vw' }}>
                  <label htmlFor="logoUpload" style={{ fontSize: '0.9vw' }}>{t('selectNewLogo')}</label>
                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      // Admin guard: faqat admin token bilan ruxsat
                      if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'superadmin')) {
                        alert(t('onlyAdminsCanUpload'));
                        e.target.value = '';
                        return;
                      }

                      const file = e.target.files && e.target.files[0];
                      if (!file) return;
                      if (!file.type || !file.type.startsWith('image/')) {
                        alert(t('onlyImageFiles'));
                        e.target.value = '';
                        return;
                      }
                      // Fayl hajmini tekshirish (<= 4MB tavsiya)
                      const maxBytes = 4 * 1024 * 1024;
                      if (file.size > maxBytes) {
                        alert(t('imageTooLarge'));
                        e.target.value = '';
                        return;
                      }
                      // Endi yuklanmaydi: memoga qo'yamiz, saqlashda yuboriladi
                      try {
                        const previewUrl = URL.createObjectURL(file);
                        setPendingLogo(prev => {
                          if (prev?.preview) URL.revokeObjectURL(prev.preview);
                          return { file, preview: previewUrl };
                        });
                        e.target.value = '';
                      } catch (err) {
                        console.error('Logo tayyorlashda xatolik:', err);
                        alert(t('logoPrepareError'));
                        e.target.value = '';
                      }
                    }}
                    style={{ fontSize: '0.9vw' }}
                  />
                </div>
              </div>
            </div>
            <div className="company-data" style={{ minHeight: "70vh" }}>
              <Formik
                initialValues={getInitialFormValues(salonProfile)}
                validationSchema={profileValidationSchema}
                enableReinitialize
                onSubmit={handleFormikSubmit}
              >
                {({ isSubmitting }) => (
                  <Form id='profile-edit-form'>
                    <h3 style={{ fontSize: "1vw", marginBottom: "0.3vw", marginLeft: "1vw", marginTop: "1vw" }}>
                      {t('salonName')}
                    </h3>
                    <Field name='salon_name' type="text" style={{ width: "95%", margin: " 0 0 0 1vw", padding: '0.5vw 1vw', border: '0.1vw solid #ddd', borderRadius: '0.5vw', fontSize: '1.1vw' }} />
                    <div style={{ color: '#d32f2f', marginLeft: '1vw', fontSize: '0.9vw' }}>
                      <ErrorMessage name='salon_name' />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1vw", padding: "1vw" }}>
                      <div>
                        <h3>{t('workHours')}</h3>
                        <Field name='work_hours' type="text" style={{ width: '100%', padding: '0.5vw 1vw', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }} />
                        <div style={{ color: '#d32f2f', fontSize: '0.8vw' }}>
                          <ErrorMessage name='work_hours' />
                        </div>
                      </div>
                      <div>
                        <h3>{t('workDates')}</h3>
                        <Field name='work_dates' type="text" style={{ width: '100%', padding: '0.5vw 1vw', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }} />
                        <div style={{ color: '#d32f2f', fontSize: '0.8vw' }}>
                          <ErrorMessage name='work_dates' />
                        </div>
                      </div>
                      <div>
                        <h3>{t('salonType')}</h3>
                        <Field as='select' name='salon_type' style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}>
                          {salonProfile.salon_types?.map((item, index) => (
                            <option key={index} value={item.type}>
                              {t(`salon_types.${item.type}`) || item.type}
                            </option>
                          ))}
                        </Field>
                        <div style={{ color: '#d32f2f', fontSize: '0.8vw' }}>
                          <ErrorMessage name='salon_type' />
                        </div>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
            <div className={getSalonData(salonProfile, 'salon_name') == "" ? 'company-title-empty' : 'company-title-full'}>
              {/* <img src="/images/titleIcon.png" alt="" /> */}
              <h3>
                {getSalonData(salonProfile, 'salon_name') == "" ? t('profileTitle2') : getSalonData(salonProfile, 'salon_name')}
              </h3>
            </div>
            <div className='company-about'>
              <h3>
                {t('profileAbout')}
              </h3>
              <div className={getSalonData(salonProfile, 'salon_description') == "" ? 'empty' : 'info'}>
                {changeMode ? (
                  <textarea
                    value={editDescription ?? ''}
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
                  getSalonData(salonProfile, 'salon_description') == ""
                    ?
                    t('profileEmpty')
                    :
                    <ReadMoreReact
                      text={getSalonData(salonProfile, 'salon_description')}
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
              <div className={salonProfile?.salon_additionals?.length == 0 ? 'empty' : 'info'}>
                {changeMode ? (
                  <textarea
                    value={editAdditionals ?? ''}
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
                  salonProfile?.salon_additionals?.length == 0
                    ?
                    t('profileEmpty')
                    :
                    salonProfile?.salon_additionals?.map((item, index) => {
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
                <h4>{t('discountPercent')}</h4>
                <input
                  type="text"
                  value={editSale.amount ?? ''}
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
                <h4>{t('validityPeriod')}</h4>
                <input
                  type="text"
                  value={editSale.date ?? ''}
                  onChange={(e) => setEditSale({ ...editSale, date: e.target.value })}
                  placeholder='7 (kun)'
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
          <div className="profile-body-right">
            <div className='profile-images'>
              <h3>{t('companyImages')}</h3>
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
                          <div className='profile-image-pending-badge'>{t('new')}</div>
                        </div>
                      )
                    })
                  }
                  <div className='profile-add-imageBtn' onClick={() => fileInputRef.current?.click()}>
                    <img src="/images/+.png" alt="" />
                    <span>{t('addImage')}</span>
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
                    {companyImages?.length || 0} {t('images')}
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
                      {t('phoneNumber')}
                    </label>
                    {changeMode ? (
                      <input
                        type="text"
                        value={editContacts.phone1 ?? ''}
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
                      {t('secondPhoneOptional')}
                    </label>
                    {changeMode ? (
                      <input
                        type="text"
                        value={editContacts.phone2 ?? ''}
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
                    {t('instagramLink')}
                  </label>
                  {changeMode ? (
                    <input
                      type="text"
                      value={editContacts.instagram ?? ''}
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
            </div>
          </div>
        </div>
      </section>
    )
  }
}

export default Profile