import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import i18n from "./i18n";
import {
	authUrl,
	adminLoginUrl,
	employeeLoginUrl,
	superAdminLoginUrl,
	adminUrl,
	salonsUrl,
	adminSalonsUrl,
	adminMySalonUrl,
	appointUrl,
	commentsUrl,
	mastersUrl,
	employeesUrl,
	employeeBulkWaitingStatusUrl,
	servicesUrl,
	appointmentsUrl,
	salonsListUrl,
	salonDetailUrl,
	schedulesUrl,
	scheduleGroupedUrl,
	salonServicesUrl,
	statisticsUrl,
	paymentUrl,
	smsUrl,
	translationUrl,
	translationDetectLanguageUrl,
	messagesUrl,
	photoUploadUrl,
	bookingsUrl
} from "./apiUrls"


// API base URL configuration - Python backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Force a specific salon ID when provided (disabled by default)
const FORCE_SALON_ID = null;

const AppContext = createContext();

// Toggle to use local test data stored in localStorage
const USE_LOCAL_DATA = false;

// LocalStorage keys mapping
const LS_KEYS = {
	appointments: 'appointments',
	employees: 'employees',
	services: 'services',
	schedules: 'schedules',
	salons: 'salons',
	conversations: 'conversations',
	messages: 'messages',
	statistics: 'statistics',
};

// LocalStorage helpers
const lsGet = (key, fallback = []) => {
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : fallback;
	} catch {
		return fallback;
	}
};

const lsSet = (key, value) => {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// no-op
	}
};

const lsUpsert = (key, item, idField = 'id') => {
	const arr = lsGet(key, []);
	const idx = arr.findIndex(x => x?.[idField] === item?.[idField]);
	if (idx >= 0) arr[idx] = item; else arr.push(item);
	lsSet(key, arr);
	return arr;
};

const lsRemove = (key, id, idField = 'id') => {
	const arr = lsGet(key, []).filter(x => x?.[idField] !== id);
	lsSet(key, arr);
	return arr;
};

// Seed localStorage with test data on first load
const seedLocalData = () => {
	try {
		// Fixed: Use empty arrays since test data is not imported
		if (!localStorage.getItem(LS_KEYS.appointments)) lsSet(LS_KEYS.appointments, []);
		if (!localStorage.getItem(LS_KEYS.employees)) lsSet(LS_KEYS.employees, []);
		if (!localStorage.getItem(LS_KEYS.services)) lsSet(LS_KEYS.services, []);
		if (!localStorage.getItem(LS_KEYS.schedules)) lsSet(LS_KEYS.schedules, []);
		if (!localStorage.getItem(LS_KEYS.salons)) lsSet(LS_KEYS.salons, []);
		if (!localStorage.getItem(LS_KEYS.conversations)) lsSet(LS_KEYS.conversations, []);
		if (!localStorage.getItem(LS_KEYS.messages)) lsSet(LS_KEYS.messages, []);
		if (!localStorage.getItem(LS_KEYS.statistics)) lsSet(LS_KEYS.statistics, []);
	} catch {
		// no-op
	}
};

// Top-level helpers for headers and auth
export const getAuthToken = () => {
	return localStorage.getItem('authToken');
};

// getHeaders helper removed as per request; use inline headers where needed

