import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
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
    servicesUrl,
    appointmentsUrl,
    salonsListUrl,
    salonDetailUrl,
    schedulesUrl,
    salonServicesUrl,
    statisticsUrl,
    paymentUrl,
    smsUrl,
    translationUrl,
    messagesUrl,
    photoUploadUrl
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
    if (!localStorage.getItem(LS_KEYS.appointments)) lsSet(LS_KEYS.appointments, dataAppoint || []);
    if (!localStorage.getItem(LS_KEYS.employees))   lsSet(LS_KEYS.employees, dataEmployees || []);
    if (!localStorage.getItem(LS_KEYS.services))    lsSet(LS_KEYS.services, dataServices || []);
    if (!localStorage.getItem(LS_KEYS.schedules))   lsSet(LS_KEYS.schedules, dataSchedules || []);
    if (!localStorage.getItem(LS_KEYS.salons))      lsSet(LS_KEYS.salons, dataSalons || []);
    if (!localStorage.getItem(LS_KEYS.conversations)) lsSet(LS_KEYS.conversations, dataConversations || []);
    if (!localStorage.getItem(LS_KEYS.messages))    lsSet(LS_KEYS.messages, dataMessages || []);
    if (!localStorage.getItem(LS_KEYS.statistics))  lsSet(LS_KEYS.statistics, dataStatistics || []);
  } catch {
    // no-op
  }
};

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
const updateSalon = async (salonId, updateData) => {
    try {
        console.log('=== updateSalon START ===');
        console.log('Salon ID:', salonId);
        console.log('Update Data:', JSON.stringify(updateData, null, 2));
        
        const token = getAuthToken();
        const role = user?.role;
        
        console.log('User role:', role);
        console.log('Token exists:', !!token);
        
        if (!role || (role !== 'admin' && role !== 'super_admin' && role !== 'superadmin')) {
            throw new Error('Admin huquqi talab qilinadi');
        }
        
        if (!token) {
            throw new Error('Admin token topilmadi');
        }
        
        const targetId = salonId || salonProfile?.id || user?.salon_id;
        console.log('Target ID:', targetId);
        console.log('URL:', `${salonsUrl}/${targetId}`);
        
        const response = await fetch(`${salonsUrl}/${targetId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                // 'X-User-Language': (localStorage.getItem('language') || localStorage.getItem('i18nextLng') || 'ru'),
            },
            body: JSON.stringify(updateData),
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

	// Central photos upload helper: sends files to photos/upload and returns URLs
	const uploadPhotosToServer = async (files) => {
		const token = getAuthToken();
		if (!token) throw new Error('Admin token topilmadi');

		const maxSize = 4 * 1024 * 1024; // 4MB
		for (const file of files) {
			if (!file.type?.startsWith('image/')) {
				throw new Error(`Fayl "${file.name}" rasm emas`);
			}
			if (file.size > maxSize) {
				throw new Error(`Fayl "${file.name}" hajmi katta (maks 4MB)`);
			}
		}

		const formData = new FormData();
		// Backend expects field name 'files' for file list (FastAPI: files: List[UploadFile])
		files.forEach((file) => formData.append('files', file, file.name));

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
				if (contentType && contentType.includes('application/json')) {
					const errData = await response.json();
					const detail = errData?.detail;
					if (Array.isArray(detail)) {
						message = detail.map(d => d?.msg || JSON.stringify(d)).join('; ');
					} else if (detail && typeof detail === 'object') {
						message = JSON.stringify(detail);
					} else {
						message = errData?.message || errData?.error || detail || message;
					}
					if (typeof message === 'object') message = JSON.stringify(message);
				} else {
					const text = await response.text();
					message = text || message;
				}
			} catch {}
			throw new Error(message);
		}

		const data = await response.json();
		const urls = data?.urls || data?.data?.urls || [];
		if (!Array.isArray(urls) || urls.length === 0) {
			throw new Error('Backend dan URL lar qaytmadi');
		}
		return urls;
	};

	// Upload salon photos function
	// Upload salon photos function - FIXED VERSION
const uploadSalonPhotos = async (salonId, files) => {
    try {
        console.log('=== UPLOAD SALON PHOTOS START ===');

        const targetSalonId = salonId || salonProfile?.id || user?.salon_id;
        if (!targetSalonId) throw new Error('Salon ID topilmadi');

        // 1) Rasm(lar)ni markaziy upload endpointiga yuborish va URL larni olish
        const uploadedUrls = await uploadPhotosToServer(files);
        console.log('Uploaded URLs:', uploadedUrls);

        // 2) Salon maʼlumotiga URL larni biriktirish va kerak bo‘lsa icon qo‘yish
        const currentPhotos = Array.isArray(salonProfile?.salon_photos) ? salonProfile.salon_photos : [];
        const nextPhotos = [...currentPhotos, ...uploadedUrls];
        const nextIcon = salonProfile?.icon || (uploadedUrls[0] ?? salonProfile?.icon);

        const token = getAuthToken();
        const response = await fetch(`${salonsUrl}/${targetSalonId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ salon_photos: nextPhotos, icon: nextIcon })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }

        const data = await response.json();
        const serverSalon = data?.data || data;

        setSalonProfile(prev => {
            if (!prev || prev.id !== targetSalonId) return prev;
            return { ...prev, salon_photos: nextPhotos, icon: nextIcon, ...serverSalon };
        });

        return serverSalon?.salon_photos ? serverSalon : nextPhotos;
    } catch (error) {
        console.error('=== UPLOAD SALON PHOTOS ERROR ===');
        console.error('Error:', error);
        throw error;
    }
};

	// Delete salon photo function
	const deleteSalonPhoto = async (salonId, photoIndex) => {
		try {
			const token = getAuthToken();
            const response = await fetch(`${salonsUrl}/${salonId}/photos/${photoIndex}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

			if (response.ok) {
				const data = await response.json();
				console.log('Salon photo deleted:', data);
				
				// Update salonProfile by removing deleted photo
				setSalonProfile(prev => prev && prev.id === salonId ? { ...prev, salon_photos: data.data.salon_photos } : prev)
				
				return data.data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete salon photo');
			}
		} catch (error) {
			console.error('Error deleting salon photo:', error);
			throw error;
		}
	};
	

	// Admin login function
	const loginAdmin = async (username, password) => {
		try {
			console.log('Login attempt:', { username, password, API_BASE_URL });
			
			const response = await fetch(adminLoginUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username, password }),
			});

			console.log('Response status:', response.status);
			console.log('Response ok:', response.ok);
			console.log('Response headers:', response.headers.get('content-type'));

			// Check if response has content before parsing JSON
			const responseText = await response.text();
			console.log('Response text:', responseText);

			let data;
			try {
				data = responseText ? JSON.parse(responseText) : {};
			} catch (jsonError) {
				console.error('JSON parse error:', jsonError);
				console.error('Response text that failed to parse:', responseText);
				throw new Error('Server response is not valid JSON');
			}

			console.log('Response data:', data);
			console.log('Backend user data:', data.user);

			if (response.ok) {
				const userData = {
					id: data.user.id,
					username: data.user.username,
					email: data.user.email,
					full_name: data.user.full_name,
					role: data.user.role,
					salon_id: data.user.salon_id || null
				};

				console.log('Created userData:', userData);
				
				localStorage.setItem('authToken', data.token);
				localStorage.setItem('userData', JSON.stringify(userData));
				
				setUser(userData);
				setIsAuthenticated(true);
				
				console.log('Login successful, userData set:', userData);
				return userData;
			} else {
				console.error('Login failed with data:', data);
				throw new Error(data.message || 'Admin login failed');
			}
		} catch (error) {
			console.error('Admin login error:', error);
			throw new Error(error.message || 'Network error occurred');
		}
	};

	// Employee login function
	const loginEmployee = async (username, password) => {
		try {
			const response = await fetch(employeeLoginUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username, password }),
			});

			const data = await response.json();
			console.log('🔍 LOGIN DEBUG: Backend response:', data);

			if (response.ok) {
				console.log('🔍 LOGIN DEBUG: Backend user data:', data.user);
				
				const userData = {
					id: data.user.id,
					username: data.user.username || data.user.name,
					email: data.user.email,
					// Backend'dan name kelmaydi, shuning uchun username ishlatamiz
					name: data.user.username || data.user.name,
					role: 'employee',
					salon_id: data.user.salon_id
				};

				console.log('🔍 LOGIN DEBUG: Created userData:', userData);
				console.log('🔍 LOGIN DEBUG: userData.role:', userData.role);

				localStorage.setItem('authToken', data.token);
				localStorage.setItem('userData', JSON.stringify(userData));
				
				console.log('🔍 LOGIN DEBUG: Saved to localStorage');
				console.log('🔍 LOGIN DEBUG: localStorage userData:', localStorage.getItem('userData'));
				
				setUser(userData);
				setIsAuthenticated(true);
				
				return userData;
			} else {
				throw new Error(data.message || 'Employee login failed');
			}
		} catch (error) {
			console.error('Employee login error:', error);
			throw new Error(error.message || 'Network error occurred');
		}
	};

	// Logout function
	const logout = () => {
		localStorage.removeItem('authToken');
		localStorage.removeItem('userData');
		localStorage.removeItem('whiteBoxPos');
		setUser(null);
		setIsAuthenticated(false);
		// Clear all data when logging out
		setAppointments([]);
		setSchedules([]);
		setEmployees([]);
	};

	// Get auth token for API requests
	const getAuthToken = () => {
		return localStorage.getItem('authToken');
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
			const token = getAuthToken();
			const response = await fetch(`${appointmentsUrl}/salon/${salonId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
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
			const token = getAuthToken();
			const response = await fetch(schedulesUrl, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
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
			
			// Add salon_id from current user if not provided
			const dataToSend = {
				...scheduleData,
				salon_id: scheduleData.salon_id || user?.salon_id
			};

			const response = await fetch(schedulesUrl, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(dataToSend),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Schedule created:', data);
				
				// Add new schedule to existing schedules
				setSchedules(prevSchedules => [...prevSchedules, data]);
				
				// Refresh schedules to get updated list
				await fetchSchedules();
				
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to create schedule');
			}
		} catch (error) {
			console.error('Error creating schedule:', error);
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

			// Support both Node and Python backends:
			// - Node:   /grouped-by-date
			// - Python: /grouped/by-date
			const candidateUrls = [
				`${schedulesUrl}/grouped-by-date`,
				`${schedulesUrl}/grouped/by-date`
			];

			let data = null;
			let lastError = null;

			for (const url of candidateUrls) {
				try {
					const resp = await fetch(url, { method: 'GET', headers });
					if (resp.ok) {
						data = await resp.json();
						break;
					} else {
						// Try to extract useful error message
						let errMsg = '';
						try {
							const errJson = await resp.json();
							errMsg = errJson?.message || '';
						} catch {
							const errText = await resp.text();
							errMsg = errText || `HTTP ${resp.status}`;
						}
						lastError = new Error(errMsg || 'Failed to fetch grouped schedules');
					}
				} catch (innerErr) {
					// Network or parsing error
					lastError = innerErr;
				}
			}

			if (!data) {
				throw lastError || new Error('Failed to fetch grouped schedules');
			}

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

	// Update appointment
	const updateAppointment = async (appointmentId, appointmentData) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${appointmentsUrl}/${appointmentId}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(appointmentData),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Appointment updated:', data);
				await fetchAppointments(); // Refresh appointments
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update appointment');
			}
		} catch (error) {
			console.error('Error updating appointment:', error);
			throw error;
		}
	};

	// Delete appointment
	const deleteAppointment = async (appointmentId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${appointmentsUrl}/${appointmentId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				console.log('Appointment deleted successfully');
				await fetchAppointments(); // Refresh appointments
				return true;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete appointment');
			}
		} catch (error) {
			console.error('Error deleting appointment:', error);
			throw error;
		}
	};

	// Get employee by ID
	const getEmployeeById = async (employeeId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${employeeUrl}/${employeeId}`, {
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
			const response = await fetch(`${employeeUrl}/${employeeId}`, {
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
			const response = await fetch(`${employeeUrl}/${employeeId}`, {
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
			const response = await fetch(`${salonUrl}/${salonId}`, {
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
			const response = await fetch(`${salonUrl}/create`, {
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
			const response = await fetch(`${salonUrl}/${salonId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
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
			const response = await fetch(`${serviceUrl}/${serviceId}`, {
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
			const response = await fetch(`${serviceUrl}/${serviceId}`, {
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
			const response = await fetch(`${serviceUrl}/${serviceId}`, {
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

	// Get schedule by ID
	const getScheduleById = async (scheduleId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${scheduleUrl}/${scheduleId}`, {
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

	// Update schedule
	const updateSchedule = async (scheduleId, scheduleData) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${scheduleUrl}/${scheduleId}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(scheduleData),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Schedule updated:', data);
				await fetchSchedules(); // Refresh schedules
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update schedule');
			}
		} catch (error) {
			console.error('Error updating schedule:', error);
			throw error;
		}
	};

	// Delete schedule
	const deleteSchedule = async (scheduleId) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${scheduleUrl}/${scheduleId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				console.log('Schedule deleted successfully');
				await fetchSchedules(); // Refresh schedules
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

	// ===== STATISTICS API FUNCTIONS =====

	// Get statistics
	const getStatistics = async () => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${statisticsUrl}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Statistics fetched:', data);
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch statistics');
			}
		} catch (error) {
			console.error('Error fetching statistics:', error);
			throw error;
		}
	};

	// ===== CHAT API FUNCTIONS =====

	// Fetch conversations for employee and admin2
	const fetchConversations = async () => {
		if (!user || (user.role !== 'employee' && user.role !== 'private_admin')) {
			console.error('Only employees and admin2 can fetch conversations');
			return;
		}

		setConversationsLoading(true);
		setConversationsError(null);

		try {
			const token = getAuthToken();
			const response = await fetch(`${messagesUrl}/conversations`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Conversations fetched:', data);
				setConversations(data.data || data || []);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch conversations');
			}
		} catch (error) {
			console.error('Error fetching conversations:', error);
			setConversationsError(error.message);
			setConversations([]);
		} finally {
			setConversationsLoading(false);
		}
	};

	// Fetch messages for a specific conversation
	const fetchMessages = async (userId) => {
		if (!user || (user.role !== 'employee' && user.role !== 'private_admin')) {
			console.error('Only employees and admin2 can fetch messages');
			return;
		}

		setMessagesLoading(true);
		setMessagesError(null);

		try {
			const token = getAuthToken();
			const response = await fetch(`${messagesUrl}/conversation/${userId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Messages fetched:', data);
				setMessages(data.data || data || []);
				setCurrentConversation(userId);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch messages');
			}
		} catch (error) {
			console.error('Error fetching messages:', error);
			setMessagesError(error.message);
			setMessages([]);
		} finally {
			setMessagesLoading(false);
		}
	};

	// Send message to user
	const sendMessage = async (receiverId, messageText, messageType = 'text') => {
		if (!user || (user.role !== 'employee' && user.role !== 'private_admin')) {
			console.error('Only employees and admin2 can send messages');
			return;
		}

		try {
			const token = getAuthToken();
			const response = await fetch(`${messagesUrl}/send`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					receiver_id: receiverId,
					receiver_type: 'user',
					message_text: messageText,
					message_type: messageType
				}),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Message sent:', data);
				
				// Add new message to current messages if this is the active conversation
				if (currentConversation === receiverId) {
					setMessages(prevMessages => [...prevMessages, data.data || data]);
				}
				
				// Refresh conversations to update last message
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

	// Mark all messages in conversation as read
	const markConversationAsRead = async (userId) => {
		if (!user || (user.role !== 'employee' && user.role !== 'private_admin')) {
			console.error('Only employees and admin2 can mark conversation as read');
			return;
		}

		try {
			const token = getAuthToken();
			const response = await fetch(`${messagesUrl}/conversation/${userId}/mark-read`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Conversation marked as read:', data);
				
				// Update conversations to reflect the change
				setConversations(prevConversations => 
					prevConversations.map(conv => 
						conv.other_user_id === userId 
							? { ...conv, unread_count: 0 }
							: conv
					)
				);
				
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to mark conversation as read');
			}
		} catch (error) {
			console.error('Error marking conversation as read:', error);
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
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
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
            try { errJson = await response.json(); } catch {}
            console.warn('Employees endpoint 404, trying next variant:', errJson);
            continue;
          }

          // Other errors: capture detail and stop
          let errorData = {};
          try { errorData = await response.json(); } catch {}
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
			
			// Add salon_id (forced or provided or from current user)
			const idToUse = FORCE_SALON_ID || employeeData.salon_id || user?.salon_id;
			const dataToSend = {
				...employeeData,
				salon_id: idToUse
			};

			const response = await fetch(employeesUrl, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(dataToSend),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Employee created:', data);

				// Add new employee to existing employees (prefer data.data shape)
				setEmployees(prevEmployees => [...prevEmployees, (data && data.data) ? data.data : data]);

				// Refresh employees to get updated list
				await fetchEmployees();

				return data;
			} else {
				// Improved error parsing: prefer JSON, include FastAPI 'detail'
				try {
					const contentType = response.headers.get('content-type') || '';
					let parsed = null;
					let rawText = '';
					if (contentType.includes('application/json')) {
						parsed = await response.json();
					} else {
						rawText = await response.text();
						try { parsed = JSON.parse(rawText); } catch { /* keep rawText */ }
					}

					const messageDetail = parsed?.detail || parsed?.message || parsed?.error || (typeof parsed === 'string' ? parsed : undefined) || rawText || 'Xodim yaratishda xatolik yuz berdi';
					console.error('Create employee failed:', { status: response.status, detail: messageDetail, raw: parsed ?? rawText, payload: dataToSend });
					throw new Error(`HTTP ${response.status}: ${messageDetail}`);
				} catch (parseErr) {
					console.error('Create employee error (unparseable response):', { status: response.status, payload: dataToSend, error: parseErr?.message });
					throw new Error('Failed to create employee');
				}
			}
		} catch (error) {
			console.error('Error creating employee:', error);
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

	const handleConfirm = async (item) => {
		try {
			const response = await fetch(`${appointUrl}/${item.id}/status`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "confirmed" }),
			});

			if (!response.ok) {
				throw new Error("Status update failed!");
			}

			const result = await response.json();
			console.log("✅ Status updated:", result);

			// Appointmentlarni qayta yuklash
			if (user && user.salon_id) {
				fetchAppointments(user.salon_id);
			}

		} catch (err) {
			console.error("❌ Error:", err.message);
		}

		setConfirmModal(false); // modal yopilad

	}


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
	const [commentsArr , setCommentsArr] = useState([])

	

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
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (mySalonResp.ok) {
                    const mySalonData = await mySalonResp.json();
                    const salonObj = mySalonData?.data || mySalonData;
                    if (salonObj && salonObj.id) {
                        setSalonProfile(salonObj);
                        currentSalonIdRef.current = salonObj.id;
                        console.log('✅ Admin my-salon fetched:', salonObj.id);
                        return salonObj;
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
                        try { mySalonMsg = await mySalonResp.text(); } catch {}
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
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    'Content-Type': 'application/json',
                },
            });

            if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                const salonObj = detailData?.data || detailData;
                if (!salonObj || !salonObj.id) {
                    throw new Error('Salon maʼlumotlari topilmadi');
                }
                setSalonProfile(salonObj);
                currentSalonIdRef.current = salonObj.id;
                console.log('✅ Salon fetched by ID:', salonObj.id);
                return salonObj;
            } else {
                let message = `Failed to fetch salon by ID (HTTP ${detailResponse.status})`;
                try {
                    const errorData = await detailResponse.json();
                    const detailText = Array.isArray(errorData?.detail)
                        ? errorData.detail.map(d => (typeof d === 'string' ? d : (d?.msg || d?.message || JSON.stringify(d)))).join('; ')
                        : (typeof errorData?.detail === 'string' ? errorData.detail : (errorData?.message || errorData?.error || ''));
                    message = detailText || message;
                } catch (_) {
                    try { message = await detailResponse.text(); } catch {}
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



	const handleAddWaitingEmp = (ids) => {
    const selectedEmployees = employees.filter(
      (employee) => ids.includes(employee.id) && !waitingEmp.some((emp) => emp.id === employee.id)
    );

    setWaitingEmp((prev) => {
      const newWaitingEmp = [...prev, ...selectedEmployees];
      localStorage.setItem("waitingEmp", JSON.stringify(newWaitingEmp));
      return newWaitingEmp;
    });
	location.reload()
  };

  	const handleRemoveWaitingEmp = (ids) => {
    setWaitingEmp((prev) => {
      const newWaitingEmp = prev.filter((emp) => !ids.includes(emp.id));
      localStorage.setItem("waitingEmp", JSON.stringify(newWaitingEmp));
      return newWaitingEmp;
    });
	location.reload()
  };

	const [isCheckedItem , setIsCheckedItem] = useState([])

	const { t, i18n } = useTranslation();
	const language = localStorage.getItem("i18nextLng")
	const handleChange = (event) => {
		const selectedLang = event.target.value;
		i18n.changeLanguage(selectedLang)
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
	]

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
	]

	let selectedIcon = JSON.parse(localStorage.getItem("icons"))
	let selectedTop = localStorage.getItem("sidebarTop")
	const [sidebarTop, setSidebarTop] = useState(selectedTop || '19vh')
	const [selectIcon, setSelectIcon] = useState(selectedIcon || darkImg)

	const whiteBoxRef = useRef(null);

const moveWhiteBoxToElement = (element, save = true) => {
	if (!element || !whiteBoxRef.current) return;

	const rect = element.getBoundingClientRect();
	const sidebar = element.closest(".sidebar");
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
		localStorage.setItem(
			"whiteBoxPos",
			JSON.stringify({ topVH, leftVW, heightVH, widthVW })
		);
		// ✅ Tanlangan element indexini ham saqlash
		const sidebarItems = document.querySelectorAll('.sidebar-item');
		const elementIndex = Array.from(sidebarItems).indexOf(element);
		if (elementIndex !== -1) {
			localStorage.setItem("selectedSidebarIndex", elementIndex.toString());
		}
	}
};

const handleClick = (e) => {
	let index = e.currentTarget.id
	moveWhiteBoxToElement(e.currentTarget);
	const updatedIcons = [...darkImg];
	if (index != 0) {
		updatedIcons[0] = lightImg[0]
		updatedIcons[index] = lightImg[index];
		setSelectIcon(updatedIcons);
	} else {
		updatedIcons[0] = darkImg[0]
		setSelectIcon(updatedIcons);
	}
};

// ✅ WhiteBox pozitsiyasini yuklash
useEffect(() => {
	// Sidebar elementlari to'liq yuklangunga qadar kutish
	const timer = setTimeout(() => {
		const savedPosString = localStorage.getItem("whiteBoxPos");
		const savedIndexString = localStorage.getItem("selectedSidebarIndex");
		
		if (savedPosString && savedIndexString && whiteBoxRef.current) {
			// ✅ localStorage'da saqlangan pozitsiya va index bor
			try {
				const savedPos = JSON.parse(savedPosString);
				const savedIndex = parseInt(savedIndexString);
				const { topVH, leftVW, heightVH, widthVW } = savedPos;
				const whiteBox = whiteBoxRef.current;
				
				// Pozitsiyani o'rnatish
				whiteBox.style.top = `${topVH - 2}vh`;
				whiteBox.style.left = `${leftVW}vw`;
				whiteBox.style.height = `${heightVH}vh`;
				whiteBox.style.width = `${widthVW}vw`;
				
				// ✅ Saqlangan element iconini yangilash
				const sidebarItems = document.querySelectorAll('.sidebar-item');
				if (sidebarItems[savedIndex]) {
					const updatedIcons = [...darkImg];
					if (savedIndex !== 0) {
						updatedIcons[0] = lightImg[0];
						updatedIcons[savedIndex] = lightImg[savedIndex];
					} else {
						updatedIcons[0] = darkImg[0];
					}
					setSelectIcon(updatedIcons);
				}
			} catch (error) {
				console.error('Error parsing saved data:', error);
				setDefaultWhiteBoxPosition();
			}
		} else {
			// ✅ localStorage'da ma'lumot yo'q - birinchi elementga o'rnatish
			setDefaultWhiteBoxPosition();
		}
	}, 100); // 100ms kutish - DOM yuklangunga qadar

	return () => clearTimeout(timer);
}, []);

// ✅ Default pozitsiya - birinchi sidebar elementiga
const setDefaultWhiteBoxPosition = () => {
	if (!whiteBoxRef.current) return;
	
	// Birinchi sidebar elementini topish
	const firstSidebarElement = document.querySelector('.sidebar-item');
	
	if (firstSidebarElement) {
		// Birinchi elementga avtomatik joylashtirish
		moveWhiteBoxToElement(firstSidebarElement, true);
		
		// ✅ Birinchi element iconini active qilish
		const updatedIcons = [...darkImg];
		updatedIcons[0] = darkImg[0]; // Home icon active
		setSelectIcon(updatedIcons);
	} else {
		// Fallback: manual default (agar sidebar element topilmasa)
		const whiteBox = whiteBoxRef.current;
		whiteBox.style.top = '17vh';
		whiteBox.style.left = '0.5vw';
		whiteBox.style.height = '5.5vh';
		whiteBox.style.width = '4vw';
		
		// Default pozitsiyani localStorage'ga saqlash
		localStorage.setItem(
			"whiteBoxPos",
			JSON.stringify({
				topVH: 19, // 17 + 2
				leftVW: 0.5,
				heightVH: 5.5,
				widthVW: 4
			})
		);
		localStorage.setItem("selectedSidebarIndex", "0");
	}
};

// Icons localStorage'ga saqlash
useEffect(() => {
	localStorage.setItem("icons", JSON.stringify(selectIcon));
}, [selectIcon]);



	return (
		<AppContext.Provider value={{
			t, handleChange, language, sidebarTop,
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
			loginAdmin, loginEmployee, logout, getAuthToken,
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
	uploadSalonPhotos, deleteSalonPhoto,

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
	getAppointmentById, updateAppointment, deleteAppointment,
	// Extended employee functions
	getEmployeeById, updateEmployee, deleteEmployee,
	// Extended salon functions
	getSalonById, createSalon, deleteSalon,
	// Extended service functions
	getServiceById, updateService, deleteService,
	// Extended schedule functions
	getScheduleById, updateSchedule, deleteSchedule,
	// Statistics functions
	getStatistics

}}>
	{children}
</AppContext.Provider>
	)
}

export const UseGlobalContext = () => {
	return useContext(AppContext);
}
