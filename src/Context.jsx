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
		bookingsUrl,
		mobileSchedulesUrl,
		mobileEmployeesBusyUrl,
		mobileEmployeesUrl,
		mobileEmployeesMeSchedulesUrl,
		mobileEmployeeMeWeeklyUrl,
		userGenerateTokenUrl
	} from "./apiUrls"


// API base URL configuration - Python backend URL (Heroku)
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://freya-2aff07996d13.herokuapp.com/api";
let API_BASE_URL = RAW_API_BASE_URL.replace(/^http:\/\//, 'https://');
const WS_HOST = (() => {
	try {
		const hostWithPath = API_BASE_URL.replace(/^https?:\/\//, '');
		const h = hostWithPath.split('/')[0];
		if (h && h.includes('.')) return h;
		const loc = typeof window !== 'undefined' ? window.location : null;
		const lh = loc ? loc.host : '';
		if (!lh || lh.includes('localhost') || lh.includes('127.0.0.1')) return 'freya-2aff07996d13.herokuapp.com';
		return lh;
	} catch { return 'freya-2aff07996d13.herokuapp.com'; }
})();

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
	pendingSchedules: 'pendingSchedules'
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
	const token = localStorage.getItem('authToken');
	console.log('🔑 getAuthToken called, token:', token ? `${token.substring(0, 20)}...` : 'NULL');
	return token;
};

const refreshAuthToken = async () => {
	const oldToken = getAuthToken();
	if (!oldToken) throw new Error('Not authenticated');
	const resp = await fetch(userGenerateTokenUrl, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${oldToken}`,
			'Content-Type': 'application/json'
		}
	});
	if (!resp.ok) {
		const text = await resp.text();
		throw new Error(text || `HTTP ${resp.status}`);
	}
	const data = await resp.json();
	const newToken = data?.data?.token || data?.token;
	if (!newToken) throw new Error('Token refresh failed');
	localStorage.setItem('authToken', newToken);
	return newToken;
};

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

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
	const [pendingSchedules, setPendingSchedules] = useState([]);
	const pendingSyncTimerRef = useRef(null);

	const syncPendingSchedules = async () => {
		const tok = getAuthToken();
		if (!tok) return;
		if (!Array.isArray(pendingSchedules) || pendingSchedules.length === 0) return;
		const remain = [];
		for (const ps of pendingSchedules) {
			try {
				await createSchedule(ps);
			} catch (e) {
				remain.push(ps);
			}
		}
		setPendingSchedules(remain);
		lsSet(LS_KEYS.pendingSchedules, remain);
	};

	const startPendingSync = () => {
		if (pendingSyncTimerRef.current) return;
		pendingSyncTimerRef.current = setInterval(() => {
			try { syncPendingSchedules(); } catch {}
		}, 5000);
	};

	useEffect(() => {
		if (isAuthenticated && getAuthToken()) {
			startPendingSync();
		}
	}, [isAuthenticated]);

	// Grouped schedules state
	const [groupedSchedules, setGroupedSchedules] = useState([]);
	const [groupedSchedulesLoading, setGroupedSchedulesLoading] = useState(false);
	const [groupedSchedulesError, setGroupedSchedulesError] = useState(null);
	const [mySchedules, setMySchedules] = useState([]);
	const [mySchedulesLoading, setMySchedulesLoading] = useState(false);
	const [mySchedulesError, setMySchedulesError] = useState(null);

	// Employees state
	const [employees, setEmployees] = useState([]);
	const [employeesLoading, setEmployeesLoading] = useState(false);
	const [employeesError, setEmployeesError] = useState(null);

	// Services state
	const [services, setServices] = useState([]);
	const [servicesLoading, setServicesLoading] = useState(false);
	const [servicesError, setServicesError] = useState(null);

	// Professions state
	const defaultProfessions = [
		{ value: 'Стилист', label: 'Stilist' },
		{ value: 'Косметолог', label: 'Kosmetolog' },
		{ value: 'Визажист', label: 'Vizajist' },
		{ value: 'Бровист', label: 'Brovist' },
		{ value: 'Лэшмейкер', label: 'Lashmaker' },
		{ value: 'Массажист', label: 'Massajchi' }
	];
	const [professions, setProfessions] = useState(() => {
		const stored = localStorage.getItem('professions');
		return stored ? JSON.parse(stored) : defaultProfessions;
	});

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

	const getAvailableSlots = async (employeeId, dateStr) => {
		if (!employeeId || !dateStr) return { success: true, employee_id: String(employeeId || ''), date: String(dateStr || ''), data: [] };
		try {
			const token = getAuthToken();
			const headers = {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {})
			};
			const qs = new URLSearchParams({ date_str: String(dateStr) }).toString();
			const url = `${mobileSchedulesUrl}/${employeeId}/available-slots?${qs}`;
			const resp = await fetch(url, { method: 'GET', headers });
			if (!resp.ok) {
				let msg = `HTTP ${resp.status}`;
				try { const j = await resp.json(); msg = j?.message || j?.detail || msg } catch { try { msg = await resp.text() } catch { } }
				throw new Error(msg);
			}
			const data = await resp.json();
			return data;
		} catch (e) {
			return { success: false, employee_id: String(employeeId || ''), date: String(dateStr || ''), data: [], message: e?.message };
		}
	};

	const createMobileAppointment = async (payload) => {
		try {
			const token = getAuthToken();
			if (!token) throw new Error('Token topilmadi');
			const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
			const body = {
				salon_id: String(payload.salon_id),
				schedule_id: String(payload.schedule_id),
				employee_id: String(payload.employee_id),
				service_id: payload.service_id ? String(payload.service_id) : undefined,
				date: String(payload.date),
				time: String(payload.time)
			};
			const resp = await fetch(`${mobileSchedulesUrl}/appointments`, { method: 'POST', headers, body: JSON.stringify(body) });
			if (!resp.ok) {
				let msg = `HTTP ${resp.status}`;
				try { const j = await resp.json(); msg = j?.message || j?.detail || msg } catch { try { msg = await resp.text() } catch { } }
				throw new Error(msg);
			}
			const data = await resp.json();
			return data;
		} catch (e) {
			throw e;
		}
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
					localStorage.removeItem('authToken');
					localStorage.removeItem('userData');
					setAuthLoading(false);
					return;
				}

				setUser(parsedUser);
				setIsAuthenticated(true);
			} catch (error) {
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
				return { data: {}, message: msg };
			}

			const data = await resp.json();
			return data?.data ? data : { data };
		} catch (error) {
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
				setSalons(data.data || []);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch salons');
			}
		} catch (error) {
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
			if (['uz', 'ru', 'en'].includes(lang)) return lang;
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
			console.log('Update Data:', JSON.stringify(updateData, null, 2));

			const token = getAuthToken();
			const role = user?.role;
			const allowedRoles = ['admin', 'super_admin', 'superadmin', 'private_admin', 'private_salon_admin'];


			if (!role || !allowedRoles.includes(role)) {
				throw new Error('Admin huquqi talab qilinadi');
			}

			if (!token) {
				throw new Error('Admin token topilmadi');
			}

			const targetId = salonId || (salonProfile && salonProfile.id) || user?.salon_id;  // Fixed: Added null-check for salonProfile

			const rawLang = i18n?.language || 'uz';
			const languageHeader = ['uz', 'ru', 'en'].includes(rawLang)
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
			['uz', 'ru', 'en'].forEach(l => {
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
			['work_schedule', 'salon_format', 'salon_add_phone'].forEach(k => {
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


			if (response.ok) {
				const data = await response.json();

				// State'ni yangilash
				const serverSalon = data?.data || {};
				setSalonProfile(prev => {
					if (!prev || prev.id !== targetId) return prev;
					const updated = { ...prev, ...updateData, ...serverSalon };
					return updated;
				});

				return data;
			} else {
				const errorText = await response.text();
				throw new Error(`HTTP ${response.status}: ${errorText}`);
			}
		} catch (error) {
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

			const targetSalonId = salonId || salonProfile?.id || user?.salon_id;
			if (!targetSalonId) throw new Error('Salon ID topilmadi');

			const urls = await uploadPhotosToServer([logoFile]);

			if (!urls || urls.length === 0) {
				throw new Error('Logo yuklanmadi');
			}

			const logoUrl = urls[0];

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
			throw error;
		}
	};

	// Photos ni alohida yuklash (logosiz)
	const uploadSalonPhotos = async (salonId, files) => {
		try {

			const targetSalonId = salonId || salonProfile?.id || user?.salon_id;
			if (!targetSalonId) throw new Error('Salon ID topilmadi');

			const uploadedUrls = [];

			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				try {
					const urls = await uploadPhotosToServer([file]);

					if (urls && urls.length > 0) {
						uploadedUrls.push(urls[0]);
					}
				} catch (fileError) {
					throw fileError;
				}
			}

			if (uploadedUrls.length === 0) {
				throw new Error('Hech qanday rasm yuklanmadi');
			}


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

	// Universal login function - avval employee, keyin admin (employee prioritet)
	const login = async (username, password) => {
		try {
			// 1. Avval employee login'ni sinab ko'ramiz (employee prioritet)
			try {
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
					const userData = {
						id: data.user.id,
						username: data.user.username || data.user.name,
						email: data.user.email,
						name: data.user.username || data.user.name,
						role: 'employee',
						salon_id: data.user.salon_id,
						employee_id: data.user.id
					};

					localStorage.setItem('authToken', data.token);
					localStorage.setItem('userData', JSON.stringify(userData));

					setUser(userData);
					setIsAuthenticated(true);

					return { success: true, user: userData, role: 'employee' };
				} else {
					// Employee login failed, try admin
					throw new Error('Employee login failed');
				}
			} catch (employeeError) {
				// 2. Admin login'ni sinab ko'ramiz
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

					return { success: true, user: userData, role: data.user.role };
				} else {
					// Ikkalasi ham muvaffaqiyatsiz
					throw new Error(data.detail || data.message || 'Username yoki parol noto\'g\'ri');
				}
			}
		} catch (error) {
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
			return;
		}

		setAppointmentsLoading(true);
		setAppointmentsError(null);

		try {
			const token = getAuthToken();
			const response = await fetch(`${appointmentsUrl}/salon/${salonId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
			});

			if (response.ok) {
				const data = await response.json();
				setAppointments(data.data || []);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch salon appointments');
			}
		} catch (error) {
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
			const token = getAuthToken();
			if (!token) {
				throw new Error('Not authenticated - no token found');
			}

			const getUrl = (schedulesUrl.replace(/^http:\/\//, 'https://').endsWith('/') ? schedulesUrl.replace(/^http:\/\//, 'https://') : `${schedulesUrl.replace(/^http:\/\//, 'https://')}/`);

			// Timeout controller - 30 seconds
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000);

			try {
				const response = await fetch(getUrl, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					signal: controller.signal
				});

				clearTimeout(timeoutId);

				if (response.ok) {
					const data = await response.json();

					// Filter schedules by salon_id if user has salon_id
					let filteredSchedules = data.data || [];
					if (user && user.salon_id) {
						const target = String(user.salon_id);
						filteredSchedules = (Array.isArray(filteredSchedules) ? filteredSchedules : []).filter(schedule => {
							const sid = schedule?.salon_id ?? schedule?.salonId ?? (schedule?.salon && schedule.salon.id);
							return sid && String(sid) === target;
						});
					}

					setSchedules(filteredSchedules);
				} else if (response.status === 401) {
					// Token invalid, clear auth state
					localStorage.removeItem('authToken');
					localStorage.removeItem('userData');
					setUser(null);
					setIsAuthenticated(false);
					throw new Error('Authentication expired - please login again');
				} else {
					const errorData = await response.json();
					throw new Error(errorData.message || 'Failed to fetch schedules');
				}
			} catch (fetchError) {
				clearTimeout(timeoutId);
				if (fetchError.name === 'AbortError') {
					setSchedulesError('Server javob bermayapti. Iltimos, qayta urinib ko\'ring.');
					setSchedules([]);
				} else {
					throw fetchError;
				}
			}
		} catch (error) {
			setSchedulesError(error.message || 'Schedulelarni yuklashda xatolik');
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
				throw new Error('Not authenticated');
			}

			const dataToSend = {
				...scheduleData,
				salon_id: scheduleData.salon_id || user?.salon_id
			};

			if (!dataToSend.salon_id) {
				throw new Error('Salon ID topilmadi');
			}

			// Backend faqat belgilangan fieldlarni qabul qiladi
			const cleanPayload = {
				salon_id: dataToSend.salon_id,
				name: dataToSend.name,
				title: dataToSend.title || null,
				date: dataToSend.date,
				start_time: dataToSend.start_time,
				end_time: dataToSend.end_time,
				repeat: dataToSend.repeat || false,
				repeat_value: dataToSend.repeat_value || null,
				employee_list: dataToSend.employee_list || [],
				price: dataToSend.price,
				full_pay: dataToSend.full_pay || 0,
				deposit: dataToSend.deposit || 0,
				is_active: dataToSend.is_active !== undefined ? dataToSend.is_active : true,
				whole_day: dataToSend.whole_day || false,
				service_duration: dataToSend.service_duration || 60
			};

			console.log('📮 Context.jsx - yuborilayotgan data:', cleanPayload)
			console.log('📮 JSON stringify:', JSON.stringify(cleanPayload, null, 2))

			let response;
			const makeRequest = async (tok, signal) => {
				if (String(user?.role || '').toLowerCase() === 'employee') {
					const st = String(dataToSend.start_time || '00:00').substring(0, 5);
					const en = String(dataToSend.end_time || '23:59').substring(0, 5);
					const mobilePayload = {
						name: String(dataToSend.name || dataToSend.title || 'Schedule'),
						title: String(dataToSend.title || ''),
						date: String(dataToSend.date),
						start_time: st,
						end_time: en,
						price: Number(dataToSend.price || 0),
						repeat: Boolean(dataToSend.repeat || false),
						repeat_value: dataToSend.repeat_value ? String(dataToSend.repeat_value) : null,
						is_active: true,
					};
					const empUrl = mobileEmployeesMeSchedulesUrl.replace(/^http:\/\//, 'https://');
					console.log('🔷 Token (first 20 chars):', tok?.substring(0, 20));
					return fetch(empUrl, {
						method: 'POST',
						headers: {
							'Authorization': `Bearer ${tok}`,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(mobilePayload),
						signal: signal
					});
				}
				const admUrl = schedulesUrl.replace(/^http:\/\//, 'https://');
				console.log('🔶 Token (first 20 chars):', tok?.substring(0, 20));
				console.log('🔶 Headers:', {
					'Authorization': `Bearer ${tok?.substring(0, 20)}...`,
					'Content-Type': 'application/json',
				});
				return fetch(admUrl, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${tok}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(cleanPayload),
					signal: signal
				});
			};

			// Timeout controller - 45 seconds for POST (longer than GET)
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 45000);

			try {
				response = await makeRequest(token, controller.signal);
				clearTimeout(timeoutId);

				// Server xatolarida tez-tez qayta urinish
				if (!response.ok && response.status >= 500) {
					await sleep(500);
					const retryController = new AbortController();
					const retryTimeoutId = setTimeout(() => retryController.abort(), 45000);
					response = await makeRequest(getAuthToken(), retryController.signal);
					clearTimeout(retryTimeoutId);
				}
				// Auth xatolarida tokenni yangilab, bir marta qayta urinish
				if (!response.ok && (response.status === 401 || response.status === 403) && String(user?.role || '').toLowerCase() === 'user') {
					try {
						const refreshed = await refreshAuthToken();
						const authRetryController = new AbortController();
						const authRetryTimeoutId = setTimeout(() => authRetryController.abort(), 45000);
						response = await makeRequest(refreshed, authRetryController.signal);
						clearTimeout(authRetryTimeoutId);
					} catch (e) {
						// refresh muvaffaqiyatsiz bo'lsa, pastda xato tashlanadi
					}
				}


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

				if ((response.status === 401 || response.status === 403) && /Not authenticated|Token yaroqsiz/i.test(String(errorMessage))) {
					throw new Error(errorMessage);
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();

			let newSchedule = data?.data || data;
			if (String(user?.role || '').toLowerCase() === 'employee') {
				const raw = data?.data || data || {};
				newSchedule = {
					id: String(raw?.id || `${Date.now()}`),
					date: String(raw?.date || dataToSend.date),
					start_time: String(raw?.start_time || dataToSend.start_time || '00:00'),
					end_time: String(raw?.end_time || dataToSend.end_time || '23:59'),
					name: String(raw?.name || dataToSend.name || dataToSend.title || 'Schedule'),
					title: String(raw?.title || dataToSend.title || ''),
					employee_id: String(user?.employee_id || user?.id || ''),
					employee_list: [String(user?.employee_id || user?.id || '')],
					salon_id: String(user?.salon_id || dataToSend.salon_id || ''),
					price: Number(raw?.price ?? dataToSend.price ?? 0),
					is_active: true
				};
			}
			setSchedules(prev => [...prev, newSchedule]);

			try {
				const uid = String(user?.employee_id || user?.id || '');
				if (uid) {
					const ids = (() => {
						const arr = [];
						if (Array.isArray(newSchedule.employee_list)) arr.push(...newSchedule.employee_list);
						if (Array.isArray(newSchedule.employees)) arr.push(...newSchedule.employees.map(e => (e && typeof e === 'object') ? (e.id ?? e.employee_id ?? e) : e));
						if (newSchedule.employee_id) arr.push(newSchedule.employee_id);
						return arr.map(x => String(x));
					})();
					if (ids.includes(uid)) {
						setMySchedules(prev => {
							const next = [...(prev || []), newSchedule];
							return next.sort((a, b) => new Date(String(a.date || '')) - new Date(String(b.date || '')));
						});
					}
				}
			} catch {}

				await fetchSchedules();
				await fetchGroupedSchedules();

				return data;
			} catch (fetchError) {
				clearTimeout(timeoutId);
				if (fetchError.name === 'AbortError') {
					throw new Error('Server javob bermayapti. Iltimos, sahifani yangilab qayta urinib ko\'ring.');
				} else {
					throw fetchError;
				}
			}
		} catch (error) {
			setSchedulesError(error.message || 'Schedule yaratishda xatolik');
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
			const employeeId = user?.employee_id || user?.id;
			if (!employeeId) throw new Error('Employee ID topilmadi');
			const token = getAuthToken();
			const headers = {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {})
			};
			const url = `${scheduleGroupedUrl}?employee_id=${encodeURIComponent(employeeId)}`;
			const response = await fetch(url, { method: 'GET', headers });
			if (!response.ok) {
				const text = await response.text();
				throw new Error(`HTTP ${response.status}: ${text}`);
			}
			const data = await response.json();
			const raw = data?.data || data;
			let schedules = [];
			if (Array.isArray(raw)) {
				schedules = raw;
			} else if (raw && typeof raw === 'object') {
				const isGrouped = Object.keys(raw).some(k => /^\d{4}-\d{2}-\d{2}$/.test(k));
				if (isGrouped) {
					const orderedKeys = Object.keys(raw).sort();
					const arrOfArrays = orderedKeys.map(k => raw[k]);
					const mergedGroups = orderedKeys.map(k => Array.isArray(raw[k]) ? raw[k] : []);
					setGroupedSchedules(mergedGroups);
					return;
				}
				schedules = Object.values(raw).flat();
			}
			const byDate = new Map();
			for (const s of schedules) {
				const key = String(s?.date || '').substring(0, 10);
				if (!key) continue;
				if (!byDate.has(key)) byDate.set(key, []);
				byDate.get(key).push(s);
			}

			const arrOfArrays = Array.from(byDate.entries())
				.sort((a, b) => new Date(a[0]) - new Date(b[0]))
				.map(([, v]) => v);
			setGroupedSchedules(arrOfArrays);
		} catch (error) {
			setGroupedSchedulesError(error.message || 'Jadval yuklanmadi');
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch all users');
			}
		} catch (error) {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch user by ID');
			}
		} catch (error) {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to create payment');
			}
		} catch (error) {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to verify payment');
			}
		} catch (error) {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to get payment status');
			}
		} catch (error) {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to send SMS');
			}
		} catch (error) {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to get SMS status');
			}
		} catch (error) {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to translate text');
			}
		} catch (error) {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to get supported languages');
			}
		} catch (error) {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch appointment');
			}
		} catch (error) {
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


			const response = await fetch(`${appointmentsUrl}/${appointmentId}/status`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ status }),
			});


			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || errorData.detail || 'Status o\'zgartirishda xatolik');
			}

			const data = await response.json();

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


			const response = await fetch(`${appointmentsUrl}/${appointmentId}/cancel`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
				body: JSON.stringify({ cancellation_reason: cancellationReason }),
			});


			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || errorData.detail || 'Bekor qilishda xatolik');
			}

			const data = await response.json();

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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch employee');
			}
		} catch (error) {
			throw error;
		}
	};

	// Update employee
    const updateEmployee = async (employeeId, employeeData) => {
        try {
            const token = getAuthToken();
            // Prefer correct ID for employee role
            const targetId = (() => {
                if (user?.role === 'employee') {
                    return user?.employee_id || user?.id || employeeId;
                }
                return employeeId;
            })();
            const response = await fetch(`${employeesUrl}/${targetId}`, {  // Fixed: employeesUrl
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(employeeData),
            });

			if (response.ok) {
				const data = await response.json();
                await fetchEmployees(); // Refresh employees
                return data;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update employee');
            }
        } catch (error) {
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
				await fetchEmployees(); // Refresh employees
				return true;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete employee');
			}
		} catch (error) {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch salon');
			}
		} catch (error) {
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
				await fetchSalons(); // Refresh salons
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to create salon');
			}
		} catch (error) {
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
				await fetchSalons(); // Refresh salons
				return true;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete salon');
			}
		} catch (error) {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch service');
			}
		} catch (error) {
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
				await fetchServices(); // Refresh services
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update service');
			}
		} catch (error) {
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
				await fetchServices(); // Refresh services
				return true;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete service');
			}
		} catch (error) {
			throw error;
		}
	};

	// ===== EXTENDED SCHEDULE API FUNCTIONS =====



	// Context.jsx - updateSchedule funksiyasini yangilash
	const updateSchedule = async (scheduleId, scheduleData) => {
		try {
			const token = getAuthToken();

			console.log('📤 Schedule data:', JSON.stringify(scheduleData, null, 2));

			const response = await fetch(`${schedulesUrl}/${scheduleId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
				body: JSON.stringify(scheduleData),
			});


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
			await fetchSchedules();
			await fetchGroupedSchedules();
			return data;
		} catch (error) {
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
				await fetchSchedules(); // Refresh schedules
				await fetchGroupedSchedules(); // Grouped schedules ham yangilansin
				return true;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete schedule');
			}
		} catch (error) {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch schedule');
			}
		} catch (error) {
			throw error;
		}
	};
	// ===== CHAT API FUNCTIONS =====
	// ===== WebSocket Chat Client =====
	// Frontend WS client for real-time chat between employee ↔ user.
	const wsRef = useRef(null);
	const [wsStatus, setWsStatus] = useState('idle'); // idle | connecting | connected | closed | error | unsupported
	const [wsError, setWsError] = useState(null);
	const wsReceiverRef = useRef({ id: null, type: null });
	const wsRoomIdRef = useRef(null);
	const currentChatIdRef = useRef(null);
	const wsHistoryRequestedRef = useRef(false);
	const wsHistoryHandledRef = useRef(false);
	const wsLastFetchTsRef = useRef(0);
	const wsReconnectTimerRef = useRef(null);
	const wsRetryCountRef = useRef(0);
	const wsCandidateIdxRef = useRef(0);
	const wsUrlCandidatesRef = useRef([]);

	const buildWsUrl = (receiverId, receiverType) => {
		const scheme = 'wss';
		const originHost = WS_HOST;
		const url = `${scheme}://${originHost}/api/ws/chat?token=${encodeURIComponent(getAuthToken() || '')}&receiver_id=${encodeURIComponent(receiverId || '')}&receiver_type=${encodeURIComponent(receiverType || '')}`;
		try { console.log('WS buildUrl', { scheme, originHost, receiverId, receiverType, url }); } catch {}
		return url;
	};

	const fetchMySchedules = async (dateStr) => {
		setMySchedulesLoading(true);
		setMySchedulesError(null);
		try {
			const token = getAuthToken();
			const headers = {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {})
			};
			const d = dateStr || new Date().toISOString().substring(0,10);
			const uid = String(user?.employee_id || user?.id || '');
			const candidates = [
				`${mobileEmployeesMeSchedulesUrl}?${new URLSearchParams({ date: String(d), page: '1', limit: '100' }).toString()}`,
				`${mobileEmployeesMeSchedulesUrl}?${new URLSearchParams({ date_str: String(d), page: '1', limit: '100' }).toString()}`,
				`${mobileEmployeeMeWeeklyUrl}?${new URLSearchParams({ date: String(d), page: '1', limit: '100' }).toString()}`,
				`${mobileEmployeeMeWeeklyUrl}?${new URLSearchParams({ date_str: String(d), page: '1', limit: '100' }).toString()}`,
				...(uid ? [
					`${scheduleGroupedUrl}?${new URLSearchParams({ employee_id: uid }).toString()}`
				] : [])
			];
			try { console.log('fetchMySchedules start', { uid, date: d, candidates }); } catch {}
			for (const u of candidates) {
				try {
					const r = await fetch(u, { method: 'GET', headers });
					if (!r.ok) { try { console.log('fetchMySchedules candidate failed', { url: u, status: r.status }); } catch {} ; continue; }
					const j = await r.json();
					let arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : []);
					if (Array.isArray(arr)) {
						arr = arr.flatMap(v => Array.isArray(v) ? v : [v]);
					} else if (j?.data && typeof j.data === 'object') {
						const values = Object.values(j.data);
						arr = values.flatMap(v => Array.isArray(v) ? v : [v]);
					}
					try { console.log('fetchMySchedules candidate ok', { url: u, count: Array.isArray(arr) ? arr.length : 0 }); } catch {}
					if (arr && arr.length > 0) {
						const normalized = arr.filter(s => {
							const ids = [];
							if (Array.isArray(s.employee_list)) ids.push(...s.employee_list.map(x => String(x)));
							if (s.employee_id) ids.push(String(s.employee_id));
							return !uid || ids.includes(uid);
						}).sort((a, b) => new Date(String(a.date || '')) - new Date(String(b.date || '')));
						setMySchedules(normalized);
						try { console.log('fetchMySchedules set from candidate', { count: normalized.length }); } catch {}
						return normalized;
					}
				} catch {}
			}
			const empIdsFromSchedule = (s) => {
				const ids = [];
				if (Array.isArray(s.employee_list)) ids.push(...s.employee_list);
				if (Array.isArray(s.employees)) ids.push(...s.employees.map(e => {
					if (e && typeof e === 'object') {
						return e.id ?? e.employee_id ?? e;
					}
					return e;
				}));
				if (Array.isArray(s.employeeIds)) ids.push(...s.employeeIds);
				if (s.employee_id) ids.push(s.employee_id);
				return Array.from(new Set(ids.map(x => String(x))));
			};
			const fallback = (schedules || []).filter(s => {
				const arr = empIdsFromSchedule(s);
				return uid && arr.includes(uid);
			}).sort((a, b) => new Date(String(a.date || '')) - new Date(String(b.date || '')));
			let finalList = fallback;
			if ((!finalList || finalList.length === 0) && Array.isArray(combinedAppointments)) {
				const fromBookings = combinedAppointments
					.filter(app => String(app.employee_id || '') === uid)
					.map(app => ({
						id: String(app.id),
						date: String(app.date || d),
						start_time: String((app.time || '').substring(0,5) || '00:00'),
						end_time: String((app.end_time || '').substring(0,5) || '23:59'),
						name: 'Booking',
						title: 'Booking',
						employee_list: [uid],
						price: 0
					}));
				finalList = fromBookings;
			}
			setMySchedules(finalList);
			try { console.log('fetchMySchedules set from fallback', { count: finalList.length }); } catch {}
			return finalList;
		} catch (e) {
			setMySchedules([]);
			setMySchedulesError(e?.message || 'Error');
			throw e;
		} finally {
			setMySchedulesLoading(false);
		}
	};

	const markEmployeeBusy = async (employeeId, date, startTime, endTime, note = '') => {
		const isoTime = `${String(date)}T${String(startTime).substring(0,5)}:00`;
		const bookingPayload = {
			salon_id: String(user?.salon_id || ''),
			full_name: String(note || 'Busy'),
			phone: '000000000',
			time: isoTime,
			employee_id: String(employeeId)
		};
		const created = await createBooking(bookingPayload);
		return { success: true, data: created };
	};

	const createEmployeeBusySlot = async (employeeId, dateStr, startTime, endTime, note = '') => {
		const token = getAuthToken();
		if (!token) throw new Error('Token topilmadi');
		const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
		const isEmployee = String(user?.role || '').toLowerCase() === 'employee';
		if (isEmployee) {
			const body = JSON.stringify({
				salon_id: String(user?.salon_id || ''),
				date_str: String(dateStr),
				start_time: String(startTime),
				end_time: String(endTime),
				name: String(note || 'Busy'),
				title: String(note || 'Busy')
			});
			const url = `${mobileEmployeesMeSchedulesUrl}`;
			const resp = await fetch(url, { method: 'POST', headers, body });
			if (!resp.ok) {
				let msg = `HTTP ${resp.status}`;
				try { const j = await resp.json(); msg = j?.message || j?.detail || msg } catch { try { msg = await resp.text() } catch {} }
				throw new Error(msg);
			}
			try { return await resp.json(); } catch { return { ok: true }; }
		} else {
			const scheduleData = {
				salon_id: String(user?.salon_id || ''),
				name: String(note || 'Busy'),
				title: String(note || 'Busy'),
				date: String(dateStr),
				start_time: String(startTime),
				end_time: String(endTime),
				service_duration: 60,
				repeat: false,
				repeat_value: '',
				whole_day: false,
				employee_list: [String(employeeId)],
				price: 0,
				full_pay: 0,
				deposit: 0,
				is_active: true
			};
			const res = await createSchedule(scheduleData);
			return res;
		}
	};

	const buildWsUrlCandidates = (receiverId, receiverType) => {
		const scheme = 'wss';
		const originHost = WS_HOST;
		const token = getAuthToken() || '';
		const receiverIdEncoded = encodeURIComponent(receiverId || '');
		const receiverTypeEncoded = encodeURIComponent(receiverType || 'user');
		const baseUrl = `${scheme}://${originHost}/api/ws/chat`;
		const queryParams = new URLSearchParams({
			token: token,
			receiver_id: receiverIdEncoded,
			receiver_type: receiverTypeEncoded
		});
		const candidates = [
			`${baseUrl}?${queryParams.toString()}`,
			`${scheme}://${originHost}/ws/chat?${queryParams.toString()}`
		];
		return candidates;
	};

	const buildWsUrlCustom = (params = {}) => {
		const scheme = 'wss';
		const originHost = WS_HOST;
		const q = new URLSearchParams({ token: getAuthToken() || '' });
		Object.entries(params).forEach(([k, v]) => {
			if (v !== undefined && v !== null) q.set(String(k), String(v));
		});
		return `${scheme}://${originHost}/api/ws/chat?${q.toString()}`;
	};

	const getWsChatInfo = async (params = {}) => {
		const schemeHttp = 'https';
		const originHost = WS_HOST;
		const q = new URLSearchParams({ token: getAuthToken() || '' });
		Object.entries(params).forEach(([k, v]) => {
			if (v !== undefined && v !== null) q.set(String(k), String(v));
		});
		const url = `${schemeHttp}://${originHost}/api/ws/chat/info?${q.toString()}`;
		const resp = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
		if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
		try { return await resp.json(); } catch { return await resp.text(); }
	};

	const disconnectChatWs = () => {
		try {
			if (wsRef.current) {
				wsRef.current.close();
			}
		} catch { }
		wsRef.current = null;
		wsRoomIdRef.current = null;
		wsHistoryRequestedRef.current = false;
		wsHistoryHandledRef.current = false;
		wsReceiverRef.current = { id: null, type: null };
		if (wsReconnectTimerRef.current) {
			clearTimeout(wsReconnectTimerRef.current);
			wsReconnectTimerRef.current = null;
		}
		wsRetryCountRef.current = 0;
		setWsStatus('closed');
		setWsError(null);
	};

	const connectChatWs = (receiverId, receiverType = 'user') => {
		const role = user?.role;
		if (!role || (role !== 'employee' && role !== 'user' && role !== 'private_admin' && role !== 'private_salon_admin' && role !== 'admin')) {
			setWsStatus('unsupported');
			setWsError('WebSocket chat is supported for employees and users only.');
			return false;
		}
		if (!receiverId) {
			setWsStatus('error');
			setWsError('Receiver ID is required for WS chat');
			return false;
		}

		const token = getAuthToken();
		if (!token) {
			setWsStatus('error');
			setWsError('Missing auth token for WebSocket connection');
			return false;
		}

		// If already connected to this receiver, do not reconnect
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			const cur = wsReceiverRef.current;
			if (String(cur?.id) === String(receiverId) && String(cur?.type || 'user') === String(receiverType || 'user')) {
				return true;
			}
		}

		// If connecting to same receiver, let it finish
		const cur = wsReceiverRef.current;
		if (wsStatus === 'connecting' && String(cur?.id) === String(receiverId) && String(cur?.type || 'user') === String(receiverType || 'user')) {
			return true;
		}

		// Reset previous connection and start fresh
		disconnectChatWs();
		setWsStatus('connecting');
		setMessagesLoading(true);
		setWsError(null);
		wsReceiverRef.current = { id: receiverId, type: receiverType };
		wsHistoryRequestedRef.current = false;
		wsHistoryHandledRef.current = false;
		wsUrlCandidatesRef.current = buildWsUrlCandidates(receiverId, receiverType);
		wsCandidateIdxRef.current = 0;
		const url = wsUrlCandidatesRef.current[wsCandidateIdxRef.current];
		try { console.log('WS connecting', { url, receiverId, receiverType, role }); } catch {}
		try {
			const ws = new WebSocket(url);
			wsRef.current = ws;

			ws.onopen = () => {
				try { console.log('WS open', { url }); } catch {}
				setWsStatus('connected');
				setMessagesLoading(false);
				setCurrentConversation(receiverId);
				wsRetryCountRef.current = 0;
				// Auto mark read on open and request history once
				try { const s = wsRef.current; s && s.send(JSON.stringify({ event: 'mark_read' })); } catch {}
				try {
					if (!wsHistoryRequestedRef.current) {
						const s = wsRef.current; s && s.send(JSON.stringify({ event: 'history' }));
						wsHistoryRequestedRef.current = true;
					}
				} catch {}
			};

			ws.onmessage = (evt) => {
				try {
					const payload = JSON.parse(evt.data);
					const ev = payload?.event || 'message';
					try { 
						console.log('📨 WS message received', { 
							event: ev, 
							room_id: payload?.room_id,
							hasMessage: !!payload?.message,
							senderId: payload?.message?.sender_id,
							receiverId: payload?.message?.receiver_id
						}); 
					} catch {}
                    if (ev === 'history') {
                        if (wsHistoryHandledRef.current) {
                            try { console.log('⚠️ History already handled, skipping...'); } catch {}
                            return;
                        }
                        const items = Array.isArray(payload?.items) ? payload.items : [];
                        const normalized = items.map(m => ({
                            ...m,
                            created_at: m?.created_at_local || m?.created_at || m?.createdAt || new Date().toISOString(),
                            created_at_local: m?.created_at_local || m?.created_at || m?.createdAt || new Date().toISOString(),
                            message_text: m?.message_text || m?.message || '',
                        }));
						try { console.log('📥 History received:', normalized.length, 'messages'); } catch {}
						setMessages(normalized);
						setMessagesLoading(false);
						wsHistoryHandledRef.current = true;
						wsRoomIdRef.current = payload?.room_id || wsRoomIdRef.current;
						currentChatIdRef.current = payload?.room_id || currentChatIdRef.current;
					} else if (ev === 'message') {
                        const msg = payload?.message || payload;
                        if (!msg) {
                            try { console.warn('⚠️ Empty message payload'); } catch {}
                            return;
                        }
                        
                        const mineId = String(user?.id || user?.employee_id || '');
                        const peerId = String(wsReceiverRef.current?.id || '');
                        const currentRoomId = String(wsRoomIdRef.current || currentChatIdRef.current || '');
                        const msgRoomId = String(payload?.room_id || '');
                        const msgSenderId = String(msg?.sender_id || '');
                        const msgReceiverId = String(msg?.receiver_id || '');
                        
                        // Room ID ni yangilash agar mavjud bo'lsa
                        if (msgRoomId) {
                            wsRoomIdRef.current = msgRoomId;
                            currentChatIdRef.current = msgRoomId;
                        }
                        
                        // VAQTINCHA: Barcha xabarlarni qabul qilish (debug uchun)
                        // Keyinroq tekshiruvni qayta qo'shamiz
                        try { 
                            console.log('📨 Processing message', { 
                                msgSenderId, 
                                msgReceiverId, 
                                mineId, 
                                peerId,
                                msgRoomId,
                                currentRoomId,
                                hasMessage: !!msg,
                                messageText: msg?.message_text?.substring(0, 50),
                                fullPayload: payload
                            }); 
                        } catch {}
                        
                        const createdAt = msg?.created_at_local || msg?.created_at || msg?.createdAt || new Date().toISOString();
                        const norm = { ...msg, created_at: createdAt, created_at_local: createdAt, message_text: msg?.message_text || msg?.message || '' };
                        
                        try { console.log('✅ Normalized message:', { id: norm.id, text: norm.message_text?.substring(0, 50), sender: norm.sender_id, receiver: norm.receiver_id }); } catch {}
                        setMessages(prev => {
                            const arr = Array.isArray(prev) ? prev : [];
                            if (norm?.id) {
                                const exists = arr.some(m => String(m.id) === String(norm.id));
                                if (exists) { try { console.log('⚠️ Duplicate message by ID ignored:', norm.id); } catch {} ; return arr; }
                            }
                            // mineId va peerId allaqachon yuqorida e'lon qilingan
                            // Faqat optimistic xabarlarni almashtirish (vaqt bo'yicha emas)
                            const dupIdx = arr.findIndex(m => (
                                // Optimistic xabar - bir xil sender, receiver, type, text
                                (m._isOptimistic && String(m.sender_id) === String(mineId) && String(m.receiver_id) === String(peerId) && m.message_type === norm.message_type && m.message_text === norm.message_text) ||
                                // Rasm uchun - file_url bo'yicha
                                (norm.message_type === 'image' && m._isOptimistic && m.file_url && norm.file_url && String(m.file_url) === String(norm.file_url))
                            ));
                            if (dupIdx >= 0) {
                                try { console.log('⚠️ Replacing optimistic with real'); } catch {}
                                const replaced = [...arr];
                                replaced[dupIdx] = { ...arr[dupIdx], ...norm, _isOptimistic: false };
                                return replaced;
                            }
                            try { console.log('✅ Adding new message to state'); } catch {}
                            return [...arr, norm];
                        });
                        // REST resync o'chirildi - WS xabarlari yetarli
                        const incoming = String(msg?.receiver_id) === String(mineId);
							const targetId = incoming ? (msg?.sender_id || msg?.user_id || msg?.senderId) : (msg?.receiver_id);
							if (targetId) {
								setConversations(prev => {
									const arr = Array.isArray(prev) ? prev : [];
									const idx = arr.findIndex(c => String(c.other_user_id || c.user_id || c.id) === String(targetId));
									if (idx >= 0) {
										const c = arr[idx];
										const updated = {
											...c,
											last_message: norm.message_text || c.last_message,
											last_message_time: norm.created_at || c.last_message_time,
											unread_count: incoming ? ((c.unread_count || 0) + 1) : (c.unread_count || 0),
										};
										return [...arr.slice(0, idx), updated, ...arr.slice(idx + 1)];
									} else {
										const newConv = {
											other_user_id: targetId,
											other_user_name: norm?.sender_name || 'Unknown User',
											other_user_avatar: norm?.sender_avatar_url || null,
											last_message: norm?.message_text || '',
											last_message_time: norm?.created_at || new Date().toISOString(),
											unread_count: incoming ? 1 : 0,
										};
										return [newConv, ...arr];
									}
								});
							}
                        wsRoomIdRef.current = payload?.room_id || wsRoomIdRef.current;
                        }
                        if (ev === 'notification') {
                            // Notification - faqat unread_count yangilash, REST resync o'chirildi
                            // WS message eventi allaqachon xabarlarni qo'shadi
                        }
                        if (ev === 'read') {
						// Mark local messages addressed to current user as read
						const byUserId = payload?.by_user_id;
						setMessages(prev => prev.map(m => {
							if (String(m.receiver_id) === String(byUserId)) return { ...m, is_read: true };
							return m;
						}));
						// Also zero out unread_count in conversations for this peer
						const peerId = wsReceiverRef.current?.id;
						if (peerId) {
							setConversations(prev => (Array.isArray(prev) ? prev.map(c => {
								const cid = c.other_user_id || c.user_id || c.id;
								return String(cid) === String(peerId) ? { ...c, unread_count: 0 } : c;
							}) : prev));
						}
                    } if (ev === 'join') {
						wsRoomIdRef.current = payload?.room_id || wsRoomIdRef.current;
						wsHistoryRequestedRef.current = wsHistoryRequestedRef.current || false;
					}
				} catch (e) {
					// ignore parse errors
				}
			};

			ws.onerror = (err) => {
				// Faqat ochilmagan bo'lsa error holatiga o'tkazish
				const sErr = wsRef.current;
				const connected = sErr && sErr.readyState === WebSocket.OPEN;
				if (!connected) {
					// Xatolarni faqat birinchi marta yoki muhim bo'lsa log qilish
					if (wsRetryCountRef.current === 0) {
						try { 
							console.error('WS error', { 
								readyState: sErr?.readyState,
								url: sErr?.url?.substring(0, 100) + '...' // URL ni qisqartirish
							}); 
						} catch {}
					}
					setWsStatus('error');
					setMessagesLoading(false);
					setWsError('WebSocket connection failed');
					// Try next URL candidate if not yet connected
					const nextIdx = wsCandidateIdxRef.current + 1;
					const candidates = wsUrlCandidatesRef.current || [];
					if (nextIdx < candidates.length) {
						wsCandidateIdxRef.current = nextIdx;
						try {
							const nextUrl = candidates[nextIdx];
							if (wsRetryCountRef.current === 0) {
							}
							const nws = new WebSocket(nextUrl);
							wsRef.current = nws;
							// rebind handlers
							nws.onopen = ws.onopen;
							nws.onmessage = ws.onmessage;
							nws.onerror = ws.onerror;
							nws.onclose = ws.onclose;
							return;
						} catch {}
					}
					// Reconnect ni faqat bir marta chaqirish
					if (wsRetryCountRef.current === 0) {
						scheduleWsReconnect();
					}
				}
			};

			ws.onclose = (evt) => {
				// Xatolarni faqat birinchi marta yoki muhim bo'lsa log qilish
				if (wsRetryCountRef.current === 0 || evt?.code === 1000) {
					try { 
						console.warn('WS close', { 
							code: evt?.code, 
							reason: evt?.reason || '',
							wasClean: evt?.wasClean
						}); 
					} catch {}
				}
				setWsStatus('closed');
				setMessagesLoading(false);
				// If closed before connect, try alternate URL once
				const sClose = wsRef.current;
				const connected = sClose && sClose.readyState === WebSocket.OPEN;
				if (!connected) {
					const nextIdx = wsCandidateIdxRef.current + 1;
					const candidates = wsUrlCandidatesRef.current || [];
					if (nextIdx < candidates.length) {
						wsCandidateIdxRef.current = nextIdx;
						try {
							const nextUrl = candidates[nextIdx];
							if (wsRetryCountRef.current === 0) {
							}
							const nws = new WebSocket(nextUrl);
							wsRef.current = nws;
							nws.onopen = ws.onopen;
							nws.onmessage = ws.onmessage;
							nws.onerror = ws.onerror;
							nws.onclose = ws.onclose;
							return;
						} catch {}
					}
				}
				// Reconnect ni faqat bir marta chaqirish (code 1006 - abnormal closure)
				// Agar code 1000 (normal closure) bo'lsa, reconnect qilmaslik
				if (evt?.code !== 1000 && wsRetryCountRef.current < 3) {
					scheduleWsReconnect();
				}
			};
			return true;
		} catch (e) {
			try { console.error('WS connect exception', e); } catch {}
			setWsStatus('error');
			setWsError(e?.message || 'Failed to open WebSocket');
			return false;
		}
	};

	const isWsOpenFor = (receiverId) => {
		const ws = wsRef.current;
		const cur = wsReceiverRef.current;
		return !!(ws && ws.readyState === WebSocket.OPEN && String(cur?.id) === String(receiverId));
	};

	const waitWsOpenFor = async (receiverId, receiverType = 'user', timeoutMs = 3000) => {
		if (!isWsOpenFor(receiverId)) {
			connectChatWs(receiverId, receiverType);
		}
		const start = Date.now();
		while (Date.now() - start < timeoutMs) {
			if (isWsOpenFor(receiverId)) return true;
			await new Promise(r => setTimeout(r, 100));
		}
		return isWsOpenFor(receiverId);
	};

	const connectChatWsCustom = (params = {}) => {
		const token = getAuthToken();
		if (!token) {
			setWsStatus('error');
			setWsError('Missing auth token for WebSocket connection');
			return false;
		}
		disconnectChatWs();
		setWsStatus('connecting');
		setWsError(null);
		const url = buildWsUrlCustom(params);
		try {
			const ws = new WebSocket(url);
			wsRef.current = ws;
			ws.onopen = () => {
				setWsStatus('connected');
				wsRetryCountRef.current = 0;
			};
			ws.onmessage = (evt) => {
				try {
					const payload = JSON.parse(evt.data);
					const ev = payload?.event || 'message';
					if (ev === 'history') {
						const items = Array.isArray(payload?.items) ? payload.items : [];
						setMessages(items);
						wsRoomIdRef.current = payload?.room_id || wsRoomIdRef.current;
					} else if (ev === 'message') {
						const msg = payload?.message || payload;
						if (msg) setMessages(prev => [...prev, msg]);
					} else if (ev === 'notification') {
						// optional: surface notifications
						// no-op if UI handler is not needed
					}
				} catch {}
			};
			ws.onerror = () => {
				setWsStatus('error');
				setWsError('WebSocket error occurred');
			};
			ws.onclose = () => {
				setWsStatus('closed');
			};
			return true;
		} catch (e) {
			setWsStatus('error');
			setWsError(e?.message || 'Failed to open WebSocket');
			return false;
		}
	};

	const scheduleWsReconnect = () => {
		const receiver = wsReceiverRef.current;
		const role = user?.role;
		if (!receiver?.id || !role || (role !== 'employee' && role !== 'user')) return;
		if (wsRetryCountRef.current >= 3) {
			// 3 marta urinishdan keyin to'xtatish
			try { console.warn('WS reconnect limit reached, stopping'); } catch {}
			return;
		}
		if (wsReconnectTimerRef.current) return;
		wsReconnectTimerRef.current = setTimeout(() => {
			wsReconnectTimerRef.current = null;
			wsRetryCountRef.current += 1;
			if (wsRetryCountRef.current <= 3) {
				try { console.log(`WS reconnect attempt ${wsRetryCountRef.current}/3`); } catch {}
				connectChatWs(receiver.id, receiver.type || 'user');
			}
		}, 3000); // 3 soniya kutish
	};

	const sendWsMessage = (messageText, messageType = 'text', fileUrl = null) => {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			const receiverId = wsReceiverRef.current?.id;
			if (!receiverId) { try { console.error('❌ WS not open and no receiver'); } catch {} ; return false; }
			appendLocalMessage(receiverId, messageText, messageType, fileUrl);
			try { sendMessage(receiverId, messageText, messageType, fileUrl).catch(() => {}); } catch {}
			try { setTimeout(() => { try { fetchMessages(receiverId); } catch {} }, 500); } catch {}
			return true;
		}
		const payload = fileUrl
			? { message_type: messageType, file_url: fileUrl }
			: { message_text: messageText, message_type: messageType };
		try {
			try { console.log('📤 WS sending message', { messageType, hasText: !!messageText, hasFile: !!fileUrl }); } catch {}
			ws.send(JSON.stringify(payload));
			try { console.log('✅ WS message sent successfully'); } catch {}
			return true;
		} catch (e) {
			try { console.error('❌ WS send exception', e); } catch {}
			return false;
		}
	};

	const appendLocalMessage = (receiverId, messageText, messageType = 'text', fileUrl = null) => {
		const mineId = user?.id || user?.employee_id;
		const sType = user?.role === 'employee' ? 'employee' : 'salon';
		const now = new Date().toISOString();
		const local = {
			id: `local-${Date.now()}`,
			sender_id: mineId,
			sender_type: sType,
			receiver_id: receiverId,
			receiver_type: 'user',
			message_text: messageText || '',
			message_type: messageType,
			file_url: fileUrl || null,
			is_read: false,
			created_at: now,
			_isOptimistic: true,
		};
		setMessages(prev => [...(Array.isArray(prev) ? prev : []), local]);
	};

	const sendWsCustom = (payload = {}) => {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) return false;
		try {
			ws.send(JSON.stringify(payload));
			return true;
		} catch {
			return false;
		}
	};

	const sendWsMarkRead = () => {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) return false;
		try {
			ws.send(JSON.stringify({ event: 'mark_read' }));
			return true;
		} catch {
			return false;
		}
	};


	// ===== CHAT API FUNCTIONS =====
	// Fetch conversations for employee/admin (salon)
	const fetchConversations = async () => {
		if (!user || (user.role !== 'employee' && user.role !== 'private_admin' && user.role !== 'private_salon_admin' && user.role !== 'admin')) {
			return;
		}

		setConversationsLoading(true);
		setConversationsError(null);

		try {
			const token = getAuthToken();

			// ✅ Employee uchun /employee, Admin uchun /admin endpoint
			const isEmployee = user.role === 'employee';
			const response = await fetch(`${messagesUrl}/${isEmployee ? 'employee' : 'admin'}/conversations`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});


			if (response.ok) {
				const data = await response.json();

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

				setConversations(normalizedConversations);
			} else {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();

					if (typeof errorData?.detail === 'string') {
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
		} catch (error) {
			setConversationsError(error.message);
			setConversations([]);
		} finally {
			setConversationsLoading(false);
		}
	};

	// Fetch messages for employee/admin - URL tanlash
	const fetchMessages = async (userId) => {
		// ✅ userId tekshirish
		if (!userId) {
			setMessagesError('User ID topilmadi');
			return;
		}

		if (!user || (user.role !== 'employee' && user.role !== 'private_admin' && user.role !== 'private_salon_admin' && user.role !== 'admin')) {
			return;
		}

		// YANGI: Agar WS ochiq va history yuklangan bo'lsa, skip qilish
		if (isWsOpenFor(userId) && wsHistoryHandledRef.current) {
			try { console.log('✅ WS already loaded history, skipping REST API call'); } catch {}
			return;
		}

		setMessagesLoading(true);
		setMessagesError(null);

		try {
			const token = getAuthToken();


			const isEmployee = user.role === 'employee';
			const ts = Date.now();
			const response = await fetch(`${messagesUrl}/${isEmployee ? 'employee' : 'admin'}/conversation/${userId}?ts=${ts}`, {
				method: 'GET',
				cache: 'no-store',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});


			if (response.ok) {
				const data = await response.json();

				const messagesList = data.data?.messages || data.messages || data.data || data || [];
				currentChatIdRef.current = data.data?.chat_id || data.chat_id || currentChatIdRef.current;

                const normalized = (Array.isArray(messagesList) ? messagesList : []).map(m => ({
                    ...m,
                    created_at: m?.created_at_local || m?.created_at || m?.createdAt || new Date().toISOString(),
                    created_at_local: m?.created_at_local || m?.created_at || m?.createdAt || new Date().toISOString(),
                    message_text: m?.message_text || m?.message || '',
                }));
				try { console.log('📥 REST API loaded:', normalized.length, 'messages'); } catch {}
				if (isWsOpenFor(userId)) {
					try { console.log('🔄 Merging with existing WS messages'); } catch {}
					setMessages(prev => {
						const combined = [...(Array.isArray(prev) ? prev : []), ...normalized];
						const seen = new Set();
						const unique = [];
						for (const msg of combined) {
							const key = msg?.id || `${msg?.sender_id}-${msg?.receiver_id}-${msg?.message_text}-${msg?.created_at}`;
							if (!seen.has(key)) { seen.add(key); unique.push(msg); }
						}
						return unique;
					});
				} else {
					try { console.log('📝 Setting messages from REST API'); } catch {}
					setMessages(normalized);
				}
				setCurrentConversation(userId);
			} else {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();

					if (Array.isArray(errorData?.detail)) {
						errorMessage = errorData.detail.map(err => err.msg || JSON.stringify(err)).join(', ');
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
		} catch (error) {
			setMessagesError(error.message);
			setMessages([]);
		} finally {
			setMessagesLoading(false);
		}
	};

	// Send message from employee/admin - URL ni o'zgartirish
    const sendMessage = async (receiverId, messageText, messageType = 'text', fileUrl = null) => {
		if (!user || (user.role !== 'employee' && user.role !== 'private_admin' && user.role !== 'private_salon_admin' && user.role !== 'admin')) {
			return;
		}

		try {
			const token = getAuthToken();
			// ✅ Employee uchun /employee/send, Admin uchun /admin/send
			const isEmployee = user.role === 'employee';
            const response = await fetch(`${messagesUrl}/${isEmployee ? 'employee' : 'admin'}/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    receiver_id: receiverId,
                    message_text: messageText,
                    message_type: messageType,
                    file_url: fileUrl,
                }),
            });

			if (response.ok) {
				const data = await response.json();

                if (currentConversation === receiverId) {
                    const isEmployeeSender = user.role === 'employee';
                    setMessages(prevMessages => [...prevMessages, {
                        id: data.data?.id,
                        sender_id: isEmployeeSender ? user.id : (user.salon_id || user.id),
                        sender_type: isEmployeeSender ? 'employee' : 'salon',
                        receiver_id: receiverId,
                        receiver_type: 'user',
                        message_text: messageText,
                        message_type: messageType,
                        file_url: fileUrl,
                        is_read: false,
                        created_at: data.data?.created_at || new Date().toISOString()
                    }]);
                }
                // Conversations list can be refreshed via WS; avoid hard refresh here
                return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to send message');
			}
		} catch (error) {
			throw error;
		}
	};

	// Mark conversation as read for employee/admin - URL tanlash
	const markConversationAsRead = async (userId) => {
		// ✅ userId tekshirish
		if (!userId) {
			return;
		}

		if (!user || (user.role !== 'employee' && user.role !== 'private_admin' && user.role !== 'private_salon_admin' && user.role !== 'admin')) {
			return;
		}

		try {
			const token = getAuthToken();


			const isEmployee = user.role === 'employee';
			const response = await fetch(`${messagesUrl}/${isEmployee ? 'employee' : 'admin'}/conversation/${userId}/mark-read`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});


			if (response.ok) {
				const data = await response.json();

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

					if (typeof errorData?.detail === 'string') {
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
		} catch (error) {
			// ✅ Xatolikni throw qilmaslik - faqat log
			// throw error;
		}
	};


	// Get unread messages count
	const getUnreadCount = async () => {
		if (!user || (user.role !== 'employee' && user.role !== 'private_admin' && user.role !== 'private_salon_admin' && user.role !== 'admin')) {
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
			return 0;
		}
	};

	// Mark messages as read
	const markMessagesAsRead = async (userId) => {
		if (!user || user.role !== 'employee') {
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
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to mark messages as read');
			}
		} catch (error) {
			throw error;
		}
	};

	// Fetch employees - supports salon filter; robust to 404 "Topilmadi" by trying fallbacks
	const fetchEmployees = async (overrideSalonId) => {
		const idToUse = overrideSalonId ?? FORCE_SALON_ID ?? (salonProfile?.id) ?? (user && user.salon_id);

		setEmployeesLoading(true);
		setEmployeesError(null);

		try {
			const token = getAuthToken();
			if (!token) {
				throw new Error('Not authenticated - no token found');
			}

			const headers = {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			};

			// UUID formatni tekshirish (backend UUID talab qiladi)
			const isValidUUID = (v) => typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v);

			// Try multiple URL variants to handle different backend routes; prioritize query variant first
			const urlVariants = isValidUUID(idToUse)
				? [
					`${employeesUrl}?salon_id=${idToUse}&page=1&limit=100`,
					`${employeesUrl}/salon/${idToUse}?page=1&limit=100`,
					`${employeesUrl}/salon?id=${idToUse}&page=1&limit=100`,
				]
				: [
					`${employeesUrl}?page=1&limit=100`,
				];

			let success = false;
			let lastErrorMessage = '';
			for (let i = 0; i < urlVariants.length; i++) {
				const url = urlVariants[i];
				const response = await fetch(url, { method: 'GET', headers });

				if (response.ok) {
					const responseData = await response.json();

					let items = responseData?.data ?? responseData ?? [];
					if (idToUse) {
						const target = String(idToUse);
						items = (Array.isArray(items) ? items : []).filter(emp => {
							const sid = emp?.salon_id ?? emp?.salonId ?? (emp?.salon && emp.salon.id);
							return sid && String(sid) === target;
						});
					}
					setEmployees(items);
					success = true;
					break;
				}

				if (response.status === 401) {
					// Token invalid, clear auth state
					localStorage.removeItem('authToken');
					localStorage.removeItem('userData');
					setUser(null);
					setIsAuthenticated(false);
					throw new Error('Authentication expired - please login again');
				}

				if (response.status === 404) {
					let errJson = {};
					try { errJson = await response.json(); } catch { }
					continue;
				}

				let errorData = {};
				try { errorData = await response.json(); } catch { }
				const detailText = Array.isArray(errorData?.detail)
					? errorData.detail.map(d => (typeof d === 'string' ? d : (d?.msg || d?.message || JSON.stringify(d)))).join('; ')
					: (typeof errorData?.detail === 'string' ? errorData.detail : (errorData?.detail ? JSON.stringify(errorData.detail) : ''));
				lastErrorMessage = errorData?.message || errorData?.error || detailText || `HTTP ${response.status}`;
				// Continue to next variant instead of throwing immediately
			}

			if (!success) {
				setEmployees([]);
				// If we had an error message, surface it; otherwise keep silent
				if (lastErrorMessage) {
					setEmployeesError(lastErrorMessage);
				} else {
					setEmployeesError(null);
				}
			}
		} catch (error) {
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

			// Preflight: check duplicates within current salon to guide user
			let existing = [];
			try {
				const resp = await fetch(`${employeesUrl}?salon_id=${salonId}&page=1&limit=1000`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						...(token ? { Authorization: `Bearer ${token}` } : {})
					}
				});
				if (resp.ok) {
					const data = await resp.json();
					existing = data?.data || [];
				}
			} catch {}

			const dupPhone = existing.find(e => e?.phone && e.phone === employeeData.employee_phone);
			const dupEmail = existing.find(e => e?.email && e.email === employeeData.employee_email);
			const dupUsername = existing.find(e => e?.username && e.username === employeeData.username);
			if (dupPhone || dupEmail || dupUsername) {
				let msg = "Bu foydalanuvchi allaqachon ro'yxatdan o'tgan";
				const parts = [];
				if (dupPhone) parts.push('Telefon');
				if (dupEmail) parts.push('Email');
				if (dupUsername) parts.push('Username');
				if (parts.length) msg = `${msg}: ${parts.join(', ')}`;
				try { await fetchEmployees(salonId); } catch {}
				return { success: true, message: msg };
			}

			// Backend kutgan formatda data tayyorlash
			let dataToSend = {
				salon_id: salonId,
				employee_name: employeeData.employee_name,
				employee_phone: employeeData.employee_phone,
				employee_email: employeeData.employee_email,
				employee_password: employeeData.employee_password,
				username: employeeData.username,
				profession: employeeData.profession,
				role: employeeData.role || 'employee',
				work_start_time: employeeData.work_start_time,
				work_end_time: employeeData.work_end_time
			};


			let response = await fetch(employeesUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {})
				},
				body: JSON.stringify(dataToSend),
			});


			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();

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
					errorMessage = errorText || errorMessage;
				}

				// If only username conflict on backend, auto-adjust and retry once
				if (response.status === 400 && /ro'yxatdan o'tgan/i.test(errorMessage) && employeeData.username) {
					const suffix = Math.random().toString(36).slice(2, 6);
					dataToSend = { ...dataToSend, username: `${employeeData.username}_${suffix}` };
					response = await fetch(employeesUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							...(token ? { Authorization: `Bearer ${token}` } : {})
						},
						body: JSON.stringify(dataToSend),
					});
					if (!response.ok) {
						throw new Error(errorMessage);
					}
				} else {
					throw new Error(errorMessage);
				}
			}

			const data = await response.json();

			// Ro'yxatni faqat backenddan qayta yuklaymiz — optimistik qo'shish yo'q
			try {
				await fetchEmployees(salonId);
			} catch {}

			return data;
		} catch (error) {
			setEmployeesError(error.message);
			throw error;
		} finally {
			setEmployeesLoading(false);
		}
	};

	// Profession management functions
	const addProfession = async (professionName) => {
		try {
			const newProfession = {
				value: professionName,
				label: professionName
			};

			const updatedProfessions = [...professions, newProfession];
			setProfessions(updatedProfessions);
			localStorage.setItem('professions', JSON.stringify(updatedProfessions));

			return { success: true };
		} catch (error) {
			throw error;
		}
	};

	const removeProfession = async (professionValue) => {
		try {
			const updatedProfessions = professions.filter(p => p.value !== professionValue);
			setProfessions(updatedProfessions);
			localStorage.setItem('professions', JSON.stringify(updatedProfessions));

			return { success: true };
		} catch (error) {
			throw error;
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
				setServices(data.data || []);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch services');
			}
		} catch (error) {
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
				}
				// Keyin xodimlarni yuklaymiz
				await fetchEmployees();
				// Sync local schedules pending
				try { await syncPendingLocalSchedules(); } catch {}
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

	const employeesBySalon = useMemo(() => {
		const sid = String((salonProfile && salonProfile.id) || (user && user.salon_id) || '');
		return (employees || []).filter(emp => {
			const eSid = emp?.salon_id ?? emp?.salonId ?? (emp?.salon && emp.salon.id);
			return eSid && String(eSid) === sid;
		});
	}, [employees, salonProfile, user]);

	// Admin salon ma'lumotlarini olish: avval GET `/admin/my-salon`, keyin kerak bo'lsa `/salons/:id`
	const fetchAdminSalon = async (salonIdOverride = null) => {
		setAdminSalonLoading(true);
		setAdminSalonError(null);

		try {
			const token = getAuthToken();

			// 1) Avvalo /admin/my-salon orqali aniq admin biriktirilgan salonni olishga urinamiz
			if (token) {
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
							return merged;
						} catch (e) {
							// Agar detail olishda xato bo'lsa, my-salon obyektidan foydalanamiz
							const normalized = normalizeSalonForProfile(salonObj);
							setSalonProfile(normalized);
							currentSalonIdRef.current = normalized.id;
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
		} catch (error) {
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
    const ts = (key, fallback = '') => {
        try {
            const v = t(key);
            if (typeof v !== 'string' || !v) return fallback;
            const s = String(v);
            if (/returned an object instead of string/i.test(s)) return fallback;
            if (/key .* not found/i.test(s)) return fallback;
            return s;
        } catch {
            return fallback;
        }
    };
	const language = localStorage.getItem("i18nextLng") || 'uz'
	const handleChange = (event) => {
		const selectedLang = event.target.value;
		i18n.changeLanguage(selectedLang);
		localStorage.setItem('i18nextLng', selectedLang);
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
		const id = salonId || user?.salon_id;
		if (!isAuthenticated || !user || !['admin','employee'].includes(String(user.role || '').toLowerCase())) {
			setBookingsError('Faqat admin yoki xodim ko‘ra oladi');
			return;
		}
		if (!id) {
			setBookingsError('Salon ID topilmadi');
			return;
		}
		const isValidUUID = (v) => typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v);
		if (!isValidUUID(String(id))) {
			setBookingsError('Noto‘g‘ri salon ID');
			return;
		}

		setBookingsLoading(true);
		setBookingsError(null);

		try {
			const token = getAuthToken();
			const response = await fetch(
				`${bookingsUrl}?salon_id=${encodeURIComponent(String(id))}`,
				{
					method: 'GET',
					headers: {
						'Authorization': token ? `Bearer ${token}` : '',
						'Content-Type': 'application/json',
					},
				}
			);

			if (response.ok) {
				const data = await response.json();
				setBookings(data.data || data || []);
				return data;
			} else {
				let msg = `HTTP ${response.status}`;
				try {
					const j = await response.json();
					msg = j?.detail || j?.message || j?.error || msg;
				} catch {
					try { msg = await response.text(); } catch {}
				}
				// 401/403 holatida ham foydalanuvchini avtomatik chiqarmaymiz;
				// UI xabarini ko'rsatib, keyinroq qayta uriniladi
				throw new Error(msg || 'Failed to fetch bookings');
			}
		} catch (error) {
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


			if (!response.ok) {
				const errorData = await response.json();

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

			// State'ni yangilash
			const newBooking = data?.data || data;
			setBookings(prev => [...prev, newBooking]);

			// Bookinglar ro'yxatini qayta yuklash
			if (salonId) {
				await fetchBookings(salonId);
			}

			return data;
		} catch (error) {
			setBookingsError(error.message);
			throw error;
		} finally {
			setBookingsLoading(false);
		}
	};

	// DELETE booking by booking_number
	const deleteBooking = async (bookingNumber) => {
		setBookingsLoading(true);
		setBookingsError(null);
		try {
			const token = getAuthToken();
			if (!token) throw new Error('Token topilmadi');
			const response = await fetch(`${bookingsUrl}/number/${bookingNumber}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Bookingni o\'chirishda xatolik');
			}
			// State'dan olib tashlash
			setBookings(prev => (prev || []).filter(b => String(b.booking_number || b.id) !== String(bookingNumber)));
			setCombinedAppointments(prev => (prev || []).filter(a => String(a.id) !== String(bookingNumber)));
			return true;
		} catch (error) {
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
			return;
		}

		try {
			// Parallel ravishda ikkala ma'lumotni olish
			await Promise.all([
				fetchAppointments(salonId),
				fetchBookings(salonId)
			]);

			// Appointments va Bookings ni birlashtirish: bookinglarni appointment bilan bir xil maydonlarga normalize qilamiz
			const combined = [
				...(appointments || []).map(app => ({
					id: String(app.id),
					type: 'appointment',
					application_number: app.application_number || null,
					user_name: app.user_name || null,
					phone_number: app.phone_number || null,
					application_date: app.application_date || null,
					application_time: app.application_time || null,
					date: app.application_date || null,
					time: app.application_time || null,
					employee_id: app.employee_id || null,
					employee_name: app.employee_name || app.master_name || app.employee || null,
					service_name: app.service_name || null,
					service_price: app.service_price || null,
					status: app.status || 'pending',
					notes: app.notes || null,
					is_paid: Boolean(app.is_paid),
					paid_amount: app.paid_amount || null
				})),
				...(bookings || []).map(book => {
					const dateStr = book.time ? String(book.time) : null;
					const date = dateStr ? (dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.substring(0,10)) : null;
					const tStr = book.start_time ? String(book.start_time) : null;
					const time = tStr ? (tStr.length === 5 ? `${tStr}:00` : tStr) : null;
					const emp = (employeesBySalon || []).find(e => String(e.id) === String(book.employee_id));
				return {
					id: String(book.booking_number || book.id),
					type: 'booking',
					application_number: book.booking_number || null,
					user_name: book.full_name || null,
						phone_number: book.phone || null,
						application_date: date,
						application_time: time,
						date,
						time,
						end_time: book.end_time ? (String(book.end_time).length === 5 ? `${book.end_time}:00` : String(book.end_time)) : null,
						employee_id: book.employee_id || null,
						employee_name: emp ? [emp.name, emp.surname].filter(Boolean).join(' ').trim() : null,
						service_name: null,
						service_price: null,
						status: 'pending',
						notes: null,
						is_paid: false,
						paid_amount: null
					};
				})
			];

			// Sanaga ko'ra saralash (eng yangi birinchi)
			const sorted = combined.sort((a, b) => {
				const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
				const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
				return dateB - dateA; // O'sish tartibi uchun dateA - dateB
			});

			setCombinedAppointments(sorted);
			return sorted;
		} catch (error) {
			return [];
		}
	};

	// useEffect - appointments yoki bookings o'zgarganda avtomatik birlashtirish
	useEffect(() => {
		if (user?.salon_id) {
		const combined = [
			...(appointments || []).map(app => ({
				id: String(app.id),
				type: 'appointment',
				application_number: app.application_number || null,
				user_name: app.user_name || null,
				phone_number: app.phone_number || null,
				application_date: app.application_date || null,
				application_time: app.application_time || null,
				date: app.application_date || null,
				time: app.application_time || null,
				employee_id: app.employee_id || null,
				employee_name: app.employee_name || app.master_name || app.employee || null,
				service_name: app.service_name || null,
				service_price: app.service_price || null,
				status: app.status || 'pending',
				notes: app.notes || null,
				is_paid: Boolean(app.is_paid),
				paid_amount: app.paid_amount || null
			})),
			...(bookings || []).map(book => {
				const dateRaw = book.time ? String(book.time) : null;
				const date = dateRaw ? (dateRaw.includes('T') ? dateRaw.split('T')[0] : dateRaw.substring(0,10)) : null;
				const tStr = book.start_time ? String(book.start_time) : null;
				const time = tStr ? (tStr.length === 5 ? `${tStr}:00` : tStr) : null;
				const emp = (employeesBySalon || []).find(e => String(e.id) === String(book.employee_id));
				return {
					id: String(book.booking_number || book.id),
					type: 'booking',
					application_number: book.booking_number || null,
					user_name: book.full_name || null,
					phone_number: book.phone || null,
					application_date: date,
					application_time: time,
					date,
					time,
					end_time: book.end_time ? (String(book.end_time).length === 5 ? `${book.end_time}:00` : String(book.end_time)) : null,
					employee_id: book.employee_id || null,
					employee_name: emp ? [emp.name, emp.surname].filter(Boolean).join(' ').trim() : null,
					service_name: null,
					service_price: null,
					status: 'pending',
					notes: null,
					is_paid: false,
					paid_amount: null
				};
			})
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


			const response = await fetch(`${employeesUrl}/${employeeId}/posts`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(postData),
			});


			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();

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
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();

			return data;
		} catch (error) {
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


			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();

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
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();

			return data.data || data || [];
		} catch (error) {
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


			const response = await fetch(`${employeesUrl}/${employeeId}/posts/${postId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(postData),
			});


			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();

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
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();

			return data;
		} catch (error) {
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


			const response = await fetch(`${employeesUrl}/${employeeId}/posts/${postId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
			});


			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();

					if (typeof errorData?.detail === 'string') {
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

			return true;
		} catch (error) {
			throw error;
		}
	};

	// Employee commentlarini olish (pagination bilan)
	const fetchEmployeeComments = async (employeeId, page = 1, limit = 10) => {
		try {
			const token = getAuthToken();


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


			if (!response.ok) {
				const contentType = response.headers.get('content-type');
				let errorMessage = `HTTP ${response.status}`;

				if (contentType?.includes('application/json')) {
					const errorData = await response.json();

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
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const data = await response.json();

			return {
				comments: data.data || [],
				pagination: data.pagination || {},
				avg_rating: data.avg_rating || 0
			};
		} catch (error) {
			throw error;
		}
	};



	// Employee avatarini yangilash funksiyasi
    const updateEmployeeAvatar = async (employeeId, avatarFile) => {
        try {

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
            const uploadedUrls = await uploadPhotosToServer([avatarFile]);

			if (!uploadedUrls || uploadedUrls.length === 0) {
				throw new Error('Rasm yuklashda xatolik yuz berdi');
			}

			const avatarUrl = uploadedUrls[0];

			// 2️⃣ IKKINCHI: Employee ma'lumotlarini yangilash (avatar_url ga saqlash)
            const updateData = {
                avatar_url: avatarUrl,
                avatar: avatarUrl,
                profile_image: avatarUrl
            };

            const targetId = (() => {
                if (user?.role === 'employee') {
                    return user?.employee_id || user?.id || employeeId;
                }
                return employeeId;
            })();

            let updateResponse;
            if (user?.role === 'employee' && (String(targetId) === String(user?.id) || String(targetId) === String(user?.employee_id))) {
                updateResponse = await fetch(`${employeesUrl}/me/avatar`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ avatar_url: avatarUrl }),
                });
            } else {
                updateResponse = await fetch(`${employeesUrl}/${targetId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateData),
                });
            }


			if (!updateResponse.ok) {
				let errorMessage = `HTTP ${updateResponse.status}`;
				const contentType = updateResponse.headers.get('content-type');

				if (contentType?.includes('application/json')) {
					const errorData = await updateResponse.json();

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
					errorMessage = errorText || errorMessage;
				}

				throw new Error(errorMessage);
			}

			const updatedData = await updateResponse.json();

			// 3️⃣ UCHINCHI: Local state'ni yangilash
			// User state ni yangilash (agar current user o'zi bo'lsa)
            if (user && (user.id === targetId || user.employee_id === targetId)) {
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
                    (emp.id === targetId || emp.employee_id === targetId)
                        ? {
                            ...emp,
                            avatar: avatarUrl,
                            avatar_url: avatarUrl,
                            profile_image: avatarUrl
                        }
                        : emp
                )
            );

            try {
                const sid = FORCE_SALON_ID || salonProfile?.id || user?.salon_id || null;
                await fetchEmployees(sid);
            } catch (_) {}

			return avatarUrl;

		} catch (error) {
			throw error;
		}
	};



	// ===== EMPLOYEE BUSY SLOTS API FUNCTIONS =====

	// Ustaning band vaqtlarini olish
	const fetchEmployeeBusySlots = async (employeeId, date) => {
		try {
			const day = String(date);
			const empIdStr = String(employeeId);
			const daySchedules = (schedules || []).filter(s =>
				String(s.date) === day && Array.isArray(s.employee_list) && s.employee_list.map(id => String(id)).includes(empIdStr)
			);
			return daySchedules
				.map(s => ({ start_time: String(s.start_time), end_time: String(s.end_time) }))
				.filter(it => it.start_time && it.end_time);
		} catch (error) {
			console.error('❌ Error fetching busy slots (local calc):', error);
			return [];
		}
	};

	// Interval bo'yicha muayyan xodim bandligini tekshirish (backendga mos)
	const checkEmployeeBusyInterval = async (employeeId, dateStr, startTime, endTime) => {
		try {
			const token = getAuthToken();
			if (!token) throw new Error('Tizimga kirish tokeni topilmadi');
			const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
			const qs = new URLSearchParams({ date_str: String(dateStr), start_time: String(startTime), end_time: String(endTime) }).toString();
			const url = `${mobileEmployeesUrl}/busy/${employeeId}?${qs}`;
			const resp = await fetch(url, { method: 'GET', headers });
			if (!resp.ok) return false;
			const json = await resp.json();
			const arr = Array.isArray(json?.data) ? json.data : [];
			return arr.length > 0;
		} catch (e) {
			return false;
		}
	};

	// Ustaning mavjud vaqtlarini hisoblash
	const calculateAvailableSlots = (workStartTime, workEndTime, busySlots, appointments, serviceDuration) => {
		const parseTime = (timeStr) => {
			if (timeStr === undefined || timeStr === null) return NaN;
			const s = String(timeStr);
			if (!s || s.length < 3 || !s.includes(':')) return NaN;
			const parts = s.split(':');
			const hours = parseInt(parts[0], 10);
			const minutes = parseInt(parts[1], 10);
			if (isNaN(hours) || isNaN(minutes)) return NaN;
			return hours * 60 + minutes;
		};

		const formatTime = (minutes) => {
			const hours = Math.floor(minutes / 60);
			const mins = minutes % 60;
			return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
		};

		const _ws = parseTime(workStartTime);
		const _we = parseTime(workEndTime);
		const workStart = isNaN(_ws) ? parseTime('09:00') : _ws;
		const workEnd = isNaN(_we) ? parseTime('20:00') : _we;

		// Barcha band vaqtlarni yig'ish
		const occupiedSlots = [];

		// Busy slots dan
		(busySlots || []).forEach(slot => {
			const sStart = parseTime(slot.start_time);
			const sEnd = parseTime(slot.end_time);
			if (!isNaN(sStart) && !isNaN(sEnd)) {
				occupiedSlots.push({ start: sStart, end: sEnd });
			}
		});

		// Appointments dan
		(appointments || []).forEach(apt => {
			const aptStart = parseTime(apt.application_time || apt.start_time);
			const duration = Number(apt.service_duration || 60);
			if (!isNaN(aptStart) && duration > 0) {
				occupiedSlots.push({ start: aptStart, end: aptStart + duration });
			}
		});

		// Tartiblash
		occupiedSlots.sort((a, b) => a.start - b.start);

		// Bo'sh vaqtlarni topish
		const availableSlots = [];
		let currentTime = workStart;

		occupiedSlots.forEach(slot => {
			if (currentTime < slot.start) {
				const freeStart = currentTime;
				const freeEnd = slot.start;

				let slotStart = freeStart;
				while (slotStart + serviceDuration <= freeEnd) {
					availableSlots.push({
						start_time: formatTime(slotStart),
						end_time: formatTime(slotStart + serviceDuration),
						duration: serviceDuration
					});
					slotStart += serviceDuration;
				}
			}
			currentTime = Math.max(currentTime, slot.end);
		});

		// Oxirgi bo'sh vaqt
		if (currentTime < workEnd) {
			let slotStart = currentTime;
			while (slotStart + serviceDuration <= workEnd) {
				availableSlots.push({
					start_time: formatTime(slotStart),
					end_time: formatTime(slotStart + serviceDuration),
					duration: serviceDuration
				});
				slotStart += serviceDuration;
			}
		}

		return availableSlots;
	};


	return (
		<AppContext.Provider value={{
            t, ts, handleChange, language,
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
			mySchedules, mySchedulesLoading, mySchedulesError, fetchMySchedules,
			markEmployeeBusy,
			// Employees state va funksiyalari
			employees, employeesBySalon, employeesLoading, employeesError, fetchEmployees, createEmployee,
			// Services state va funksiyalari
			services, servicesLoading, servicesError, fetchServices, createService,
			// Chat state va funksiyalari
			conversations, conversationsLoading, conversationsError, fetchConversations,
			currentConversation, setCurrentConversation,
			messages, setMessages, messagesLoading, messagesError, fetchMessages, sendMessage, getUnreadCount, markMessagesAsRead, markConversationAsRead,
			// WebSocket chat
			wsStatus, wsError, connectChatWs, connectChatWsCustom, disconnectChatWs, isWsOpenFor, waitWsOpenFor, sendWsMessage, appendLocalMessage, sendWsCustom, sendWsMarkRead, getWsChatInfo,
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
			// Profession management
			professions,
			addProfession,
			removeProfession,
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
			deleteBooking,

			// Mobile schedules
			getAvailableSlots,
			createMobileAppointment,


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

			// ✅ YANGI: Busy slots functions
			fetchEmployeeBusySlots,
			calculateAvailableSlots,
			checkEmployeeBusyInterval,
			createEmployeeBusySlot,

		}}>
			{children}
		</AppContext.Provider>
	)
}

export const UseGlobalContext = () => {
	return useContext(AppContext);
}