export const AppProvider = ({ children }) => {
	// Track currently loaded admin salon ID to compare with requests
	const currentSalonIdRef = useRef(null);

	// Authentication state
	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [authLoading, setAuthLoading] = useState(true);

	// Appointments state
	const [appointments, setAppointments] = useState([]);
	const [appointmentsLoading, setAppointmentsLoading] = useState(false);
	const [appointmentsError, setAppointmentsError] = useState(null);

	// Schedules state
	const [schedules, setSchedules] = useState([]);
	const [schedulesLoading, setSchedulesLoading] = useState(false);
	const [schedulesError, setSchedulesError] = useState(null);

	// Grouped schedules state
	const [groupedSchedules, setGroupedSchedules] = useState([]);
	const [groupedSchedulesLoading, setGroupedSchedulesLoading] = useState(false);
	const [groupedSchedulesError, setGroupedSchedulesError] = useState(null);

	// Employees state
	const [employees, setEmployees] = useState([]);
	const [employeesLoading, setEmployeesLoading] = useState(false);
	const [employeesError, setEmployeesError] = useState(null);

	// Services state
	const [services, setServices] = useState([]);
	const [servicesLoading, setServicesLoading] = useState(false);
	const [servicesError, setServicesError] = useState(null);

	// Chat state
	const [conversations, setConversations] = useState([]);
	const [conversationsLoading, setConversationsLoading] = useState(false);
	const [conversationsError, setConversationsError] = useState(null);
	const [currentConversation, setCurrentConversation] = useState(null);
	const [messages, setMessages] = useState([]);
	const [messagesLoading, setMessagesLoading] = useState(false);
	const [messagesError, setMessagesError] = useState(null);

	// Instagram va orientation ko‘rinishi uchun datani bir xillash
	const normalizeSalonForProfile = (s) => {
		const source = s || {};
		const sm = Array.isArray(source.social_media) ? source.social_media : [];
		const instagramFromSocial = sm.find(item => String(item?.type).toLowerCase() === 'instagram')?.link || '';
		const instagram = source.salon_instagram || source.instagram_url || source.instagram || instagramFromSocial || '';
		const nextSocial = sm.length > 0 ? sm : (instagram ? [{ type: 'instagram', link: instagram }] : sm);

		const nested = (source.orientation && typeof source.orientation === 'object' && !Array.isArray(source.orientation)) ? source.orientation : null;

		return {
			...source,
			social_media: nextSocial,
			salon_instagram: instagram,
			...(nested ? {
				orientation_ru: source.orientation_ru || nested.ru || nested.RU || nested['ru-RU'] || '',
				orientation_uz: source.orientation_uz || nested.uz || nested.UZ || nested['uz-UZ'] || '',
				orientation_en: source.orientation_en || nested.en || nested.EN || nested['en-US'] || '',
			} : {})
		};
	};






	// Check if user is already logged in on app start
	useEffect(() => {
		const token = localStorage.getItem('authToken');
		const userData = localStorage.getItem('userData');


		if (token && userData) {
			try {
				const parsedUser = JSON.parse(userData);


				// Role mavjudligini tekshirish
				if (!parsedUser.role) {
					console.error('❌ ERROR: User role is missing! Clearing localStorage...');
					localStorage.removeItem('authToken');
					localStorage.removeItem('userData');
					setAuthLoading(false);
					return;
				}

				setUser(parsedUser);
				setIsAuthenticated(true);
			} catch (error) {
				console.error('Error parsing user data:', error);
				localStorage.removeItem('authToken');
				localStorage.removeItem('userData');
			}
		}
		setAuthLoading(false);
	}, []);


	// Salons state
	const [salons, setSalons] = useState([]);
	const [salonsLoading, setSalonsLoading] = useState(false);
	const [salonsError, setSalonsError] = useState(null);

	// Seed and hydrate localStorage-based test data
	useEffect(() => {
		if (!USE_LOCAL_DATA) return;
		// Seed once
		seedLocalData();
		// Hydrate states from localStorage
		setAppointments(lsGet(LS_KEYS.appointments, []));
		setEmployees(lsGet(LS_KEYS.employees, []));
		setServices(lsGet(LS_KEYS.services, []));
		setSchedules(lsGet(LS_KEYS.schedules, []));
		// For groupedSchedules, provide a simple fallback to schedules
		setGroupedSchedules(lsGet(LS_KEYS.schedules, []));
		setSalons(lsGet(LS_KEYS.salons, []));
		setConversations(lsGet(LS_KEYS.conversations, []));
		setMessages(lsGet(LS_KEYS.messages, []));
	}, []);

	// ===== Statistics functions =====
	// Backendda to'liq implementatsiya bo'lmagan holatlarda ham xavfsiz ishlaydi.
	// Agar endpoint mavjud bo'lmasa yoki xato qaytsa, bo'sh obyektni qaytaradi.
	const getStatistics = async (params = {}) => {
		try {
			const token = getAuthToken();
			const headers = {
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
				'Content-Type': 'application/json',
			};

			// Parametrlarni query stringga aylantiramiz (masalan, salon_id)
			const qs = new URLSearchParams(
				Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
			).toString();
			const url = qs ? `${statisticsUrl}?${qs}` : statisticsUrl;

			const resp = await fetch(url, { method: 'GET', headers });
			if (!resp.ok) {
				// Backend hali tayyor bo'lmasligi mumkin — xatoni muloyim qaytamiz
				let msg = `HTTP ${resp.status}`;
				try {
					const errJson = await resp.json();
					msg = errJson?.message || errJson?.detail || msg;
				} catch {
					try { msg = await resp.text(); } catch { }
				}
				console.warn('[getStatistics] request failed:', msg);
				return { data: {}, message: msg };
			}

			const data = await resp.json();
			return data?.data ? data : { data };
		} catch (error) {
			console.error('[getStatistics] unexpected error:', error);
			return { data: {} };
		}
	};

	// Local CRUD wrappers to update localStorage and state in test-data mode
	const saveLocal = (key, item, idField, setter) => {
		const arr = lsUpsert(key, item, idField);
		setter(arr);
		return arr;
	};

	const removeLocal = (key, id, idField, setter) => {
		const arr = lsRemove(key, id, idField);
		setter(arr);
		return arr;
	};

	const upsertAppointment = (item) => saveLocal(LS_KEYS.appointments, item, 'id', setAppointments);
	const removeAppointment = (id) => removeLocal(LS_KEYS.appointments, id, 'id', setAppointments);
	const upsertSchedule = (item) => saveLocal(LS_KEYS.schedules, item, 'id', setSchedules);
	const removeSchedule = (id) => removeLocal(LS_KEYS.schedules, id, 'id', setSchedules);
	const upsertEmployee = (item) => saveLocal(LS_KEYS.employees, item, 'id', setEmployees);
	const removeEmployee = (id) => removeLocal(LS_KEYS.employees, id, 'id', setEmployees);
	const upsertService = (item) => saveLocal(LS_KEYS.services, item, 'id', setServices);
	const removeService = (id) => removeLocal(LS_KEYS.services, id, 'id', setServices);
	const upsertSalon = (item) => saveLocal(LS_KEYS.salons, item, 'id', setSalons);
	const removeSalon = (id) => removeLocal(LS_KEYS.salons, id, 'id', setSalons);
	const upsertConversation = (item) => saveLocal(LS_KEYS.conversations, item, 'id', setConversations);
	const removeConversation = (id) => removeLocal(LS_KEYS.conversations, id, 'id', setConversations);
	const upsertMessage = (item) => saveLocal(LS_KEYS.messages, item, 'id', setMessages);
	const removeMessage = (id) => removeLocal(LS_KEYS.messages, id, 'id', setMessages);
	// 4302cd19-0f0e-4182-afaa-8dd152d0ed8d
	// Fetch salons with authentication
	const fetchSalons = async () => {
		setSalonsLoading(true);
		setSalonsError(null);

		try {
			const token = getAuthToken();
			const response = await fetch(salonsListUrl, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Salons fetched:', data);
				setSalons(data.data || []);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch salons');
			}
		} catch (error) {
			console.error('Error fetching salons:', error);
			setSalonsError(error.message);
			setSalons([]);
		} finally {
			setSalonsLoading(false);
		}
	};

	// Update salon function
	// Context.jsx da updateSalon funksiyasiga debug qo'shish

	// Detect text language via backend translation API
	const detectLanguageForText = async (text) => {
		try {
			const trimmed = (text || "").trim();
			if (!trimmed) return null;
			const resp = await fetch(translationDetectLanguageUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: trimmed })
			});
			if (!resp.ok) return null;
			const data = await resp.json();
			let lang = data?.data?.language;
			if (!lang || typeof lang !== 'string') return null;
			lang = lang.toLowerCase();
			if (['uz','ru','en'].includes(lang)) return lang;
			if (lang.startsWith('ru')) return 'ru';
			if (lang.startsWith('uz')) return 'uz';
			if (lang.startsWith('en')) return 'en';
			return null;
		} catch (e) {
			return null;
		}
	};

	const updateSalon = async (salonId, updateData) => {
		try {
			console.log('=== updateSalon START ===');
			console.log('Salon ID:', salonId);
			console.log('Update Data:', JSON.stringify(updateData, null, 2));

			const token = getAuthToken();
			const role = user?.role;
			const allowedRoles = ['admin', 'super_admin', 'superadmin', 'private_admin', 'private_salon_admin'];

			console.log('User role:', role);
			console.log('Token exists:', !!token);

			if (!role || !allowedRoles.includes(role)) {
				throw new Error('Admin huquqi talab qilinadi');
			}

			if (!token) {
				throw new Error('Admin token topilmadi');
			}

			const targetId = salonId || (salonProfile && salonProfile.id) || user?.salon_id;  // Fixed: Added null-check for salonProfile
			console.log('Target ID:', targetId);
			console.log('URL:', `${salonsUrl}/${targetId}`);

			const rawLang = i18n?.language || 'uz';
					const languageHeader = ['uz','ru','en'].includes(rawLang)
						? rawLang
						: (rawLang?.toLowerCase().startsWith('ru') ? 'ru'
							: rawLang?.toLowerCase().startsWith('uz') ? 'uz'
							: rawLang?.toLowerCase().startsWith('en') ? 'en'
							: 'ru');
				let payload = { ...updateData };

				// Merge salon_additionals into description text as bullet list
				let combinedDescription = null;
				if (payload.salon_additionals !== undefined) {
					const items = Array.isArray(payload.salon_additionals)
						? payload.salon_additionals
						: String(payload.salon_additionals || '').split('\n');
					const cleaned = items.map(it => String(it || '').trim()).filter(Boolean);
					const bullets = cleaned.length ? cleaned.map(s => `- ${s}`).join('\n') : '';
					combinedDescription = payload.salon_description
						? `${String(payload.salon_description).trim()}${bullets ? `\n\n${bullets}` : ''}`
						: bullets;
					// remove additionals from payload (we embed it into description)
					delete payload.salon_additionals;
				}
				// If no additionals provided but description exists, use it as combined
				if (!combinedDescription && payload.salon_description) {
					combinedDescription = String(payload.salon_description).trim();
				}

				// If we have description text, detect language and place into description_<lang>
				if (combinedDescription) {
					let detectedLang = await detectLanguageForText(combinedDescription);
					if (!detectedLang) detectedLang = languageHeader;
					payload[`description_${detectedLang}`] = combinedDescription;
					// avoid sending base key to prevent confusion
					delete payload.salon_description;
				}

				// Map any existing salon_description_<lang> to description_<lang>
				['uz','ru','en'].forEach(l => {
					const key = `salon_description_${l}`;
					if (payload[key] !== undefined) {
						payload[`description_${l}`] = payload[key] || '';
						delete payload[key];
					}
				});

				// Drop unsupported keys
				Object.keys(payload).forEach(k => {
					if (k.startsWith('salon_name_')) delete payload[k];
				});
				['work_schedule','salon_format','salon_add_phone'].forEach(k => {
					if (payload[k] !== undefined) delete payload[k];
				});

				// Normalize phone to digits only
				if (payload.salon_phone !== undefined) {
					payload.salon_phone = String(payload.salon_phone).replace(/\D/g, '');
				}

				// Debug: show normalized payload before sending
				console.log('Normalized Payload:', JSON.stringify(payload, null, 2));

				// Normalize location to backend Location schema
				if (payload.location && typeof payload.location === 'object') {
					const loc = payload.location;
					const latitude = loc.latitude ?? loc.lat ?? undefined;
					const longitude = loc.longitude ?? loc.lng ?? undefined;
					payload.location = { latitude, longitude };
				}

				// Ensure salon_types are objects with { type, selected }
					if (Array.isArray(payload.salon_types)) {
						let nextTypes = payload.salon_types.map(item => {
							if (item && typeof item === 'object') {
								if ('type' in item) return { type: String(item.type), selected: !!item.selected };
								if ('value' in item) return { type: String(item.value), selected: !!item.selected };
							}
							if (typeof item === 'string') return { type: item, selected: false };
							return item;
						});
						// Guarantee at least one selected
						if (nextTypes.length > 0 && !nextTypes.some(t => t && t.selected)) {
							const currentSelected = (salonProfile?.salon_types || []).find(t => t?.selected)?.type;
							const idx = nextTypes.findIndex(t => t?.type === currentSelected);
							const selectIndex = idx >= 0 ? idx : 0;
							nextTypes = nextTypes.map((t, i) => ({ ...t, selected: i === selectIndex }));
						}
						payload.salon_types = nextTypes;
					}

					// Ensure salon_comfort are objects with { name, isActive }
						if (Array.isArray(payload.salon_comfort)) {
							payload.salon_comfort = payload.salon_comfort.map(item => {
								if (item && typeof item === 'object') {
									if ('name' in item) return { name: String(item.name), isActive: !!item.isActive };
									if ('value' in item) return { name: String(item.value), isActive: !!item.isActive };
								}
								if (typeof item === 'string') return { name: item, isActive: true };
								return item;
							});
						}

					const normalizedPayload = payload;

			const response = await fetch(`${salonsUrl}/${targetId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
				body: JSON.stringify(normalizedPayload),
			});

			console.log('Response status:', response.status);
			console.log('Response ok:', response.ok);

			if (response.ok) {
				const data = await response.json();
				console.log('Success response:', data);

				// State'ni yangilash
				const serverSalon = data?.data || {};
				setSalonProfile(prev => {
					if (!prev || prev.id !== targetId) return prev;
					const updated = { ...prev, ...updateData, ...serverSalon };
					console.log('Updated salon profile:', updated);
					return updated;
				});

				return data;
			} else {
				const errorText = await response.text();
				console.error('Error response:', errorText);
				throw new Error(`HTTP ${response.status}: ${errorText}`);
			}
		} catch (error) {
			console.error('=== updateSalon ERROR ===');
			console.error('Error:', error);
			throw error;
		}
	};

	// Helper function to convert file to base64
	const fileToBase64 = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = error => reject(error);
		});
	};

	// Context.jsx - uploadPhotosToServer funksiyasi (alertsiz)
	const uploadPhotosToServer = async (files) => {
		const token = getAuthToken();
		if (!token) throw new Error('Admin token topilmadi');

		const maxSize = 4 * 1024 * 1024;
		const uploadedUrls = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			if (!file.type?.startsWith('image/')) {
				throw new Error(`Fayl "${file.name}" rasm emas`);
			}
			if (file.size > maxSize) {
				throw new Error(`Fayl "${file.name}" hajmi katta (maks 4MB)`);
			}

			const formData = new FormData();
			formData.append('file', file);

			console.log(`📤 Uploading file ${i + 1}/${files.length}:`, file.name);

			try {
				const response = await fetch(photoUploadUrl, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Accept': 'application/json'
					},
					body: formData
				});

				if (!response.ok) {
					let message = `Upload failed (HTTP ${response.status})`;
					try {
						const contentType = response.headers.get('content-type');
						if (contentType?.includes('application/json')) {
							const errData = await response.json();
							if (Array.isArray(errData?.detail)) {
								message = errData.detail.map(d => d?.msg || JSON.stringify(d)).join('; ');
							} else if (typeof errData?.detail === 'string') {
								message = errData.detail;
							} else {
								message = errData?.message || errData?.error || message;
							}
						} else {
							const text = await response.text();
							message = text || message;
						}
					} catch { }
					throw new Error(message);
				}

				const data = await response.json();
				let url = null;
				if (typeof data === 'string') {
					url = data;
				} else if (data?.url) {
					url = data.url;
				} else if (data?.data?.url) {
					url = data.data.url;
				}

				if (url) {
					uploadedUrls.push(url);
				} else {
					throw new Error(`File ${i + 1}: Backend dan URL qaytmadi`);
				}

			} catch (fileError) {
				throw new Error(`File "${file.name}": ${fileError.message}`);
			}
		}

		return uploadedUrls;
	};

	// Logo ni alohida yuklash
	const uploadSalonLogo = async (salonId, logoFile) => {
		try {
			console.log('=== UPLOAD SALON LOGO START ===');

			const targetSalonId = salonId || salonProfile?.id || user?.salon_id;
			if (!targetSalonId) throw new Error('Salon ID topilmadi');

			const urls = await uploadPhotosToServer([logoFile]);

			if (!urls || urls.length === 0) {
				throw new Error('Logo yuklanmadi');
			}

			const logoUrl = urls[0];
			console.log('✅ Logo uploaded:', logoUrl);

			const token = getAuthToken();
			const updatePayload = {
				icon: logoUrl,
				logo: logoUrl
			};

			const response = await fetch(`${salonsUrl}/${targetSalonId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
				body: JSON.stringify(updatePayload)
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(`HTTP ${response.status}: ${text}`);
			}

			const data = await response.json();
			const serverSalon = data?.data || data;

			setSalonProfile(prev => {
				if (!prev || prev.id !== targetSalonId) return prev;
				return {
					...prev,
					icon: logoUrl,
					logo: logoUrl,
					...serverSalon
				};
			});

			return logoUrl;

		} catch (error) {
			console.error('=== UPLOAD SALON LOGO ERROR ===');
			console.error('Error:', error);
			throw error;
		}
	};

	// Photos ni alohida yuklash (logosiz)
	const uploadSalonPhotos = async (salonId, files) => {
		try {
			console.log('=== UPLOAD SALON PHOTOS START ===');

			const targetSalonId = salonId || salonProfile?.id || user?.salon_id;
			if (!targetSalonId) throw new Error('Salon ID topilmadi');

			const uploadedUrls = [];

			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				console.log(`📤 Uploading file ${i + 1}/${files.length}:`, file.name);

				try {
					const urls = await uploadPhotosToServer([file]);

					if (urls && urls.length > 0) {
						uploadedUrls.push(urls[0]);
						console.log(`✅ File ${i + 1} uploaded:`, urls[0]);
					}
				} catch (fileError) {
					console.error(`❌ Error uploading file ${i + 1}:`, fileError);
					throw fileError;
				}
			}

			if (uploadedUrls.length === 0) {
				throw new Error('Hech qanday rasm yuklanmadi');
			}

			console.log('✅ All uploaded URLs:', uploadedUrls);

			const currentPhotos = Array.isArray(salonProfile?.salon_photos)
				? salonProfile.salon_photos
				: Array.isArray(salonProfile?.photos)
					? salonProfile.photos
					: [];

			const nextPhotos = [...currentPhotos, ...uploadedUrls];

			const updatePayload = {
				salon_photos: nextPhotos,
				photos: nextPhotos
			};

			const token = getAuthToken();
			console.log('📤 Updating salon with photos...');

			const response = await fetch(`${salonsUrl}/${targetSalonId}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updatePayload)
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(`HTTP ${response.status}: ${text}`);
			}

			const data = await response.json();
			const serverSalon = data?.data || data;

			setSalonProfile(prev => {
				if (!prev || prev.id !== targetSalonId) return prev;
				return {
					...prev,
					salon_photos: nextPhotos,
					photos: nextPhotos,
					...serverSalon
				};
			});

			return nextPhotos;

		} catch (error) {
			console.error('=== UPLOAD SALON PHOTOS ERROR ===');
			console.error('Error:', error);
			throw error;
		}
	};
	// Delete salon photo function
	const deleteSalonPhoto = async (salonId, photoIndex) => {
		try {
			const targetSalonId = salonId || salonProfile?.id || user?.salon_id;
			if (!targetSalonId) throw new Error('Salon ID topilmadi');

			// Mavjud salon ma'lumotlarini olish
			const currentSalon = salonProfile;
			if (!currentSalon) throw new Error('Salon ma\'lumotlari topilmadi');

			// Mavjud rasmlar massivini olish (salon_photos yoki photos)
			let currentPhotos = Array.isArray(currentSalon.salon_photos)
				? [...currentSalon.salon_photos]
				: Array.isArray(currentSalon.photos)
					? [...currentSalon.photos]
					: [];

			// Index tekshiruvi
			if (photoIndex < 0 || photoIndex >= currentPhotos.length) {
				throw new Error('Noto\'g\'ri rasm indeksi');
			}

			// Rasmni massivdan o'chirish
			const deletedPhotoUrl = currentPhotos[photoIndex];
			currentPhotos.splice(photoIndex, 1);

			// Logo ni boshqarish: agar o'chirilgan rasm birinchi bo'lsa va logo bo'lsa, uni null qilish
			let updatePayload = {
				salon_photos: currentPhotos,
				photos: currentPhotos
			};

			const currentLogo = currentSalon.icon || currentSalon.logo;
			if (photoIndex === 0 && currentLogo === deletedPhotoUrl) {
				updatePayload.icon = null;
				updatePayload.logo = null;
			}

			// Backend'ni yangilash
			const token = getAuthToken();
			const response = await fetch(`${salonsUrl}/${targetSalonId}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updatePayload)
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(`Salon yangilashda xatolik (HTTP ${response.status}): ${text}`);
			}

			const data = await response.json();
			console.log('✅ Rasm o\'chirildi va salon yangilandi:', data);

			// State'ni yangilash
			setSalonProfile(prev => {
				if (!prev || prev.id !== targetSalonId) return prev;
				return {
					...prev,
					salon_photos: currentPhotos,
					photos: currentPhotos,
					...(updatePayload.icon !== undefined ? { icon: updatePayload.icon, logo: updatePayload.logo } : {}),
					... (data?.data || data)
				};
			});

			return { photos: currentPhotos };
		} catch (error) {
			console.error('Rasm o\'chirishda xatolik:', error);
			throw error;
		}
	};


	// Admin login function
	// const loginAdmin = async (username, password) => {
	// 	try {
	// 		console.log('Login attempt:', { username, password, API_BASE_URL });

	// 		const response = await fetch(adminLoginUrl, {
	// 			method: 'POST',
	// 			headers: {
	// 				'Content-Type': 'application/json',
	// 			},
	// 			body: JSON.stringify({ username, password }),
	// 		});

	// 		console.log('Response status:', response.status);
	// 		console.log('Response ok:', response.ok);
	// 		console.log('Response headers:', response.headers.get('content-type'));

	// 		// Check if response has content before parsing JSON
	// 		const responseText = await response.text();
	// 		console.log('Response text:', responseText);

	// 		let data;
	// 		try {
	// 			data = responseText ? JSON.parse(responseText) : {};
	// 		} catch (jsonError) {
	// 			console.error('JSON parse error:', jsonError);
	// 			console.error('Response text that failed to parse:', responseText);
	// 			throw new Error('Server response is not valid JSON');
	// 		}

	// 		console.log('Response data:', data);
	// 		console.log('Backend user data:', data.user);

	// 		if (response.ok) {
	// 			const userData = {
	// 				id: data.user.id,
	// 				username: data.user.username,
	// 				email: data.user.email,
	// 				full_name: data.user.full_name,
	// 				role: data.user.role,
	// 				salon_id: data.user.salon_id || null
	// 			};

	// 			console.log('Created userData:', userData);

	// 			localStorage.setItem('authToken', data.token);
	// 			localStorage.setItem('userData', JSON.stringify(userData));

	// 			setUser(userData);
	// 			setIsAuthenticated(true);

	// 			console.log('Login successful, userData set:', userData);
	// 			return userData;
	// 		} else {
	// 			console.error('Login failed with data:', data);
	// 			throw new Error(data.message || 'Admin login failed');
	// 		}
	// 	} catch (error) {
	// 		console.error('Admin login error:', error);
	// 		throw new Error(error.message || 'Network error occurred');
	// 	}
	// };

	// Employee login function
	// const loginEmployee = async (username, password) => {
	// 	try {
	// 		const response = await fetch(employeeLoginUrl, {
	// 			method: 'POST',
	// 			headers: {
	// 				'Content-Type': 'application/json',
	// 			},
	// 			body: JSON.stringify({ username, password }),
	// 		});

	// 		const data = await response.json();
	// 		console.log('🔍 LOGIN DEBUG: Backend response:', data);

	// 		if (response.ok) {
	// 			console.log('🔍 LOGIN DEBUG: Backend user data:', data.user);

	// 			const userData = {
	// 				id: data.user.id,
	// 				username: data.user.username || data.user.name,
	// 				email: data.user.email,
	// 				// Backend'dan name kelmaydi, shuning uchun username ishlatamiz
	// 				name: data.user.username || data.user.name,
	// 				role: 'employee',
	// 				salon_id: data.user.salon_id
	// 			};

	// 			console.log('🔍 LOGIN DEBUG: Created userData:', userData);
	// 			console.log('🔍 LOGIN DEBUG: userData.role:', userData.role);

	// 			localStorage.setItem('authToken', data.token);
	// 			localStorage.setItem('userData', JSON.stringify(userData));

	// 			console.log('🔍 LOGIN DEBUG: Saved to localStorage');
	// 			console.log('🔍 LOGIN DEBUG: localStorage userData:', localStorage.getItem('userData'));

	// 			setUser(userData);
	// 			setIsAuthenticated(true);

	// 			return userData;
	// 		} else {
	// 			throw new Error(data.message || 'Employee login failed');
	// 		}
	// 	} catch (error) {
	// 		console.error('Employee login error:', error);
	// 		throw new Error(error.message || 'Network error occurred');
	// 	}
	// };

	// Universal login function - avval admin, keyin employee
	const login = async (username, password) => {
		try {
			console.log('🔐 Attempting login for:', username);

			// 1. Avval admin login'ni sinab ko'ramiz
			try {
				console.log('🔍 Trying admin login...');
				const response = await fetch(adminLoginUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ username, password }),
				});

				const responseText = await response.text();
				let data;
				try {
					data = responseText ? JSON.parse(responseText) : {};
				} catch {
					throw new Error('Server response is not valid JSON');
				}

				if (response.ok) {
					console.log('✅ Admin login successful');
					const userData = {
						id: data.user.id,
						username: data.user.username,
						email: data.user.email,
						full_name: data.user.full_name,
						role: data.user.role,
						salon_id: data.user.salon_id || null
					};

					localStorage.setItem('authToken', data.token);
					localStorage.setItem('userData', JSON.stringify(userData));

					setUser(userData);
					setIsAuthenticated(true);

					return { success: true, user: userData, role: 'admin' };
				} else {
					// Admin login failed, try employee
					throw new Error('Admin login failed');
				}
			} catch (adminError) {
				console.log('⚠️ Admin login failed, trying employee login...');

				// 2. Employee login'ni sinab ko'ramiz
				const response = await fetch(employeeLoginUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ username, password }),
				});

				const responseText = await response.text();
				let data;
				try {
					data = responseText ? JSON.parse(responseText) : {};
				} catch {
					throw new Error('Server response is not valid JSON');
				}

				if (response.ok) {
					console.log('✅ Employee login successful');
					const userData = {
						id: data.user.id,
						username: data.user.username || data.user.name,
						email: data.user.email,
						name: data.user.username || data.user.name,
						role: 'employee',
						salon_id: data.user.salon_id
					};

					localStorage.setItem('authToken', data.token);
					localStorage.setItem('userData', JSON.stringify(userData));

					setUser(userData);
					setIsAuthenticated(true);

					return { success: true, user: userData, role: 'employee' };
				} else {
					// Ikkalasi ham muvaffaqiyatsiz
					throw new Error(data.detail || data.message || 'Username yoki parol noto\'g\'ri');
				}
			}
		} catch (error) {
			console.error('❌ Login error:', error);
			throw error;
		}
	};


	// Logout function
	const logout = () => {
		localStorage.clear()
		setUser(null);
		setIsAuthenticated(false);
		// Clear all data when logging out
		setAppointments([]);
		setSchedules([]);
		setEmployees([]);
	};



	// Fetch appointments by salon ID using the new filter endpoint
	const fetchAppointments = async (salonId) => {
		if (!salonId) {
			console.error('Salon ID is required to fetch appointments');
			return;
		}

		setAppointmentsLoading(true);
		setAppointmentsError(null);

		try {
			const response = await fetch(`${appointmentsUrl}/salon/${salonId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Salon appointments fetched:', data);
				setAppointments(data.data || []);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch salon appointments');
			}
		} catch (error) {
			console.error('Error fetching salon appointments:', error);
			setAppointmentsError(error.message);
			setAppointments([]);
		} finally {
			setAppointmentsLoading(false);
		}
	};


	// Fetch schedules - all schedules from production server
	const fetchSchedules = async () => {
		setSchedulesLoading(true);
		setSchedulesError(null);

		try {
			const response = await fetch(schedulesUrl, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Schedules fetched:', data);

				// Filter schedules by salon_id if user has salon_id
				let filteredSchedules = data.data || [];
				if (user && user.salon_id) {
					filteredSchedules = filteredSchedules.filter(schedule =>
						schedule.salon_id === user.salon_id
					);
				}

				setSchedules(filteredSchedules);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch schedules');
			}
		} catch (error) {
			console.error('Error fetching schedules:', error);
			setSchedulesError(error.message);
			setSchedules([]);
		} finally {
			setSchedulesLoading(false);
		}
	};

	// Create new schedule
	const createSchedule = async (scheduleData) => {
		setSchedulesLoading(true);
		setSchedulesError(null);

		try {
			const token = getAuthToken();

			if (!token) {
				throw new Error('Tizimga kirish tokeni topilmadi');
			}

			const dataToSend = {
				...scheduleData,
				salon_id: scheduleData.salon_id || user?.salon_id
			};

			if (!dataToSend.salon_id) {
				throw new Error('Salon ID topilmadi');
			}

			console.log('📮 Context.jsx - yuborilayotgan data:', dataToSend)
			console.log('📮 JSON stringify:', JSON.stringify(dataToSend, null, 2))

			const response = await fetch(schedulesUrl, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(dataToSend),
			});

			console.log('Response status:', response.status);

			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();
					console.error('❌ Full error response:', JSON.stringify(errorData, null, 2));

					if (Array.isArray(errorData?.detail)) {
						const detailedErrors = errorData.detail.map((err, idx) => {
							const field = err.loc ? err.loc.join('.') : 'unknown';
							const msg = err.msg || 'unknown error';
							const inputValue = err.input;
							return `[${idx}] Field: ${field}, Error: ${msg}, Input: ${JSON.stringify(inputValue)}`;
						}).join('\n');

						console.error('Validation errors:\n', detailedErrors);
						errorMessage = errorData.detail[0]?.msg || errorMessage;
					} else if (typeof errorData?.detail === 'string') {
						errorMessage = errorData.detail;
					} else {
						errorMessage = errorData?.message || errorData?.error || errorMessage;
					}
				} else {
					const errorText = await response.text();
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();
			console.log('✅ Schedule yaratildi:', data);

			const newSchedule = data?.data || data;
			setSchedules(prev => [...prev, newSchedule]);

			await fetchSchedules();
			await fetchGroupedSchedules();

			return data;
		} catch (error) {
			console.error('❌ Schedule yaratishda xatolik:', error);
			setSchedulesError(error.message);
			throw error;
		} finally {
			setSchedulesLoading(false);
		}
	};
	// Fetch grouped schedules - schedules grouped by weekdays from production server
	const fetchGroupedSchedules = async () => {
		setGroupedSchedulesLoading(true);
		setGroupedSchedulesError(null);

		try {
			const token = getAuthToken();
			const headers = {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json',
			};

			// Explicit backend endpoint requested
			const resp = await fetch(scheduleGroupedUrl, { method: 'GET', headers });
			if (!resp.ok) {
				let errMsg = '';
				try {
					const errJson = await resp.json();
					errMsg = errJson?.message || '';
				} catch {
					const errText = await resp.text();
					errMsg = errText || `HTTP ${resp.status}`;
				}
				throw new Error(errMsg || 'Failed to fetch grouped schedules');
			}
			const data = await resp.json();

			console.log('Grouped schedules fetched:', data);

			// Filter grouped schedules by salon_id if user has salon_id
			let filteredGroupedSchedules = data.data || [];
			if (user && user.salon_id) {
				filteredGroupedSchedules = filteredGroupedSchedules
					.map(daySchedules => daySchedules.filter(schedule => schedule.salon_id === user.salon_id))
					.filter(daySchedules => daySchedules.length > 0);
			}

			setGroupedSchedules(filteredGroupedSchedules);
		} catch (error) {
			console.error('Error fetching grouped schedules:', error);
			setGroupedSchedulesError(error.message);
			setGroupedSchedules([]);
		} finally {
			setGroupedSchedulesLoading(false);
		}
	};

	// Create new service
	const createService = async (serviceData) => {
		setServicesLoading(true);
		setServicesError(null);

		try {
			const token = getAuthToken();

			// Add salon_id from current user if not provided
			const dataToSend = {
				...serviceData,
				salon_id: serviceData.salon_id || user?.salon_id
			};

			const response = await fetch(servicesUrl, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(dataToSend),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Service created:', data);

				// Add new service to existing services
				setServices(prevServices => [...prevServices, data]);

				// Refresh services to get updated list
				await fetchServices();

				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to create service');
			}
		} catch (error) {
			console.error('Error creating service:', error);
			setServicesError(error.message);
			throw error;
		} finally {
			setServicesLoading(false);
		}
	};


	// Get all users
	const fetchAllUsers = async (page = 1, limit = 10) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${API_BASE_URL}/users?page=${page}&limit=${limit}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('All users fetched:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch all users');
			}
		} catch (error) {
			console.error('Error fetching all users:', error);
			throw error;
		}
	};

	// Get user by ID
	const fetchUserById = async (userId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('User fetched by ID:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch user by ID');
			}
		} catch (error) {
			console.error('Error fetching user by ID:', error);
			throw error;
		}
	};


	// ===== PAYMENT API FUNCTIONS =====

	// Create payment
	const createPayment = async (paymentData) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${paymentUrl}/create`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(paymentData),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Payment created:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to create payment');
			}
		} catch (error) {
			console.error('Error creating payment:', error);
			throw error;
		}
	};

	// Verify payment
	const verifyPayment = async (paymentId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${paymentUrl}/verify/${paymentId}`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Payment verified:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to verify payment');
			}
		} catch (error) {
			console.error('Error verifying payment:', error);
			throw error;
		}
	};

	// Get payment status
	const getPaymentStatus = async (paymentId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${paymentUrl}/status/${paymentId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Payment status:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to get payment status');
			}
		} catch (error) {
			console.error('Error getting payment status:', error);
			throw error;
		}
	};

	// ===== SMS API FUNCTIONS =====

	// Send SMS
	const sendSMS = async (phoneNumber, message) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${smsUrl}/send`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ phone_number: phoneNumber, message }),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('SMS sent:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to send SMS');
			}
		} catch (error) {
			console.error('Error sending SMS:', error);
			throw error;
		}
	};

	// Get SMS status
	const getSMSStatus = async (smsId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${smsUrl}/status/${smsId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('SMS status:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to get SMS status');
			}
		} catch (error) {
			console.error('Error getting SMS status:', error);
			throw error;
		}
	};

	// ===== TRANSLATION API FUNCTIONS =====

	// Translate text
	const translateText = async (text, targetLanguage) => {
		try {
			const response = await fetch(`${translationUrl}/translate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ text, target_language: targetLanguage }),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Text translated:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to translate text');
			}
		} catch (error) {
			console.error('Error translating text:', error);
			throw error;
		}
	};

	// Get supported languages
	const getSupportedLanguages = async () => {
		try {
			const response = await fetch(`${translationUrl}/languages`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Supported languages:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to get supported languages');
			}
		} catch (error) {
			console.error('Error getting supported languages:', error);
			throw error;
		}
	};

	// ===== EXTENDED APPOINTMENT API FUNCTIONS =====

	// Get appointment by ID
	const getAppointmentById = async (appointmentId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${appointmentsUrl}/${appointmentId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Appointment fetched:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch appointment');
			}
		} catch (error) {
			console.error('Error fetching appointment:', error);
			throw error;
		}
	};

	// Appointment statusini o'zgartirish
	const updateAppointmentStatus = async (appointmentId, status) => {
		try {
			const token = getAuthToken();

			if (!token) {
				throw new Error('Tizimga kirish tokeni topilmadi');
			}

			console.log(`📤 Updating appointment ${appointmentId} to status: ${status}`);

			const response = await fetch(`${appointmentsUrl}/${appointmentId}/status`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ status }),
			});

			console.log('📥 Response status:', response.status);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('❌ Error response:', errorData);
				throw new Error(errorData.message || errorData.detail || 'Status o\'zgartirishda xatolik');
			}

			const data = await response.json();
			console.log('✅ Status o\'zgartirildi:', data);

			// Appointments ro'yxatini yangilash
			setAppointments(prev =>
				prev.map(app =>
					app.id === appointmentId
						? { ...app, status, updated_at: new Date().toISOString() }
						: app
				)
			);

			// Combined appointments ham yangilansin
			setCombinedAppointments(prev =>
				prev.map(app =>
					app.id === appointmentId
						? { ...app, status, updated_at: new Date().toISOString() }
						: app
				)
			);

			// Agar salon_id mavjud bo'lsa, qayta yuklash
			if (user?.salon_id) {
				await fetchCombinedAppointments(user.salon_id);
			}

			return data;
		} catch (error) {
			console.error('❌ Status o\'zgartirishda xatolik:', error);
			throw error;
		}
	};

	// Appointment ni bekor qilish
	const cancelAppointment = async (appointmentId, cancellationReason) => {
		try {
			const token = getAuthToken();

			if (!token) {
				throw new Error('Tizimga kirish tokeni topilmadi');
			}

			console.log(`📤 Cancelling appointment ${appointmentId}`);

			const response = await fetch(`${appointmentsUrl}/${appointmentId}/cancel`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
				body: JSON.stringify({ cancellation_reason: cancellationReason }),
			});

			console.log('📥 Response status:', response.status);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('❌ Error response:', errorData);
				throw new Error(errorData.message || errorData.detail || 'Bekor qilishda xatolik');
			}

			const data = await response.json();
			console.log('✅ Appointment bekor qilindi:', data);

			// Appointments ro'yxatini yangilash
			setAppointments(prev =>
				prev.map(app =>
					app.id === appointmentId
						? {
							...app,
							status: 'cancelled',
							is_cancelled: true,
							cancellation_reason: cancellationReason,
							updated_at: new Date().toISOString()
						}
						: app
				)
			);

			// Combined appointments ham yangilansin
			setCombinedAppointments(prev =>
				prev.map(app =>
					app.id === appointmentId
						? {
							...app,
							status: 'cancelled',
							is_cancelled: true,
							cancellation_reason: cancellationReason,
							updated_at: new Date().toISOString()
						}
						: app
				)
			);

			// Agar salon_id mavjud bo'lsa, qayta yuklash
			if (user?.salon_id) {
				await fetchCombinedAppointments(user.salon_id);
			}

			return data;
		} catch (error) {
			console.error('❌ Bekor qilishda xatolik:', error);
			throw error;
		}
	};

	// Get employee by ID
	const getEmployeeById = async (employeeId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${employeesUrl}/${employeeId}`, {  // Fixed: employeesUrl
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Employee fetched:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch employee');
			}
		} catch (error) {
			console.error('Error fetching employee:', error);
			throw error;
		}
	};

	// Update employee
	const updateEmployee = async (employeeId, employeeData) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${employeesUrl}/${employeeId}`, {  // Fixed: employeesUrl
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(employeeData),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Employee updated:', data);
				await fetchEmployees(); // Refresh employees
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update employee');
			}
		} catch (error) {
			console.error('Error updating employee:', error);
			throw error;
		}
	};

	// Delete employee
	const deleteEmployee = async (employeeId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${employeesUrl}/${employeeId}`, {  // Fixed: employeesUrl
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				console.log('Employee deleted successfully');
				await fetchEmployees(); // Refresh employees
				return true;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete employee');
			}
		} catch (error) {
			console.error('Error deleting employee:', error);
			throw error;
		}
	};

	// Get salon by ID
	const getSalonById = async (salonId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${salonsUrl}/${salonId}`, {  // Fixed: salonsUrl
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Salon fetched:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch salon');
			}
		} catch (error) {
			console.error('Error fetching salon:', error);
			throw error;
		}
	};

	// Create salon
	const createSalon = async (salonData) => {
		try {
			const token = getAuthToken();
			const response = await fetch(salonsUrl, {  // Fixed: salonsUrl, removed /create assuming POST to base
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(salonData),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Salon created:', data);
				await fetchSalons(); // Refresh salons
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to create salon');
			}
		} catch (error) {
			console.error('Error creating salon:', error);
			throw error;
		}
	};

	// Delete salon
	const deleteSalon = async (salonId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${salonsUrl}/${salonId}`, {  // Fixed: salonsUrl
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
			});

			if (response.ok) {
				console.log('Salon deleted successfully');
				await fetchSalons(); // Refresh salons
				return true;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete salon');
			}
		} catch (error) {
			console.error('Error deleting salon:', error);
			throw error;
		}
	};

	// ===== EXTENDED SERVICE API FUNCTIONS =====

	// Get service by ID
	const getServiceById = async (serviceId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${servicesUrl}/${serviceId}`, {  // Fixed: servicesUrl
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Service fetched:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch service');
			}
		} catch (error) {
			console.error('Error fetching service:', error);
			throw error;
		}
	};

	// Update service
	const updateService = async (serviceId, serviceData) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${servicesUrl}/${serviceId}`, {  // Fixed: servicesUrl
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(serviceData),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Service updated:', data);
				await fetchServices(); // Refresh services
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update service');
			}
		} catch (error) {
			console.error('Error updating service:', error);
			throw error;
		}
	};

	// Delete service
	const deleteService = async (serviceId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${servicesUrl}/${serviceId}`, {  // Fixed: servicesUrl
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				console.log('Service deleted successfully');
				await fetchServices(); // Refresh services
				return true;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete service');
			}
		} catch (error) {
			console.error('Error deleting service:', error);
			throw error;
		}
	};

	// ===== EXTENDED SCHEDULE API FUNCTIONS =====



	// Context.jsx - updateSchedule funksiyasini yangilash
	const updateSchedule = async (scheduleId, scheduleData) => {
		try {
			const token = getAuthToken();

			console.log('📤 Updating schedule with ID:', scheduleId);
			console.log('📤 Schedule data:', JSON.stringify(scheduleData, null, 2));

			const response = await fetch(`${schedulesUrl}/${scheduleId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
				body: JSON.stringify(scheduleData),
			});

			console.log('📥 Response status:', response.status);

			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();
					console.error('❌ Full error response:', JSON.stringify(errorData, null, 2));

					// FastAPI validation errors
					if (Array.isArray(errorData?.detail)) {
						const detailedErrors = errorData.detail.map((err, idx) => {
							const field = err.loc ? err.loc.join('.') : 'unknown';
							const msg = err.msg || 'unknown error';
							const inputValue = err.input;
							return `[${idx}] Field: ${field}, Error: ${msg}, Input: ${JSON.stringify(inputValue)}`;
						}).join('\n');

						console.error('❌ Validation errors:\n', detailedErrors);
						errorMessage = errorData.detail[0]?.msg || errorMessage;
					} else if (typeof errorData?.detail === 'string') {
						errorMessage = errorData.detail;
					} else {
						errorMessage = errorData?.message || errorData?.error || errorMessage;
					}
				} else {
					const errorText = await response.text();
					console.error('❌ Error text:', errorText);
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();
			console.log('✅ Schedule updated:', data);
			await fetchSchedules();
			await fetchGroupedSchedules();
			return data;
		} catch (error) {
			console.error('❌ Error updating schedule:', error);
			throw error;
		}
	};

	// Delete schedule
	const deleteSchedule = async (scheduleId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${schedulesUrl}/${scheduleId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				console.log('Schedule deleted successfully');
				await fetchSchedules(); // Refresh schedules
				await fetchGroupedSchedules(); // Grouped schedules ham yangilansin
				return true;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete schedule');
			}
		} catch (error) {
			console.error('Error deleting schedule:', error);
			throw error;
		}
	};

	// Get schedule by ID
	const getScheduleById = async (scheduleId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${schedulesUrl}/${scheduleId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Schedule fetched:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch schedule');
			}
		} catch (error) {
			console.error('Error fetching schedule:', error);
			throw error;
		}
	};
	// ===== CHAT API FUNCTIONS =====
	// ===== CHAT API FUNCTIONS =====
