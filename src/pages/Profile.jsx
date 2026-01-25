import React, { useEffect, useState, useRef } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { UseGlobalContext } from '../Context.jsx'
import YandexMap from '../components/YandexMap'
import ReadMoreReact from 'read-more-react';
import { smsUrl } from '../apiUrls';
import { getAuthToken } from '../Context';
import { LocateFixed } from 'lucide-react'


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

  // Map-based address/orientation states
  const [editLocation, setEditLocation] = useState({ lat: '', lng: '' })
  const [editAddress, setEditAddress] = useState({ uz: '', en: '', ru: '' })
  const [editOrientation, setEditOrientation] = useState({ uz: '', en: '', ru: '' })
  const [addressExtra, setAddressExtra] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoPermission, setGeoPermission] = useState(null)
  const [geoMessage, setGeoMessage] = useState('')

  // Helper: descriptiondan bulletlarni ajratib olish
  const extractBulletsFromText = (text) => {
    if (!text || typeof text !== 'string') return [];
    return text
      .split(/\n+/)
      .map(s => s.replace(/^\s*[-•]\s*/, '').trim())
      .filter(Boolean);
  };

  // Helper: additionals bo'sh bo'lsa, descriptiondan hosil qilish
  const getAdditionalsOrDescriptionBullets = (salon) => {
    const add = Array.isArray(salon?.salon_additionals) ? salon.salon_additionals : [];
    if (add.length > 0) return add;
    const desc = getSalonData(salon, 'salon_description');
    return extractBulletsFromText(desc);
  };

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


  // Carousel uchun state
  const [currentSlide, setCurrentSlide] = useState(0)

  // Yandex Geocoder API key (same as in YandexMap.jsx)
  const YANDEX_API_KEY = 'd2eb60ec-8a2a-4032-a07d-2f155cb11f8a'

  const reverseGeocode = async (lon, lat, lang) => {
    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?format=json&apikey=${YANDEX_API_KEY}&lang=${lang}&geocode=${lon},${lat}&results=1`
      const res = await fetch(url)
      const data = await res.json()
      const text = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.metaDataProperty?.GeocoderMetaData?.text || ''
      return text
    } catch (e) {
      console.error('Reverse geocode error:', e)
      return ''
    }
  }

  const nearestMetro = async (lon, lat, lang) => {
    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?format=json&apikey=${YANDEX_API_KEY}&lang=${lang}&geocode=${lon},${lat}&kind=metro&results=1`
      const res = await fetch(url)
      const data = await res.json()
      const name = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.name || ''
      return name
    } catch (e) {
      console.error('Nearest metro fetch error:', e)
      return ''
    }
  }

  const handleMapSelect = async ({ lat, lng }) => {
    setEditLocation({ lat, lng })
    const lon = lng
    try {
      const [ruAddr, enAddr, uzAddr] = await Promise.all([
        reverseGeocode(lon, lat, 'ru_RU'),
        reverseGeocode(lon, lat, 'en_US'),
        reverseGeocode(lon, lat, 'uz_UZ'),
      ])
      setEditAddress({
        ru: ruAddr || '',
        en: (enAddr || ruAddr || ''),
        uz: (uzAddr || ruAddr || ''),
      })

      const [ruMetro, enMetro, uzMetro] = await Promise.all([
        nearestMetro(lon, lat, 'ru_RU'),
        nearestMetro(lon, lat, 'en_US'),
        nearestMetro(lon, lat, 'uz_UZ'),
      ])
      setEditOrientation({
        ru: ruMetro || '',
        en: (enMetro || ruMetro || ''),
        uz: (uzMetro || ruMetro || ''),
      })
    } catch (e) {
      console.error('Map select handling error:', e)
    }
  }

  const checkGeoPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' })
        setGeoPermission(status.state)
        if (typeof status.onchange === 'function') {
          status.onchange = () => setGeoPermission(status.state)
        }
        return status.state
      }
    } catch (e) {
      console.warn('Permissions API not available or failed:', e)
    }
    return null
  }

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert(t('geolocationNotSupported') || 'Geolokatsiya qo‘llab-quvvatlanmaydi')
      return
    }
    setGeoMessage('')
    const perm = await checkGeoPermission()
    if (perm === 'denied') {
      setGeoMessage('Geolokatsiya ruxsat etilmagan. Brauzerda saytga “Location” ruxsatini bering va qurilmada geolokatsiyani yoqing, so‘ng yana urinib ko‘ring.')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          await handleMapSelect({ lat: latitude, lng: longitude })
        } finally {
          setGeoLoading(false)
        }
      },
      (err) => {
        console.error('Geolocation error:', err)
        let msg = t('geolocationError') || 'Hozirgi lokatsiya olinmadi'
        if (err && typeof err.code === 'number') {
          if (err.code === 1) {
            msg = 'Ruxsat berilmadi. Brauzer oynasida lokatsiyaga ruxsat bering yoki sayt sozlamalaridan Location’ni yoqing.'
          } else if (err.code === 2) {
            msg = 'Lokatsiya topilmadi. Internet/GPS ni yoqib, ochiq joyda urinib ko‘ring.'
          } else if (err.code === 3) {
            msg = 'So‘rov vaqti tugadi. Qayta urinib ko‘ring.'
          }
        }
        setGeoMessage(msg)
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const appendExtra = (base, extra) => {
    const b = (base || '').trim()
    const e = (extra || '').trim()
    if (!e) return b
    if (!b) return e
    return `${b}, ${e}`
  }

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


  const handleFormikSubmit = async (values, { setSubmitting }) => {
  try {
    if (!salonProfile) return;

    const salonId = salonProfile.id;
    const updateData = {};

    console.log('Edit states:', {
      editDescription,
      editAdditionals,
      editComfort,
      editSale,
      editContacts
    });

    // 1️⃣ Salon name
    if (values.salon_name && values.salon_name !== getSalonData(salonProfile, 'salon_name')) {
      updateData['salon_name'] = values.salon_name;
      updateData[`salon_name_${language}`] = values.salon_name;
    }

    // 2️⃣ Work schedule
    const currentHours = salonProfile?.work_schedule?.hours || salonProfile?.work_schedule?.working_hours || '';
    const currentDates = salonProfile?.work_schedule?.dates || salonProfile?.work_schedule?.working_days || '';
    
    if (values.work_hours !== currentHours || values.work_dates !== currentDates) {
      updateData['work_schedule'] = {
        hours: values.work_hours || '',
        dates: values.work_dates || ''
      };
    }

    // 3️⃣ Salon type
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

    // 4️⃣ Salon format
    if (values.salon_format && values.salon_format !== salonProfile?.salon_format?.format) {
      updateData['salon_format'] = { selected: true, format: values.salon_format };
    }

    // 5️⃣ Description
    const currentDescription = getSalonData(salonProfile, `description_${language}`);
    console.log('Description comparison:', { 
      current: currentDescription, 
      edit: editDescription,
      changed: editDescription && editDescription !== currentDescription 
    });
    
    if (editDescription && editDescription.trim() !== '' && editDescription !== currentDescription) {
      updateData[`description_${language}`] = editDescription;
    }

    // 6️⃣ Contacts
    const currentPhone1 = salonProfile?.salon_phone || '';
    const currentPhone2 = salonProfile?.salon_add_phone || '';
    
    console.log('Contacts comparison:', { 
      currentPhone1, 
      editPhone1: editContacts?.phone1,
      currentPhone2,
      editPhone2: editContacts?.phone2
    });
    
    if (editContacts?.phone1) {
      const normalized1 = editContacts.phone1.replace(/\s/g, '').replace(/\D/g, '');
      if (normalized1 && normalized1 !== currentPhone1.replace(/\D/g, '')) {
        updateData['salon_phone'] = normalized1;
      }
    }
    
    if (editContacts?.phone2) {
      const normalized2 = editContacts.phone2.replace(/\s/g, '').replace(/\D/g, '');
      if (normalized2 && normalized2 !== currentPhone2.replace(/\D/g, '')) {
        updateData['salon_add_phone'] = normalized2;
      }
    }

    if (editContacts?.instagram) {
      const ig = editContacts.instagram.trim();
      const currentIg = salonProfile?.salon_instagram || '';
      if (ig && ig !== currentIg) {
        updateData['salon_instagram'] = ig;
      }
    }

    // 7️⃣ Additionals (maps to generic salon_description)
    const currentGenericDesc = salonProfile?.salon_description || '';
    console.log('Additionals->salon_description comparison:', { 
      current: currentGenericDesc, 
      edit: editAdditionals,
      changed: editAdditionals && editAdditionals !== currentGenericDesc 
    });
    
    if (editAdditionals && editAdditionals.trim() !== '' && editAdditionals !== currentGenericDesc) {
      updateData['salon_description'] = editAdditionals;
    }

    // 8️⃣ Comfort
    if (editComfort && editComfort.length > 0) {
      const currentComfort = JSON.stringify(salonProfile?.salon_comfort || []);
      const newComfort = JSON.stringify(editComfort);
      console.log('Comfort comparison:', { 
        current: currentComfort, 
        new: newComfort,
        changed: currentComfort !== newComfort 
      });
      
      if (currentComfort !== newComfort) {
        updateData['salon_comfort'] = editComfort;
      }
    }

    // 9️⃣ Sale
    const currentSale = salonProfile?.salon_sale || {};
    console.log('Sale comparison:', { 
      current: currentSale, 
      edit: editSale,
      changed: (editSale.amount !== currentSale.amount) || (editSale.date !== currentSale.date)
    });
    
    if (editSale && (editSale.amount || editSale.date)) {
      const saleChanged = (
        (editSale.amount && editSale.amount !== (currentSale.amount || '')) ||
        (editSale.date && editSale.date !== (currentSale.date || ''))
      );
      
      if (saleChanged) {
        updateData['salon_sale'] = {
          amount: editSale.amount || '',
          date: editSale.date || ''
        };
      }
    }

    // Map-selected location and multilingual address/orientation
    if (editLocation?.lat && editLocation?.lng) {
      updateData['location'] = { lat: editLocation.lat, lng: editLocation.lng };
    }
    if (editAddress?.uz || editAddress?.en || editAddress?.ru || addressExtra) {
      const uzCombined = appendExtra(editAddress.uz, addressExtra)
      const enCombined = appendExtra(editAddress.en, addressExtra)
      const ruCombined = appendExtra(editAddress.ru, addressExtra)
      if (uzCombined) { updateData['address_uz'] = uzCombined; updateData['salon_address_uz'] = uzCombined; }
      if (enCombined) { updateData['address_en'] = enCombined; updateData['salon_address_en'] = enCombined; }
      if (ruCombined) { updateData['address_ru'] = ruCombined; updateData['salon_address_ru'] = ruCombined; }
      console.log('✅ Address (UZ/EN/RU) prepared');
    }
    if (editOrientation?.uz || editOrientation?.en || editOrientation?.ru) {
      if (editOrientation.uz) { updateData['orientation_uz'] = editOrientation.uz; updateData['salon_orientation_uz'] = editOrientation.uz; }
      if (editOrientation.en) { updateData['orientation_en'] = editOrientation.en; updateData['salon_orientation_en'] = editOrientation.en; }
      if (editOrientation.ru) { updateData['orientation_ru'] = editOrientation.ru; updateData['salon_orientation_ru'] = editOrientation.ru; }
      console.log('✅ Orientation (UZ/EN/RU) prepared');
    }

    console.log(JSON.stringify(updateData, null, 2));

    // 🔟 Matn ma'lumotlarini yangilash
    if (Object.keys(updateData).length > 0) {
      const result = await updateSalon(salonId, updateData);
    } else {
    }

    const maxBytes = 4 * 1024 * 1024;

    // Logo yuklash
    if (pendingLogo?.file) {
      if (pendingLogo.file.size > maxBytes) {
        alert(t('logoTooLarge'));
        setSubmitting(false);
        return;
      }
      await uploadSalonLogo(salonId, pendingLogo.file);
      if (pendingLogo?.preview) URL.revokeObjectURL(pendingLogo.preview);
      setPendingLogo(null);
    }

    // Photos yuklash
    if (pendingImages.length > 0) {
      const validImages = pendingImages.filter(img => img?.file && img.file.size <= maxBytes);
      if (validImages.length > 0) {
        const photoFiles = validImages.map(img => img.file);
        await uploadSalonPhotos(salonId, photoFiles);
        pendingImages.forEach(img => img?.preview && URL.revokeObjectURL(img.preview));
        setPendingImages([]);
      }
    }

    // Salonni qayta yuklash
    await fetchAdminSalon(salonId);

    // Edit mode dan chiqish
    setChangeMode(false);
    setEditDescription('');
    setEditAdditionals('');
    setEditComfort([]);
    setEditSale({ amount: '', date: '' });
    setEditContacts({ phone1: '', phone2: '', instagram: '' });

    alert(t('salonUpdated') || 'Salon muvaffaqiyatli yangilandi!');

  } catch (error) {
    alert(t('updateError') || `Xatolik: ${error.message}`);
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
    const currentDescription = getSalonData(salonProfile, `description_${language}`);
    const currentAdditionals = salonProfile?.salon_description || '';
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
    setEditAdditionals(currentAdditionals);
    setEditComfort([...currentComfort]);
    setEditSale({ ...currentSaleData });

    setEditSalonName(currentName || '');
    setEditWorkHours(currentSchedule?.hours || currentSchedule?.working_hours || '');
    setEditWorkDates(currentSchedule?.dates || currentSchedule?.working_days || '');
    setEditSalonType(selectedType);
    setEditSalonFormat(currentFormat);
    
    // ✅ YANGI: Contacts state'ni ham to'ldirish
    const phoneParts = (salonProfile?.salon_phone || '').split(/[;,\s\/]+/).filter(Boolean);
    setEditContacts({
      phone1: phoneParts[0] || '',
      phone2: phoneParts[1] || (salonProfile?.salon_add_phone || ''),
      instagram: salonProfile?.salon_instagram || (salonProfile?.social_media?.find(s => s.type === 'instagram')?.link || '')
    });

    // Initial map location in edit mode
    setEditLocation({
      lat: salonProfile?.location?.lat || '',
      lng: (salonProfile?.location?.lng ?? salonProfile?.location?.long ?? '')
    });
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

    // Tilni barqaror ishlatish uchun lowerCase
    const lang = String(language || '').toLowerCase();

    // 1) Agar maydon multilang obyekt ko'rinishida bo'lsa (masalan, address yoki orientation)
    const nested = salon[field];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const byLang = nested[lang];
      if (typeof byLang === 'string' && byLang) return byLang;

      // Fallback tartibi: uz -> ru -> en
      if (typeof nested.uz === 'string' && nested.uz) return nested.uz;
      if (typeof nested.ru === 'string' && nested.ru) return nested.ru;
      if (typeof nested.en === 'string' && nested.en) return nested.en;

      const anyVal = Object.values(nested).find(v => typeof v === 'string' && v);
      if (anyVal) return anyVal;

      return '';
    }

    // 2) Backend description_* maydonlari uchun maxsus qo'llab-quvvatlash
    if (field === 'salon_description') {
      switch (lang) {
        case 'uz':
          return salon['salon_description_uz'] || salon['description_uz'] || salon['salon_description'] || (typeof salon[field] === 'string' ? salon[field] : '') || '';
        case 'en':
          return salon['salon_description_en'] || salon['description_en'] || salon['salon_description'] || (typeof salon[field] === 'string' ? salon[field] : '') || '';
        case 'ru':
          return salon['salon_description_ru'] || salon['description_ru'] || salon['salon_description'] || (typeof salon[field] === 'string' ? salon[field] : '') || '';
        default:
          return salon['description_uz'] || salon['salon_description'] || (typeof salon[field] === 'string' ? salon[field] : '') || '';
      }
    }

    // 3) Umumiy maydonlar uchun (address, orientation va boshqalar) kengroq fallback (flattened kalitlar)
    const flatCandidate =
      salon[`${field}_${lang}`] ||
      salon[`salon_${field}_${lang}`] ||
      salon[`salon_${field}`] ||
      salon[field];

    if (typeof flatCandidate === 'string') return flatCandidate || '';

    // Agar topilgan qiymat string bo'lmasa, bo'sh string qaytaramiz
    return '';
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

        // Local state ni yangilash (server javobidan)
        const deletedImages = result?.photos || result?.salon_photos || [];
        setCompanyImages(Array.isArray(deletedImages) ? deletedImages : []);

        alert(t('imageDeleted'));
      } catch (error) {
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
                  return (
                    <div className='company-image' style={{
                      backgroundImage: `url(${currentLogo})`,
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
                      <button
                        onClick={submitProfileForm}
                        type="button"
                        style={{ backgroundColor: '#4CAF50', color: 'white' }}
                      >
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

                  {salonProfile?.salon_sale
                    &&
                    <div className='profile-salon-salecount'>
                      <p>
                        {t("sale")}
                        {salonProfile?.salon_sale?.amount ? `${salonProfile.salon_sale.amount}%` : t('saleNotSet')}
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
                    {salonProfile?.work_hours || '8:00 - 22:00'}
                  </h3>
                </div>
                <div>
                  <img src="/images/workDateIcon.png" alt="" />
                  <h3>
                    {salonProfile?.work_dates || t('profileWorkDays')}
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
                <div className={getSalonData(salonProfile, `description_${language}`) == "" ? 'empty' : 'info'}>
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
                    getSalonData(salonProfile, `description_${language}`) == ""
                      ?
                      t('profileEmpty')
                      :
                      <ReadMoreReact
                        text={getSalonData(salonProfile, `description_${language}`)}
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
                <div className={(salonProfile?.salon_description && salonProfile.salon_description.trim() !== '') ? 'info' : 'empty'}>
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
                    (!salonProfile?.salon_description || salonProfile.salon_description.trim() === '')
                      ?
                      t('profileEmpty')
                      :
                      <ReadMoreReact
                        text={salonProfile.salon_description}
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
              <div className='company-number'>
                <h3>
                  {t('profilePhone')}
                </h3>
                <div className='company-number-list'>
                  {
                    (() => {
                      const nums = (salonProfile?.salon_phone || '').split(/[;,\s\/]+/).filter(n => n && n.trim() !== '');
                      return nums.map((num, idx) => (
                        <div className='company-number-card' key={idx}>
                          <img src="/images/callIcon.png" alt="" />
                          <a href={`tel:${num}`}>
                            {num}
                          </a>
                        </div>
                      ));
                    })()
                  }
                </div>
                
              </div>
              {
                (salonProfile?.salon_instagram) ? (
                  <div className='company-social'>
                    <h3>
                      {t('profileSocial')}
                    </h3>
                    <div className='company-social-list'>
                      {
                        salonProfile?.salon_instagram
                          ? (
                              <div className='company-social-card' key="instagram">
                                <img src="/images/Instagram.png" alt="" />
                                <a href={salonProfile?.salon_instagram}>
                                  instagram
                                </a>
                                <img src="/images/arrowLeft.png" alt="" />
                              </div>
                            ) : null
                      }
                    </div>
                  </div>
                ) : null
              }
              {/* {currentSale.amount
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
              } */}
              
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
                <YandexMap
                  lat={changeMode ? (editLocation?.lat || salonProfile?.location?.lat) : salonProfile?.location?.lat}
                  lng={changeMode ? (editLocation?.lng || salonProfile?.location?.lng) : salonProfile?.location?.lng}
                  editable={changeMode}
                  onSelect={changeMode ? handleMapSelect : undefined}
                />
              </div>
              <div className='company-location-bottom'>
                <div className='company-location-address'>
                  <img src="/images/markerMap.png" alt="" />
                  <p>
                    {changeMode 
                      ? (editAddress?.[String(language).toLowerCase()] || '') 
                      : (getSalonData(salonProfile, 'address') || '')}
                  </p>
                </div>
                <div className='company-location-navigate'>
                  <img src="/images/navigateMap.png" alt="" />
                  <p>
                    {changeMode
                      ? (editOrientation?.[String(language).toLowerCase()] ? `${t('metro') || 'Metro'}: ${editOrientation?.[String(language).toLowerCase()]}` : '')
                      : (getSalonData(salonProfile, 'orientation') 
                          ? `${t('metro') || 'Metro'}: ${getSalonData(salonProfile, 'orientation')}`
                          : '')}
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
              <div className={getSalonData(salonProfile, `description_${language}`) == "" ? 'empty' : 'info'}>
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
                  getSalonData(salonProfile, `description_${language}`) == ""
                    ?
                    t('profileEmpty')
                    :
                    <ReadMoreReact
                      text={getSalonData(salonProfile, `description_${language}`)}
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
              <div className={(salonProfile?.salon_description && salonProfile.salon_description.trim() !== '') ? 'info' : 'empty'}>
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
                  (!salonProfile?.salon_description || salonProfile.salon_description.trim() === '')
                    ?
                    t('profileEmpty')
                    :
                    <ReadMoreReact
                      text={salonProfile.salon_description}
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
            {changeMode && (
              <div className='company-location-edit' style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0 }}>{t('profileMapSelect') || 'Manzilni xaritadan belgilang'}</h3>
                  <button
                    type='button'
                    onClick={handleUseCurrentLocation}
                    disabled={geoLoading}
                    style={{
                      width: '42px',
                      height: '42px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: geoLoading ? '#9aa6b2' : '#9C2BFF',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: geoLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <LocateFixed color="#ffffff" size={20} strokeWidth={2.25} />
                  </button>
                </div>
                {geoMessage && (
                  <div style={{ marginBottom: '8px' }}>
                    <p style={{ fontSize: '0.9vw', color: '#d32f2f' }}>{geoMessage}</p>
                  </div>
                )}
                <div className='company-location-map'>
                  <YandexMap
                    lat={editLocation?.lat || salonProfile?.location?.lat}
                    lng={editLocation?.lng || salonProfile?.location?.lng}
                    editable={true}
                    onSelect={handleMapSelect}
                  />
                </div>
                <div className='company-location-bottom'>
                  <div className='company-location-address'>
                    <img src="/images/markerMap.png" alt="" />
                    <p>{appendExtra(editAddress?.[String(language).toLowerCase()] || '', addressExtra)}</p>
                  </div>
                  <div className='company-location-navigate'>
                    <img src="/images/navigateMap.png" alt="" />
                    <p>{editOrientation?.[String(language).toLowerCase()] ? `${t('metro') || 'Metro'}: ${editOrientation?.[String(language).toLowerCase()]}` : ''}</p>
                  </div>
                </div>
                {(editLocation?.lat && editLocation?.lng) || (editAddress?.uz || editAddress?.en || editAddress?.ru) ? (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.95vw' }}>
                      {t('addressExtra') || 'Uy manzili (qo‘shimcha) — UZ/EN/RU uchun bir xil'}
                    </label>
                    <input
                      type='text'
                      value={addressExtra}
                      onChange={(e) => setAddressExtra(e.target.value)}
                      placeholder={t('addressExtraPlaceholder') || 'Kvartira, подъезд, этаж ...'}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                ) : null}
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                  Lat: {editLocation?.lat || '-'} · Lng: {editLocation?.lng || '-'}
                </div>
              </div>
            )}
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