// Fetch conversations for employee - URL ni o'zgartirish
const fetchConversations = async () => {
	if (!user || (user.role !== 'employee' && user.role !== 'private_admin' && user.role !== 'private_salon_admin')) {
		console.error('Only employees and admins can fetch conversations');
		return;
	}

	setConversationsLoading(true);
	setConversationsError(null);

	try {
		const token = getAuthToken();
		console.log('📤 Fetching conversations for user:', user.id, 'Role:', user.role);
		
		// ✅ Employee va Admin uchun alohida endpoint
		const response = await fetch(`${messagesUrl}/employee/conversations`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		console.log('📥 Conversations response status:', response.status);

		if (response.ok) {
			const data = await response.json();
			console.log('✅ Conversations fetched:', data);
			
			// Backend dan kelgan ma'lumotlarni normalize qilish
			const conversationsList = data.data || data || [];
			
			// ✅ participant obyektidan ma'lumotlarni olish
			const normalizedConversations = conversationsList.map(conv => {
				const participant = conv.participant || {};
				
				return {
					...conv,
					// participant dan ma'lumotlarni olish
					other_user_id: participant.id || conv.other_user_id || conv.user_id || conv.id,
					other_user_name: participant.name || conv.other_user_name || conv.user_name || conv.name || 'Unknown User',
					other_user_avatar: participant.avatar_url || conv.user_avatar_url || conv.other_user_avatar || conv.user_avatar || conv.avatar || null,
					// Qo'shimcha ma'lumotlar
					chat_id: conv.chat_id,
					chat_type: conv.chat_type,
					last_message: conv.last_message || '',
					last_message_time: conv.last_message_time || null,
					unread_count: conv.unread_count || 0
				};
			});
			
			console.log('📊 Normalized conversations:', normalizedConversations);
			setConversations(normalizedConversations);
		} else {
			const contentType = response.headers.get('content-type');
			let errorMessage = `HTTP ${response.status}`;

			if (contentType?.includes('application/json')) {
				const errorData = await response.json();
				console.error('❌ Error response:', errorData);
				
				if (typeof errorData?.detail === 'string') {
					errorMessage = errorData.detail;
				} else {
					errorMessage = errorData?.message || errorData?.error || errorMessage;
				}
			} else {
				const errorText = await response.text();
				console.error('❌ Error text:', errorText);
				errorMessage = errorText || errorMessage;
			}

			throw new Error(errorMessage);
		}
	} catch (error) {
		console.error('❌ Error fetching conversations:', error);
		setConversationsError(error.message);
		setConversations([]);
	} finally {
		setConversationsLoading(false);
	}
};

	// Fetch messages for employee - URL ni o'zgartirish
	const fetchMessages = async (userId) => {
  // ✅ userId tekshirish
  if (!userId) {
    console.error('❌ fetchMessages: userId is required');
    setMessagesError('User ID topilmadi');
    return;
  }

  if (!user || (user.role !== 'employee' && user.role !== 'private_admin' && user.role !== 'private_salon_admin')) {
    console.error('Only employees and admins can fetch messages');
    return;
  }

  setMessagesLoading(true);
  setMessagesError(null);

  try {
    const token = getAuthToken();
    
    console.log('📤 Fetching messages for user:', userId);
    
    const response = await fetch(`${messagesUrl}/employee/conversation/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📥 Messages response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Messages fetched:', data);
      
      const messagesList = data.data?.messages || data.messages || data.data || data || [];
      console.log('📊 Messages list length:', messagesList.length);
      
      setMessages(messagesList);
      setCurrentConversation(userId);
    } else {
      const contentType = response.headers.get('content-type');
      let errorMessage = `HTTP ${response.status}`;

      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        
        if (Array.isArray(errorData?.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || JSON.stringify(err)).join(', ');
        } else if (typeof errorData?.detail === 'string') {
          errorMessage = errorData.detail;
        } else {
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Error text:', errorText);
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    setMessagesError(error.message);
    setMessages([]);
  } finally {
    setMessagesLoading(false);
  }
};

	// Send message from employee - URL ni o'zgartirish
	const sendMessage = async (receiverId, messageText, messageType = 'text') => {
		if (!user || user.role !== 'employee') {
			console.error('Only employees can send messages');
			return;
		}

		try {
			const token = getAuthToken();
			// ✅ Employee uchun alohida endpoint
			const response = await fetch(`${messagesUrl}/employee/send`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					receiver_id: receiverId,
					message_text: messageText,
					message_type: messageType
				}),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Message sent:', data);

				if (currentConversation === receiverId) {
					setMessages(prevMessages => [...prevMessages, {
						id: data.data?.id,
						sender_id: user.id,
						sender_type: 'employee',
						receiver_id: receiverId,
						receiver_type: 'user',
						message_text: messageText,
						message_type: messageType,
						is_read: false,
						created_at: data.data?.created_at || new Date().toISOString()
					}]);
				}

				await fetchConversations();
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to send message');
			}
		} catch (error) {
			console.error('Error sending message:', error);
			throw error;
		}
	};

	// Mark conversation as read for employee - URL ni o'zgartirish
	const markConversationAsRead = async (userId) => {
  // ✅ userId tekshirish
  if (!userId) {
    console.error('❌ markConversationAsRead: userId is required');
    return;
  }

  if (!user || (user.role !== 'employee' && user.role !== 'private_admin' && user.role !== 'private_salon_admin')) {
    console.error('Only employees and admins can mark conversation as read');
    return;
  }

  try {
    const token = getAuthToken();
    
    console.log('📤 Marking conversation as read for user:', userId);
    
    const response = await fetch(`${messagesUrl}/employee/conversation/${userId}/mark-read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📥 Mark read response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conversation marked as read:', data);

      // ✅ Conversations ro'yxatini yangilash
      setConversations(prevConversations =>
        prevConversations.map(conv => {
          const convUserId = conv.other_user_id || conv.user_id || conv.id;
          return convUserId === userId
            ? { ...conv, unread_count: 0 }
            : conv;
        })
      );

      return data;
    } else {
      const contentType = response.headers.get('content-type');
      let errorMessage = `HTTP ${response.status}`;

      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        
        if (typeof errorData?.detail === 'string') {
          errorMessage = errorData.detail;
        } else {
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Error text:', errorText);
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error marking conversation as read:', error);
    // ✅ Xatolikni throw qilmaslik - faqat log
    // throw error;
  }
};


	// Get unread messages count
	const getUnreadCount = async () => {
		if (!user || (user.role !== 'employee' && user.role !== 'private_admin')) {
			console.error('Only employees and admin2 can get unread count');
			return 0;
		}

		try {
			// Get unread count from conversations data
			if (conversations && conversations.length > 0) {
				const totalUnread = conversations.reduce((total, conv) => {
					return total + (conv.unread_count || 0);
				}, 0);
				return totalUnread;
			}
			return 0;
		} catch (error) {
			console.error('Error getting unread count:', error);
			return 0;
		}
	};

	// Mark messages as read
	const markMessagesAsRead = async (userId) => {
		if (!user || user.role !== 'employee') {
			console.error('Only employees can mark messages as read');
			return;
		}

		try {
			const token = getAuthToken();
			const response = await fetch(`${messagesUrl}/mark-read`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					user_id: userId
				}),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Messages marked as read:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to mark messages as read');
			}
		} catch (error) {
			console.error('Error marking messages as read:', error);
			throw error;
		}
	};

	// Fetch employees - supports salon filter; robust to 404 "Topilmadi" by trying fallbacks
	const fetchEmployees = async (overrideSalonId) => {
		const idToUse = overrideSalonId ?? FORCE_SALON_ID ?? (salonProfile?.id) ?? (user && user.salon_id);

		setEmployeesLoading(true);
		setEmployeesError(null);

		try {
			const headers = {
				'Content-Type': 'application/json',
				...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
			};

			// UUID formatni tekshirish (backend UUID talab qiladi)
			const isValidUUID = (v) => typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v);

			// Try multiple URL variants to handle different backend routes, faqat ID to‘g‘ri bo‘lsa
			const urlVariants = isValidUUID(idToUse)
				? [
					`${employeesUrl}/salon/${idToUse}?page=1&limit=100`,
					`${employeesUrl}/salon?id=${idToUse}&page=1&limit=100`,
					`${employeesUrl}?salon_id=${idToUse}&page=1&limit=100`,
				]
				: [
					// ID yo‘q yoki noto‘g‘ri — umumiy ro‘yxatni olib, keyin UI’da filtr yoki kontekstdan foydalanamiz
					`${employeesUrl}?page=1&limit=100`,
				];

			let success = false;
			for (const url of urlVariants) {
				console.log('Fetching employees from:', url);
				const response = await fetch(url, { method: 'GET', headers });

				if (response.ok) {
					const responseData = await response.json();
					console.log('Employees response:', responseData);

					const items = responseData?.data ?? responseData ?? [];
					setEmployees(items);

					console.log('Employees loaded:', items.length);
					success = true;
					break;
				}

				// Gracefully ignore 404 Topilmadi and try next variant
				if (response.status === 404) {
					let errJson = {};
					try { errJson = await response.json(); } catch { }
					console.warn('Employees endpoint 404, trying next variant:', errJson);
					continue;
				}

				// Other errors: capture detail and stop
				let errorData = {};
				try { errorData = await response.json(); } catch { }
				const detailText = Array.isArray(errorData?.detail)
					? errorData.detail.map(d => (typeof d === 'string' ? d : (d?.msg || d?.message || JSON.stringify(d)))).join('; ')
					: (typeof errorData?.detail === 'string' ? errorData.detail : (errorData?.detail ? JSON.stringify(errorData.detail) : ''));
				const msg = errorData?.message || errorData?.error || detailText || 'Failed to fetch employees';
				console.error('Error response:', { status: response.status, error: msg, raw: errorData });
				throw new Error(msg);
			}

			if (!success) {
				// No variant succeeded; treat as empty list rather than hard error
				setEmployees([]);

				setEmployeesError(null);
				console.warn('No employees found for salon or endpoint; returned empty list.');
			}
		} catch (error) {
			console.error('Error fetching employees:', error);
			setEmployeesError(error.message);
			setEmployees([]);

		} finally {
			setEmployeesLoading(false);
		}
	};

	// Create new employee
	const createEmployee = async (employeeData) => {
		setEmployeesLoading(true);
		setEmployeesError(null);

		try {
			const token = getAuthToken();

			if (!token) {
				throw new Error('Tizimga kirish tokeni topilmadi');
			}

			// Salon ID tekshirish
			const salonId = FORCE_SALON_ID || employeeData.salon_id || user?.salon_id;
			if (!salonId) {
				throw new Error('Salon ID topilmadi');
			}

			// Backend kutgan formatda data tayyorlash
			const dataToSend = {
				salon_id: salonId,
				employee_name: employeeData.employee_name,
				employee_phone: employeeData.employee_phone,
				employee_email: employeeData.employee_email,
				employee_password: employeeData.employee_password,
				username: employeeData.username,
				profession: employeeData.profession,
				role: employeeData.role || 'employee'
			};

			console.log('📤 Yuborilayotgan ma\'lumot:', dataToSend);
			console.log('🔗 URL:', employeesUrl);

			const response = await fetch(employeesUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {})
				},
				body: JSON.stringify(dataToSend),
			});

			console.log('📥 Response status:', response.status);

			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();
					console.error('❌ Error response:', errorData);

					// FastAPI validation errors
					if (Array.isArray(errorData?.detail)) {
						errorMessage = errorData.detail.map(err => {
							const field = err.loc ? err.loc[err.loc.length - 1] : '';
							return `${field}: ${err.msg}`;
						}).join(', ');
					} else if (typeof errorData?.detail === 'string') {
						errorMessage = errorData.detail;
					} else {
						errorMessage = errorData?.message || errorData?.error || errorMessage;
					}
				} else {
					const errorText = await response.text();
					console.error('❌ Error text:', errorText);
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();
			console.log('✅ Xodim yaratildi:', data);

			// State'ni yangilash
			const newEmployee = data?.data || data;
			setEmployees(prev => [...prev, newEmployee]);

			// Ro'yxatni qayta yuklash
			await fetchEmployees();

			return data;
		} catch (error) {
			console.error('❌ Xodim yaratishda xatolik:', error);
			setEmployeesError(error.message);
			throw error;
		} finally {
			setEmployeesLoading(false);
		}
	};

	// Fetch services - all services from production server
	const fetchServices = async () => {
		setServicesLoading(true);
		setServicesError(null);

		try {
			const token = getAuthToken();
			const response = await fetch(servicesUrl, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Services fetched:', data);
				setServices(data.data || []);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch services');
			}
		} catch (error) {
			console.error('Error fetching services:', error);
			setServicesError(error.message);
			setServices([]);
		} finally {
			setServicesLoading(false);
		}
	};

	// Fetch all data when user logs in and has salon_id
	useEffect(() => {
		if (isAuthenticated && user && user.salon_id) {
			(async () => {
				// Avval adminning salonini yuklab olaylik
				try {
					await fetchAdminSalon();
				} catch (e) {
					console.warn('Admin my-salon fetch failed, continue loading others:', e?.message || e);
				}
				// Keyin xodimlarni yuklaymiz
				await fetchEmployees();
				// Zarurat bo'lsa quyidagilarni ham ketma-ket chaqiramiz
				// await fetchAppointments(user.salon_id);
				// await fetchSchedules();
				// await fetchServices();
				// await fetchSalons();
			})();
		}
	}, [isAuthenticated, user]);

	const handleConfirm = async () => {
		try {
			await updateAppointmentStatus(selectedElement.id, 'confirmed');
			closeRightSidebar();
		} catch (error) {
			console.error('Status o\'zgartirishda xato:', error);
			alert(error.message);
		}
	};


	// RightSidebar uchun state
	const [selectedElement, setSelectedElement] = useState(null)
	const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false)

	// Schedule sahifasi uchun state
	const [isDragging, setIsDragging] = useState(false)
	const [startX, setStartX] = useState(0)
	const [scrollLeft, setScrollLeft] = useState(0)
	const [selectDay, setSelectDay] = useState([])

	// Employees sahifasi uchun state
	const [waitingEmp, setWaitingEmp] = useState(JSON.parse(localStorage.getItem("waitingEmp")) || [])

	// Home sahifasi uchun state
	const [selectedFilter, setSelectedFilter] = useState(null)


	// Schedule qo'shish uchun
	const [addSched, setAddSched] = useState(false)
	const [schedArr, setSchedArr] = useState([])
	const [commentsArr, setCommentsArr] = useState([])



	// Profile uchun data: endi obyekt ko'rinishida saqlanadi
	const [salonProfile, setSalonProfile] = useState(null)
	// Eski aliaslar olib tashlandi: endi faqat salonProfile ishlatiladi
	const [adminSalonLoading, setAdminSalonLoading] = useState(false)
	const [adminSalonError, setAdminSalonError] = useState(null)

	// Admin salon ma'lumotlarini olish: avval GET `/admin/my-salon`, keyin kerak bo'lsa `/salons/:id`
	const fetchAdminSalon = async (salonIdOverride = null) => {
		setAdminSalonLoading(true);
		setAdminSalonError(null);

		try {
			const token = getAuthToken();

			// 1) Avvalo /admin/my-salon orqali aniq admin biriktirilgan salonni olishga urinamiz
			if (token) {
				console.log('[fetchAdminSalon] Trying GET /admin/my-salon');
				const mySalonResp = await fetch(adminMySalonUrl, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
				});

				if (mySalonResp.ok) {
					const mySalonData = await mySalonResp.json();
					const salonObj = mySalonData?.data || mySalonData;
					if (salonObj && salonObj.id) {
						// ✅ Avval admin/my-salon dan olingan ma'lumot, keyin to'liq detailni olib birlashtiramiz
						try {
							const detail = await getSalonById(salonObj.id);
							const detailObj = detail?.data || detail;
							const mergedRaw = { ...salonObj, ...detailObj };
							const merged = normalizeSalonForProfile(mergedRaw);
							setSalonProfile(merged);
							currentSalonIdRef.current = merged.id;
							console.log('✅ Admin my-salon + detail merged:', merged.id);
							return merged;
						} catch (e) {
							// Agar detail olishda xato bo'lsa, my-salon obyektidan foydalanamiz
							const normalized = normalizeSalonForProfile(salonObj);
							setSalonProfile(normalized);
							currentSalonIdRef.current = normalized.id;
							console.warn('[fetchAdminSalon] Detail fetch failed, using my-salon object:', e?.message || e);
							return normalized;
						}
					}
				} else {
					let mySalonMsg = `HTTP ${mySalonResp.status}`;
					try {
						const errJson = await mySalonResp.json();
						const detailText = Array.isArray(errJson?.detail)
							? errJson.detail.map(d => (typeof d === 'string' ? d : (d?.msg || d?.message || JSON.stringify(d)))).join('; ')
							: (typeof errJson?.detail === 'string' ? errJson.detail : (errJson?.message || errJson?.error || ''));
						mySalonMsg = detailText || mySalonMsg;
					} catch {
						try { mySalonMsg = await mySalonResp.text(); } catch { }
					}
					console.warn('[fetchAdminSalon] /admin/my-salon failed:', mySalonMsg);
					// Tushunarli xabar bo'lishi uchun xatoni state'ga yozamiz, lekin ID orqali fallback qilamiz
					if (mySalonResp.status === 404) {
						setAdminSalonError('Admin uchun salon topilmadi');
					} else if (mySalonResp.status === 403) {
						setAdminSalonError('Ruxsat yo‘q: admin salon maʼlumotlariga kirish taqiqlangan');
					}
				}
			}

			// 2) Fallback: berilgan yoki foydalanuvchidan olingan ID orqali `/salons/:id`
			const targetId = salonIdOverride || FORCE_SALON_ID || salonProfile?.id || user?.salon_id || currentSalonIdRef.current;
			if (!targetId) {
				throw new Error('Salon ID topilmadi. Iltimos, admin foydalanuvchiga salon biriktiring yoki ID kiriting.');
			}

			console.log('[fetchAdminSalon] Fallback GET /salons/:id id=', targetId);
			const detailResponse = await fetch(`${salonDetailUrl}/${targetId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
			});

			if (detailResponse.ok) {
				const detailData = await detailResponse.json();
				const salonObj = detailData?.data || detailData;
				if (!salonObj || !salonObj.id) {
					throw new Error('Salon maʼlumotlari topilmadi');
				}
				const normalizedById = normalizeSalonForProfile(salonObj);
				setSalonProfile(normalizedById);
				currentSalonIdRef.current = normalizedById.id;
				console.log('✅ Salon fetched by ID:', normalizedById.id);
				return normalizedById;
			} else {
				let message = `Failed to fetch salon by ID (HTTP ${detailResponse.status})`;
				try {
					const errorData = await detailResponse.json();
					const detailText = Array.isArray(errorData?.detail)
						? errorData.detail.map(d => (typeof d === 'string' ? d : (d?.msg || d?.message || JSON.stringify(d)))).join('; ')
						: (typeof errorData?.detail === 'string' ? errorData.detail : (errorData?.message || errorData?.error || ''));
					message = detailText || message;
				} catch (_) {
					try { message = await detailResponse.text(); } catch { }
				}

				if (detailResponse.status === 404) {
					message = 'Salon topilmadi';
				}
				if (detailResponse.status === 401) {
					message = 'Avtorizatsiya xatosi: token yaroqsiz yoki berilmagan.';
				}
				throw new Error(message);
			}
		} catch (error) {
			console.error('❌ Error fetching salon by ID:', error);
			setAdminSalonError(error.message);
			setSalonProfile(null);
			throw error;
		} finally {
			setAdminSalonLoading(false);
		}
	};



	const handleAddWaitingEmp = async (ids) => {
		try {
			if (!Array.isArray(ids) || ids.length === 0) return;

			const token = getAuthToken();

			const resp = await fetch(employeeBulkWaitingStatusUrl, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ employee_ids: ids, is_waiting: true }),
			});

			if (!resp.ok) {
				let msg = `HTTP ${resp.status}`;
				try {
					const err = await resp.json();
					msg = err?.message || err?.detail || msg;
				} catch {
					try { msg = await resp.text(); } catch { }
				}
				throw new Error(msg);
			}

			console.log('✅ Backend muvaffaqiyatli yangilandi');

			// State'larni yangilash
			setEmployees((prev) =>
				prev.map(e => ids.includes(e.id) ? { ...e, is_waiting: true } : e)
			);

			setWaitingEmp((prev) => {
				const toAdd = employees.filter(
					(employee) => ids.includes(employee.id) && !prev.some((emp) => emp.id === employee.id)
				);
				const newWaitingEmp = [...prev, ...toAdd];
				localStorage.setItem('waitingEmp', JSON.stringify(newWaitingEmp));
				return newWaitingEmp;
			});

			setIsCheckedItem([]);
			console.log('✅ Xodimlar waiting holatiga o\'tkazildi:', ids);
		} catch (error) {
			console.error('❌ Xato:', error);
			alert(`Xatolik: ${error.message}`);
		}
	};

	const handleRemoveWaitingEmp = async (ids) => {
		try {
			if (!Array.isArray(ids) || ids.length === 0) return;

			const token = getAuthToken();
			const resp = await fetch(employeeBulkWaitingStatusUrl, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ employee_ids: ids, is_waiting: false }),
			});

			if (!resp.ok) {
				let msg = `HTTP ${resp.status}`;
				try {
					const err = await resp.json();
					msg = err?.message || err?.detail || msg;
				} catch {
					try { msg = await resp.text(); } catch { }
				}
				throw new Error(msg);
			}

			// Backend muvaffaqiyatli yangilandi — UI state'ni sinxronlaymiz
			setEmployees((prev) => prev.map(e => ids.includes(e.id) ? { ...e, is_waiting: false } : e));

			// waitingEmp ro'yxatini yangilash (reloadsiz)
			setWaitingEmp((prev) => {
				const newWaitingEmp = prev.filter((emp) => !ids.includes(emp.id));
				localStorage.setItem('waitingEmp', JSON.stringify(newWaitingEmp));
				return newWaitingEmp;
			});
		} catch (error) {
			console.error('❌ Waiting statusni yangilashda xato (remove):', error);
		}
	};

	const [isCheckedItem, setIsCheckedItem] = useState([])

	const { t, i18n } = useTranslation();
	const language = localStorage.getItem("i18nextLng")
	const handleChange = (event) => {
		const selectedLang = event.target.value;
		i18n.changeLanguage(selectedLang);
		localStorage.setItem('language', selectedLang);
	}

	// RightSidebar ochish funksiyasi
	const openRightSidebar = (element) => {
		setSelectedElement(element)
		setIsRightSidebarOpen(true)
	}

	// RightSidebar yopish funksiyasi
	const closeRightSidebar = () => {
		setSelectedElement(null)
		setIsRightSidebarOpen(false)
	}

	const [confirmModal, setConfirmModal] = useState(true)




	// Schedule uchun funksiyalar
	const handleMouseDown = (e, containerRef) => {
		if (!containerRef.current) return
		e.preventDefault()
		setIsDragging(true)
		setStartX(e.pageX - containerRef.current.offsetLeft)
		setScrollLeft(containerRef.current.scrollLeft)
	}

	const handleMouseMove = (e, containerRef) => {
		if (!isDragging || !containerRef.current) return
		e.preventDefault()
		const x = e.pageX - containerRef.current.offsetLeft
		const walk = (x - startX) * 2
		containerRef.current.scrollLeft = scrollLeft - walk
	}

	const handleMouseUp = () => {
		setIsDragging(false)
	}

	const scrollRight = (containerRef) => {
		if (containerRef.current) {
			containerRef.current.scrollLeft += 200
		}
	}



	// Bookings state
	const [bookings, setBookings] = useState([]);
	const [bookingsLoading, setBookingsLoading] = useState(false);
	const [bookingsError, setBookingsError] = useState(null);

	// GET bookings by salon_id
	const fetchBookings = async (salonId) => {
		if (!salonId) {
			console.error('Salon ID is required to fetch bookings');
			return;
		}

		setBookingsLoading(true);
		setBookingsError(null);

		try {
			const token = getAuthToken();
			const response = await fetch(
				`${bookingsUrl}?salon_id=${salonId}`,
				{
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
				}
			);

			if (response.ok) {
				const data = await response.json();
				console.log('✅ Bookings fetched:', data);
				setBookings(data.data || data || []);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch bookings');
			}
		} catch (error) {
			console.error('❌ Error fetching bookings:', error);
			setBookingsError(error.message);
			setBookings([]);
		} finally {
			setBookingsLoading(false);
		}
	};

	// POST new booking
	const createBooking = async (bookingData) => {
		setBookingsLoading(true);
		setBookingsError(null);

		try {
			const token = getAuthToken();

			if (!token) {
				throw new Error('Token topilmadi');
			}

			// Salon ID tekshirish
			const salonId = bookingData.salon_id || user?.salon_id;
			if (!salonId) {
				throw new Error('Salon ID topilmadi');
			}

			const dataToSend = {
				salon_id: salonId,
				full_name: bookingData.full_name,
				phone: bookingData.phone,
				time: bookingData.time, // ISO string
				employee_id: bookingData.employee_id
			};

			console.log('📤 Creating booking:', dataToSend);

			const response = await fetch(
				bookingsUrl,
				{
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(dataToSend),
				}
			);

			console.log('📥 Response status:', response.status);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('❌ Error response:', errorData);

				let errorMessage = 'Booking yaratishda xatolik';
				if (Array.isArray(errorData?.detail)) {
					errorMessage = errorData.detail.map(err => {
						const field = err.loc ? err.loc[err.loc.length - 1] : '';
						return `${field}: ${err.msg}`;
					}).join(', ');
				} else if (typeof errorData?.detail === 'string') {
					errorMessage = errorData.detail;
				} else {
					errorMessage = errorData?.message || errorData?.error || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();
			console.log('✅ Booking created:', data);

			// State'ni yangilash
			const newBooking = data?.data || data;
			setBookings(prev => [...prev, newBooking]);

			// Bookinglar ro'yxatini qayta yuklash
			if (salonId) {
				await fetchBookings(salonId);
			}

			return data;
		} catch (error) {
			console.error('❌ Booking yaratishda xatolik:', error);
			setBookingsError(error.message);
			throw error;
		} finally {
			setBookingsLoading(false);
		}
	};


	// Context.jsx'ga qo'shish - Appointments va Bookings ni birlashtirish
	const [combinedAppointments, setCombinedAppointments] = useState([]);

	// Appointments va Bookings ni birlashtirish va sanaga ko'ra saralash
	const fetchCombinedAppointments = async (salonId) => {
		if (!salonId) {
			console.error('Salon ID is required');
			return;
		}

		try {
			// Parallel ravishda ikkala ma'lumotni olish
			await Promise.all([
				fetchAppointments(salonId),
				fetchBookings(salonId)
			]);

			// Appointments va Bookings ni birlashtirish
			const combined = [
				...(appointments || []).map(app => ({
					...app,
					type: 'appointment', // Type qo'shish - qaysi turligini bilish uchun
					date: app.application_date,
					time: app.application_time,
					employee_name: app.employee_name || app.master_name || app.employee || null
				})),
				...(bookings || []).map(book => ({
					...book,
					type: 'booking',
					date: book.time ? new Date(book.time).toISOString().split('T')[0] : null,
					time: book.time ? new Date(book.time).toTimeString().split(' ')[0] : null,
					employee_name: (() => {
						const emp = (employees || []).find(e => String(e.id) === String(book.employee_id));
						if (!emp) return null;
						return [emp.name, emp.surname].filter(Boolean).join(' ').trim();
					})()
				}))
			];

			// Sanaga ko'ra saralash (eng yangi birinchi)
			const sorted = combined.sort((a, b) => {
				const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
				const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
				return dateB - dateA; // O'sish tartibi uchun dateA - dateB
			});

			setCombinedAppointments(sorted);
			console.log('✅ Combined appointments:', sorted.length);
			return sorted;
		} catch (error) {
			console.error('❌ Error fetching combined appointments:', error);
			return [];
		}
	};

	// useEffect - appointments yoki bookings o'zgarganda avtomatik birlashtirish
	useEffect(() => {
		if (user?.salon_id) {
			const combined = [
				...(appointments || []).map(app => ({
					...app,
					type: 'appointment',
					date: app.application_date,
					time: app.application_time,
					employee_name: app.employee_name || app.master_name || app.employee || null
				})),
				...(bookings || []).map(book => ({
					...book,
					type: 'booking',
					date: book.time ? new Date(book.time).toISOString().split('T')[0] : null,
					time: book.time ? new Date(book.time).toTimeString().split(' ')[0].substring(0, 5) : null,
					employee_name: (() => {
						const emp = (employees || []).find(e => String(e.id) === String(book.employee_id));
						if (!emp) return null;
						return [emp.name, emp.surname].filter(Boolean).join(' ').trim();
					})()
				}))
			];

			const sorted = combined.sort((a, b) => {
				const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
				const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
				return dateB - dateA;
			});

			setCombinedAppointments(sorted);
		}
	}, [appointments, bookings, user]);

	// Endi komponentlar appointments bilan bevosita ishlaydi

	let darkImg = [
		{
			img: '/images/home-light.png',
			color: '#9C2BFF',
			style: 'none'
		},
		{
			img: '/images/schedule-dark.png',
			color: 'white',
			style: 'underline'
		},
		{
			img: '/images/group-dark.png',
			color: 'white',
			style: 'underline'
		},
		{
			img: '/images/chat-dark.png',
			color: 'white',
			style: 'underline'
		},
		{
			img: '/images/settings-dark.png',
			color: 'white',
			style: 'underline'
		}
	];

	let lightImg = [
		{
			img: '/images/home-dark.png',
			color: 'white',
			style: 'underline'
		},
		{
			img: '/images/schedule-light.png',
			color: '#9C2BFF',
			style: 'none'
		},
		{
			img: '/images/group-light.png',
			color: '#9C2BFF',
			style: 'none'
		},
		{
			img: '/images/chat-light.png',
			color: '#9C2BFF',
			style: 'none'
		},
		{
			img: '/images/settings-light.png',
			color: '#9C2BFF',
			style: 'none'
		}
	];

	let selectedIcon = JSON.parse(localStorage.getItem("icons"));
	const [selectIcon, setSelectIcon] = useState(selectedIcon || darkImg);
	const whiteBoxRef = useRef(null);

	// ✅ WhiteBox pozitsiyasini hisoblash va o'rnatish
	const moveWhiteBoxToElement = (element, save = true) => {
		if (!element || !whiteBoxRef.current) return;

		const rect = element.getBoundingClientRect();
		const sidebar = element.closest(".sidebar");
		if (!sidebar) return;

		const sidebarRect = sidebar.getBoundingClientRect();
		const whiteBox = whiteBoxRef.current;

		// px → vh/vw
		const topVH = ((rect.top - sidebarRect.top) / window.innerHeight) * 100;
		const leftVW = ((rect.left - sidebarRect.left) / window.innerWidth) * 100;
		const heightVH = (rect.height / window.innerHeight) * 100;
		const widthVW = (rect.width / window.innerWidth) * 100;

		whiteBox.style.top = `${topVH - 2}vh`;
		whiteBox.style.left = `${leftVW}vw`;
		whiteBox.style.height = `${heightVH}vh`;
		whiteBox.style.width = `${widthVW}vw`;

		// localStorage ga saqlash
		if (save) {
			const sidebarItems = document.querySelectorAll('.sidebar-nav-item');
			const elementIndex = Array.from(sidebarItems).indexOf(element);
			if (elementIndex !== -1) {
				localStorage.setItem("selectedSidebarIndex", elementIndex.toString());
			}
		}
	};

	// ✅ Link bosilganda ishlaydigan handler
	const handleClick = (e) => {
		const index = parseInt(e.currentTarget.id);

		// WhiteBox pozitsiyasini yangilash
		moveWhiteBoxToElement(e.currentTarget, true);

		// Iconlarni yangilash
		const updatedIcons = [...darkImg];
		if (index !== 0) {
			updatedIcons[0] = lightImg[0];
			updatedIcons[index] = lightImg[index];
			// Non-admin profil: index 3 bo'lsa, settings iconni lighten qilish
			if (user?.role !== 'private_admin' && index === 3) {
				updatedIcons[4] = lightImg[4];
			}
		} else {
			updatedIcons[0] = darkImg[0];
		}
		setSelectIcon(updatedIcons);
	};

	// ✅ Default pozitsiyani o'rnatish
	const setDefaultWhiteBoxPosition = () => {
		if (!whiteBoxRef.current) return;

		const firstSidebarElement = document.querySelector('.sidebar-nav-item');
		if (firstSidebarElement) {
			moveWhiteBoxToElement(firstSidebarElement, true);

			const updatedIcons = [
				{ img: '/images/home-light.png', color: '#9C2BFF', style: 'none' },
				{ img: '/images/schedule-dark.png', color: 'white', style: 'underline' },
				{ img: '/images/group-dark.png', color: 'white', style: 'underline' },
				{ img: '/images/chat-dark.png', color: 'white', style: 'underline' },
				{ img: '/images/settings-dark.png', color: 'white', style: 'underline' }
			];
			setSelectIcon(updatedIcons);
			localStorage.setItem("selectedSidebarIndex", "0");
		}
	};

	// ✅ Pozitsiyani qayta hisoblash (resize uchun)
	const recalculateWhiteBoxPosition = () => {
		const savedIndexString = localStorage.getItem("selectedSidebarIndex");
		if (!savedIndexString) return;

		const savedIndex = parseInt(savedIndexString);
		const sidebarItems = document.querySelectorAll('.sidebar-nav-item');

		if (sidebarItems[savedIndex]) {
			// false = localStorage ga qayta saqlamaslik
			moveWhiteBoxToElement(sidebarItems[savedIndex], false);
		}
	};

	// ✅ Component mount bo'lganda pozitsiyani yuklash
	useEffect(() => {
		const timer = setTimeout(() => {
			const savedIndexString = localStorage.getItem("selectedSidebarIndex");

			if (savedIndexString && whiteBoxRef.current) {
				try {
					const savedIndex = parseInt(savedIndexString);
					const sidebarItems = document.querySelectorAll('.sidebar-nav-item');

					if (sidebarItems[savedIndex]) {
						// Pozitsiyani o'rnatish
						moveWhiteBoxToElement(sidebarItems[savedIndex], false);

						// Iconlarni yangilash
						const updatedIcons = [...darkImg];
						if (savedIndex !== 0) {
							updatedIcons[0] = lightImg[0];
							updatedIcons[savedIndex] = lightImg[savedIndex];
						} else {
							updatedIcons[0] = darkImg[0];
						}
						setSelectIcon(updatedIcons);
					} else {
						setDefaultWhiteBoxPosition();
					}
				} catch (error) {
					console.error('Error parsing saved data:', error);
					setDefaultWhiteBoxPosition();
				}
			} else {
				setDefaultWhiteBoxPosition();
			}
		}, 100);

		return () => clearTimeout(timer);
	}, []);

	// ✅ Window resize eventini kuzatish
	useEffect(() => {
		let resizeTimeout;

		const handleResize = () => {
			// Debounce - resize tugagandan keyin ishga tushadi
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				recalculateWhiteBoxPosition();
			}, 150);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			clearTimeout(resizeTimeout);
		};
	}, []);

	// ✅ Route o'zgarganda pozitsiyani yangilash
	useEffect(() => {
		// React Router location o'zgarganda
		const timer = setTimeout(() => {
			recalculateWhiteBoxPosition();
		}, 100);

		return () => clearTimeout(timer);
	}, [window.location.pathname]); // yoki useLocation() hook ishlatish mumkin

	// ✅ Icons localStorage'ga saqlash
	useEffect(() => {
		localStorage.setItem("icons", JSON.stringify(selectIcon));
	}, [selectIcon]);

	// ✅ Component mount bo'lganda pozitsiyani yuklash
	useEffect(() => {
		const initializeSidebar = () => {
			const savedIndexString = localStorage.getItem("selectedSidebarIndex");

			if (savedIndexString && whiteBoxRef.current) {
				try {
					const savedIndex = parseInt(savedIndexString);
					const sidebarItems = document.querySelectorAll('.sidebar-nav-item');

					if (sidebarItems[savedIndex]) {
						// Pozitsiyani o'rnatish
						moveWhiteBoxToElement(sidebarItems[savedIndex], false);

						// Iconlarni yangilash - role'ga qarab
						const updatedIcons = [...darkImg];
						if (savedIndex !== 0) {
							updatedIcons[0] = lightImg[0];
							
							// Admin/Employee uchun profile
							if (user?.role !== 'private_admin' && savedIndex === 3) {
								// Profile - index 3 va settings - index 4 lighten
								updatedIcons[3] = lightImg[3];
								updatedIcons[4] = lightImg[4];
							} else {
								updatedIcons[savedIndex] = lightImg[savedIndex];
							}
						} else {
							updatedIcons[0] = darkImg[0];
						}
						setSelectIcon(updatedIcons);
					} else {
						setDefaultWhiteBoxPosition();
					}
				} catch (error) {
					console.error('Error parsing saved data:', error);
					setDefaultWhiteBoxPosition();
				}
			} else {
				setDefaultWhiteBoxPosition();
			}
		};

		// Bir necha marta tekshirish (DOM tayyor bo'lguncha)
		const timer1 = setTimeout(initializeSidebar, 50);
		const timer2 = setTimeout(initializeSidebar, 150);
		const timer3 = setTimeout(initializeSidebar, 300);

		return () => {
			clearTimeout(timer1);
			clearTimeout(timer2);
			clearTimeout(timer3);
		};
	}, [user?.role]);

	// ✅ Window resize eventini kuzatish - SHU YERDAN KEYIN
	useEffect(() => {
		let resizeTimeout;
		// ... resize kod
	}, []);

	// ✅ Route o'zgarganda pozitsiyani yangilash - ENG OXIRIDA
	useEffect(() => {
		const updatePositionOnRoute = () => {
			// ... route kod
		};
		// ...
	}, [window.location.pathname]);


	// ===== EMPLOYEE POSTS API FUNCTIONS =====

	// Employee uchun post yaratish
	const createEmployeePost = async (employeeId, postData) => {
		try {
			const token = getAuthToken();

			if (!token) {
				throw new Error('Tizimga kirish tokeni topilmadi');
			}

			console.log('📤 Creating employee post:', { employeeId, postData });

			const response = await fetch(`${employeesUrl}/${employeeId}/posts`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(postData),
			});

			console.log('📥 Response status:', response.status);

			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();
					console.error('❌ Error response:', errorData);

					// FastAPI validation errors
					if (Array.isArray(errorData?.detail)) {
						errorMessage = errorData.detail.map(err => {
							const field = err.loc ? err.loc[err.loc.length - 1] : '';
							return `${field}: ${err.msg}`;
						}).join(', ');
					} else if (typeof errorData?.detail === 'string') {
						errorMessage = errorData.detail;
					} else {
						errorMessage = errorData?.message || errorData?.error || errorMessage;
					}
				} else {
					const errorText = await response.text();
					console.error('❌ Error text:', errorText);
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();
			console.log('✅ Employee post created:', data);

			return data;
		} catch (error) {
			console.error('❌ Employee post yaratishda xatolik:', error);
			throw error;
		}
	};

	// Employee postlarini olish (pagination bilan)
	const fetchEmployeePosts = async (employeeId, page = 1, limit = 10) => {
		try {
			const token = getAuthToken();

			if (!token) {
				throw new Error('Tizimga kirish tokeni topilmadi');
			}

			console.log('📤 Fetching employee posts:', { employeeId, page, limit });

			const response = await fetch(
				`${employeesUrl}/${employeeId}/posts?page=${page}&limit=${limit}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						...(token ? { Authorization: `Bearer ${token}` } : {})
					},
				}
			);

			console.log('📥 Response status:', response.status);

			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();
					console.error('❌ Error response:', errorData);

					if (Array.isArray(errorData?.detail)) {
						errorMessage = errorData.detail.map(err => {
							const field = err.loc ? err.loc[err.loc.length - 1] : '';
							return `${field}: ${err.msg}`;
						}).join(', ');
					} else if (typeof errorData?.detail === 'string') {
						errorMessage = errorData.detail;
					} else {
						errorMessage = errorData?.message || errorData?.error || errorMessage;
					}
				} else {
					const errorText = await response.text();
					console.error('❌ Error text:', errorText);
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();
			console.log('✅ Employee posts fetched:', data);

			return data.data || data || [];
		} catch (error) {
			console.error('❌ Employee postlarni olishda xatolik:', error);
			throw error;
		}
	};

	// Employee postini yangilash
	const updateEmployeePost = async (employeeId, postId, postData) => {
		try {
			const token = getAuthToken();

			if (!token) {
				throw new Error('Tizimga kirish tokeni topilmadi');
			}

			console.log('📤 Updating employee post:', { employeeId, postId, postData });

			const response = await fetch(`${employeesUrl}/${employeeId}/posts/${postId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(postData),
			});

			console.log('📥 Response status:', response.status);

			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();
					console.error('❌ Error response:', errorData);

					if (Array.isArray(errorData?.detail)) {
						errorMessage = errorData.detail.map(err => {
							const field = err.loc ? err.loc[err.loc.length - 1] : '';
							return `${field}: ${err.msg}`;
						}).join(', ');
					} else if (typeof errorData?.detail === 'string') {
						errorMessage = errorData.detail;
					} else {
						errorMessage = errorData?.message || errorData?.error || errorMessage;
					}
				} else {
					const errorText = await response.text();
					console.error('❌ Error text:', errorText);
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();
			console.log('✅ Employee post updated:', data);

			return data;
		} catch (error) {
			console.error('❌ Employee post yangilashda xatolik:', error);
			throw error;
		}
	};

	// Employee postini o'chirish
	const deleteEmployeePost = async (employeeId, postId) => {
		try {
			const token = getAuthToken();

			if (!token) {
				throw new Error('Tizimga kirish tokeni topilmadi');
			}

			console.log('📤 Deleting employee post:', { employeeId, postId });

			const response = await fetch(`${employeesUrl}/${employeeId}/posts/${postId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
			});

			console.log('📥 Response status:', response.status);

			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();
					console.error('❌ Error response:', errorData);

					if (typeof errorData?.detail === 'string') {
						errorMessage = errorData.detail;
					} else {
						errorMessage = errorData?.message || errorData?.error || errorMessage;
					}
				} else {
					const errorText = await response.text();
					console.error('❌ Error text:', errorText);
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			console.log('✅ Employee post deleted successfully');
			return true;
		} catch (error) {
			console.error('❌ Employee post o\'chirishda xatolik:', error);
			throw error;
		}
	};

	// Employee commentlarini olish (pagination bilan)
	const fetchEmployeeComments = async (employeeId, page = 1, limit = 10) => {
		try {
			const token = getAuthToken();

			console.log('📤 Fetching employee comments:', { employeeId, page, limit });

			const response = await fetch(
				`${employeesUrl}/${employeeId}/comments?page=${page}&limit=${limit}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						...(token ? { Authorization: `Bearer ${token}` } : {})
					},
				}
			);

			console.log('📥 Response status:', response.status);

			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();
					console.error('❌ Error response:', errorData);

					if (Array.isArray(errorData?.detail)) {
						errorMessage = errorData.detail.map(err => {
							const field = err.loc ? err.loc[err.loc.length - 1] : '';
							return `${field}: ${err.msg}`;
						}).join(', ');
					} else if (typeof errorData?.detail === 'string') {
						errorMessage = errorData.detail;
					} else {
						errorMessage = errorData?.message || errorData?.error || errorMessage;
					}
				} else {
					const errorText = await response.text();
					console.error('❌ Error text:', errorText);
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();
			console.log('✅ Employee comments fetched:', data);

			return {
				comments: data.data || [],
				pagination: data.pagination || {},
				avg_rating: data.avg_rating || 0
			};
		} catch (error) {
			console.error('❌ Employee commentlarni olishda xatolik:', error);
			throw error;
		}
	};



	// Employee avatarini yangilash funksiyasi
	const updateEmployeeAvatar = async (employeeId, avatarFile) => {
		try {
			console.log('=== UPDATE EMPLOYEE AVATAR START ===');

			const token = getAuthToken();
			if (!token) {
				throw new Error('Tizimga kirish tokeni topilmadi');
			}

			// Fayl tekshiruvi
			if (!avatarFile) {
				throw new Error('Avatar fayl tanlanmadi');
			}

			if (!avatarFile.type?.startsWith('image/')) {
				throw new Error('Faqat rasm fayllarini yuklash mumkin');
			}

			const maxSize = 5 * 1024 * 1024; // 5MB
			if (avatarFile.size > maxSize) {
				throw new Error('Rasm hajmi 5MB dan oshmasligi kerak');
			}

			// 1️⃣ BIRINCHI: Rasmni uploadPhotosToServer orqali yuklash
			console.log('📤 Step 1: Uploading avatar file...');
			const uploadedUrls = await uploadPhotosToServer([avatarFile]);

			if (!uploadedUrls || uploadedUrls.length === 0) {
				throw new Error('Rasm yuklashda xatolik yuz berdi');
			}

			const avatarUrl = uploadedUrls[0];
			console.log('✅ Avatar uploaded successfully:', avatarUrl);

			// 2️⃣ IKKINCHI: Employee ma'lumotlarini yangilash (avatar_url ga saqlash)
			console.log('📤 Step 2: Updating employee data with avatar URL...');
			const updateData = {
				avatar_url: avatarUrl,
				avatar: avatarUrl,
				profile_image: avatarUrl
			};

			const updateResponse = await fetch(`${employeesUrl}/${employeeId}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updateData),
			});

			console.log('📥 Update response status:', updateResponse.status);

			if (!updateResponse.ok) {
				let errorMessage = `HTTP ${updateResponse.status}`;
				const contentType = updateResponse.headers.get('content-type');

				if (contentType?.includes('application/json')) {
					const errorData = await updateResponse.json();
					console.error('❌ Error response:', errorData);

					if (Array.isArray(errorData?.detail)) {
						errorMessage = errorData.detail.map(err => {
							const field = err.loc ? err.loc[err.loc.length - 1] : '';
							return `${field}: ${err.msg}`;
						}).join(', ');
					} else if (typeof errorData?.detail === 'string') {
						errorMessage = errorData.detail;
					} else {
						errorMessage = errorData?.message || errorData?.error || errorMessage;
					}
				} else {
					const errorText = await updateResponse.text();
					console.error('❌ Error text:', errorText);
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const updatedData = await updateResponse.json();
			console.log('✅ Employee updated successfully:', updatedData);

			// 3️⃣ UCHINCHI: Local state'ni yangilash
			// User state ni yangilash (agar current user o'zi bo'lsa)
			if (user && (user.id === employeeId || user.employee_id === employeeId)) {
				setUser(prev => ({
					...prev,
					avatar: avatarUrl,
					avatar_url: avatarUrl,
					profile_image: avatarUrl
				}));

				// LocalStorage ni ham yangilash
				const userData = JSON.parse(localStorage.getItem('userData') || '{}');
				userData.avatar = avatarUrl;
				userData.avatar_url = avatarUrl;
				userData.profile_image = avatarUrl;
				localStorage.setItem('userData', JSON.stringify(userData));
			}

			// Employees ro'yxatini yangilash
			setEmployees(prev =>
				prev.map(emp =>
					(emp.id === employeeId || emp.employee_id === employeeId)
						? { 
							...emp, 
							avatar: avatarUrl, 
							avatar_url: avatarUrl,
							profile_image: avatarUrl 
						}
						: emp
				)
			);

			console.log('✅ Employee avatar fully updated:', avatarUrl);
			return avatarUrl;

		} catch (error) {
			console.error('=== UPDATE EMPLOYEE AVATAR ERROR ===');
			console.error('Error:', error);
			throw error;
		}
	};



	return (
		<AppContext.Provider value={{
			t, handleChange, language,
			lightImg, darkImg, selectedIcon,
			selectedElement, setSelectedElement, isRightSidebarOpen,
			openRightSidebar, closeRightSidebar, selectIcon, handleClick,
			moveWhiteBoxToElement, whiteBoxRef,
			// LocalStorage helpers (test-data mode)
			USE_LOCAL_DATA, lsGet, lsSet,
			upsertAppointment, removeAppointment,
			upsertSchedule, removeSchedule,
			upsertEmployee, removeEmployee,
			upsertService, removeService,
			upsertSalon, removeSalon,
			upsertConversation, removeConversation,
			upsertMessage, removeMessage,
			// Schedule state va funksiyalari
			isDragging, startX, scrollLeft, selectDay, setSelectDay,
			handleMouseDown, handleMouseMove, handleMouseUp, scrollRight,
			// Employees state
			waitingEmp, setWaitingEmp, handleAddWaitingEmp,
			isCheckedItem, setIsCheckedItem, handleRemoveWaitingEmp,
			// Home state
			selectedFilter, setSelectedFilter, confirmModal, setConfirmModal,
			handleConfirm,
			//Schedule state
			addSched, setAddSched, schedArr,
			// Profile page state
			salonProfile, setSalonProfile, commentsArr, setCommentsArr,
			adminSalonLoading, adminSalonError, fetchAdminSalon,
			// Authentication state va funksiyalari
			user, isAuthenticated, authLoading, setUser, setIsAuthenticated,

			// loginAdmin, loginEmployee,
			login,
			logout, getAuthToken,
			// Appointments state va funksiyalari
			appointments, appointmentsLoading, appointmentsError, fetchAppointments,
			// Schedules state va funksiyalari
			schedules, schedulesLoading, schedulesError, fetchSchedules, createSchedule,
			// Grouped schedules state va funksiyalari
			groupedSchedules, groupedSchedulesLoading, groupedSchedulesError, fetchGroupedSchedules,
			// Employees state va funksiyalari
			employees, employeesLoading, employeesError, fetchEmployees, createEmployee,
			// Services state va funksiyalari
			services, servicesLoading, servicesError, fetchServices, createService,
			// Chat state va funksiyalari
			conversations, conversationsLoading, conversationsError, fetchConversations,
			currentConversation, setCurrentConversation,
			messages, messagesLoading, messagesError, fetchMessages, sendMessage, getUnreadCount, markMessagesAsRead, markConversationAsRead,
			// Salons state va funksiyalari
			salons, salonsLoading, salonsError, fetchSalons, updateSalon,
			// Salon rasmlarini yuklash va o'chirish funksiyalari
			uploadPhotosToServer,
			uploadSalonPhotos,
			uploadSalonLogo, // Yangi funksiya
			deleteSalonPhoto,  // Fixed: Removed duplicate

			// ===== YANGI API FUNKSIYALARI =====
			// Authentication functions (unUsed.jsx ga ko'chirildi)
			// Admin functions (unUsed.jsx ga ko'chirildi)
			// User functions
			fetchAllUsers, fetchUserById,
			// Payment functions
			createPayment, verifyPayment, getPaymentStatus,
			// SMS functions
			sendSMS, getSMSStatus,
			// Translation functions
			translateText, getSupportedLanguages,
			// Extended appointment functions
			getAppointmentById,
			// Extended employee functions
			getEmployeeById, updateEmployee, deleteEmployee,
			// Extended salon functions
			getSalonById, createSalon, deleteSalon,
			// Extended service functions
			getServiceById, updateService, deleteService,
			// Extended schedule functions
			getScheduleById, updateSchedule, deleteSchedule,
			// Statistics functions
			getStatistics,
			updateAppointmentStatus,
			cancelAppointment,

			// Bookings state va funksiyalari
			bookings,
			bookingsLoading,
			bookingsError,
			fetchBookings,
			createBooking,


			// Combined appointments
			combinedAppointments,
			fetchCombinedAppointments,


			// Employee Posts functions
			createEmployeePost,
			fetchEmployeePosts,
			updateEmployeePost,
			deleteEmployeePost,
			fetchEmployeeComments,
			updateEmployeeAvatar,

		}}>
			{children}
		</AppContext.Provider>
	)
}

export const UseGlobalContext = () => {
	return useContext(AppContext);
}