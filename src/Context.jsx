import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
	superAdminUrl,
	adminUrl,
	salonsUrl,
	appointUrl,
	commentsUrl,
	mastersUrl,
	servicesUrl,
	salonsListUrl,
	schedulesUrl,
	salonServicesUrl,
	statisticsUrl
} from "./apiUrls"

// API base URL configuration - always use production URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://freya-salon-backend-cc373ce6622a.herokuapp.com/api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {

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
		
		console.log('🔍 DEBUG: localStorage token:', token ? 'EXISTS' : 'NOT_FOUND');
		console.log('🔍 DEBUG: localStorage userData:', userData);
		
		if (token && userData) {
			try {
				const parsedUser = JSON.parse(userData);
				console.log('🔍 DEBUG: Parsed user object:', parsedUser);
				console.log('🔍 DEBUG: User role:', parsedUser.role);
				console.log('🔍 DEBUG: Role type:', typeof parsedUser.role);
				
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

	// Fetch salons with authentication
	const fetchSalons = async () => {
		setSalonsLoading(true);
		setSalonsError(null);

		try {
			const token = getAuthToken();
			const response = await fetch(`${API_BASE_URL}/salons`, {
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
	const updateSalon = async (salonId, updateData) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${API_BASE_URL}/admin/salons/${salonId}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updateData),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Salon updated:', data);
				
				// Update profArr if it exists
				if (profArr && profArr.length > 0) {
					const updatedProfArr = profArr.map(salon => 
						salon.id === salonId ? { ...salon, ...updateData } : salon
					);
					setProfArr(updatedProfArr);
				}
				
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update salon');
			}
		} catch (error) {
			console.error('Error updating salon:', error);
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

	// Upload salon photos function
	const uploadSalonPhotos = async (salonId, files) => {
		try {
			const token = getAuthToken();
			
			// Convert files to base64
			const base64Photos = await Promise.all(
				files.map(file => fileToBase64(file))
			);

			const response = await fetch(`${API_BASE_URL}/admin/salons/${salonId}/photos`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					photos: base64Photos
				}),
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Salon photos uploaded:', data);
				
				// Update profArr with new photos
				if (profArr && profArr.length > 0) {
					const updatedProfArr = profArr.map(salon => 
						salon.id === salonId ? { ...salon, salon_photos: data.data.salon_photos } : salon
					);
					setProfArr(updatedProfArr);
				}
				
				return data.data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to upload salon photos');
			}
		} catch (error) {
			console.error('Error uploading salon photos:', error);
			throw error;
		}
	};

	// Delete salon photo function
	const deleteSalonPhoto = async (salonId, photoIndex) => {
		try {
			const token = getAuthToken();
			const response = await fetch(`${API_BASE_URL}/admin/salons/${salonId}/photos/${photoIndex}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Salon photo deleted:', data);
				
				// Update profArr by removing deleted photo
				if (profArr && profArr.length > 0) {
					const updatedProfArr = profArr.map(salon => 
						salon.id === salonId ? { ...salon, salon_photos: data.data.salon_photos } : salon
					);
					setProfArr(updatedProfArr);
				}
				
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
			
			const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
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
			const response = await fetch(`${API_BASE_URL}/auth/employee/login`, {
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
			const response = await fetch(`${API_BASE_URL}/appointments/filter/salon/${salonId}`, {
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
			const response = await fetch(`${API_BASE_URL}/schedules`, {
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

			const response = await fetch(`${API_BASE_URL}/schedules`, {
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
			const response = await fetch(`${API_BASE_URL}/schedules/grouped-by-date`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Grouped schedules fetched:', data);
				
				// Filter grouped schedules by salon_id if user has salon_id
				let filteredGroupedSchedules = data.data || [];
				if (user && user.salon_id) {
					filteredGroupedSchedules = filteredGroupedSchedules.map(daySchedules => 
						daySchedules.filter(schedule => schedule.salon_id === user.salon_id)
					).filter(daySchedules => daySchedules.length > 0);
				}
				
				setGroupedSchedules(filteredGroupedSchedules);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch grouped schedules');
			}
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

			const response = await fetch(`${API_BASE_URL}/services`, {
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

	// ===== CHAT API FUNCTIONS =====

	// Fetch conversations for employee
	const fetchConversations = async () => {
		if (!user || user.role !== 'employee') {
			console.error('Only employees can fetch conversations');
			return;
		}

		setConversationsLoading(true);
		setConversationsError(null);

		try {
			const token = getAuthToken();
			const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
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
		if (!user || user.role !== 'employee') {
			console.error('Only employees can fetch messages');
			return;
		}

		setMessagesLoading(true);
		setMessagesError(null);

		try {
			const token = getAuthToken();
			const response = await fetch(`${API_BASE_URL}/messages/conversation/${userId}`, {
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
		if (!user || user.role !== 'employee') {
			console.error('Only employees can send messages');
			return;
		}

		try {
			const token = getAuthToken();
			const response = await fetch(`${API_BASE_URL}/messages/send`, {
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
		if (!user || user.role !== 'employee') {
			console.error('Only employees can get unread count');
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
			const response = await fetch(`${API_BASE_URL}/messages/mark-read`, {
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
		if (!user || user.role !== 'employee') {
			console.error('Only employees can mark conversation as read');
			return;
		}

		try {
			const token = getAuthToken();
			const response = await fetch(`${API_BASE_URL}/messages/conversation/${userId}/mark-read`, {
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

	// Fetch employees - all employees from production server
	const fetchEmployees = async () => {
		if (!user || !user.salon_id) {
			console.error('User salon_id is required to fetch employees');
			return;
		}

		setEmployeesLoading(true);
		setEmployeesError(null);

		try {
			const token = getAuthToken();
			const response = await fetch(`${API_BASE_URL}/employees/salon/${user.salon_id}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Employees fetched:', data);
				setEmployees(data.data || []);
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch employees');
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
			
			// Add salon_id from current user if not provided
			const dataToSend = {
				...employeeData,
				salon_id: employeeData.salon_id || user?.salon_id
			};

			const response = await fetch(`${API_BASE_URL}/employees`, {
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
				
				// Add new employee to existing employees
				setEmployees(prevEmployees => [...prevEmployees, data]);
				
				// Refresh employees to get updated list
				await fetchEmployees();
				
				return data;
			} else {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to create employee');
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
			const response = await fetch(`${API_BASE_URL}/services`, {
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
			// fetchAppointments(user.salon_id); // Disabled for production chat API
			// fetchSchedules(); // Disabled for production chat API
			// fetchEmployees(); // Disabled for production chat API
			// fetchServices(); // Disabled for production chat API
			// fetchSalons(); // Disabled for production chat API
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
	const [mastersArr, setMastersArr] = useState([])

	// Schedule qo'shish uchun
	const [addSched, setAddSched] = useState(false)
	const [schedArr, setSchedArr] = useState([])
	const [commentsArr , setCommentsArr] = useState([])

	

	// Profile uchun data
	const [profArr , setProfArr] = useState([])
	const [adminSalonLoading, setAdminSalonLoading] = useState(false)
	const [adminSalonError, setAdminSalonError] = useState(null)

	// Admin salon ma'lumotlarini olish
	const fetchAdminSalon = async () => {
		setAdminSalonLoading(true);
		setAdminSalonError(null);

		try {
			const token = getAuthToken();
			
			// Production backend'da /admin/my-salon ishlamaydi, shuning uchun /salons endpoint'idan foydalanamiz
			console.log('🔍 Fetching admin salon data...');
			
			// Avval /admin/my-salon ni sinab ko'ramiz
			try {
				const adminResponse = await fetch(`${API_BASE_URL}/admin/my-salon`, {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
				});

				if (adminResponse.ok) {
					const adminData = await adminResponse.json();
					console.log('✅ Admin salon fetched from /admin/my-salon:', adminData);
					setProfArr([adminData.data]);
					return adminData.data;
				}
			} catch (adminError) {
				console.log('⚠️ /admin/my-salon failed, trying workaround...');
			}

			// Agar /admin/my-salon ishlamasa, /salons endpoint'idan foydalanamiz
			const salonsResponse = await fetch(`${API_BASE_URL}/salons`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (salonsResponse.ok) {
				const salonsData = await salonsResponse.json();
				console.log('✅ Salons fetched:', salonsData);
				
				// Admin salon ID'larini aniqlash
				const adminSalonIds = {
					'admin1': '0b62ba7b-2fc3-48c8-b2c7-f1c8b8639cb6', // Freya Corporate Beauty Center
					'admin2': 'f590077c-7c96-4bdc-9013-55620dabf651'  // Freya Beauty Private Salon
				};
				
				// Current user'ning username'iga qarab salon ID'sini aniqlash
				const currentAdminSalonId = user && user.username ? adminSalonIds[user.username] : null;
				
				if (currentAdminSalonId) {
					const adminSalon = salonsData.data.find(salon => salon.id === currentAdminSalonId);
					
					if (adminSalon) {
						console.log(`✅ ${user.username} salon found:`, adminSalon);
						setProfArr([adminSalon]);
						return adminSalon;
					} else {
						throw new Error(`${user.username} salon not found in salons list`);
					}
				} else {
					// Fallback: birinchi salon'ni olish
					const firstSalon = salonsData.data[0];
					if (firstSalon) {
						console.log('⚠️ Using first salon as fallback:', firstSalon);
						setProfArr([firstSalon]);
						return firstSalon;
					} else {
						throw new Error('No salons available');
					}
				}
			} else {
				const errorData = await salonsResponse.json();
				throw new Error(errorData.message || 'Failed to fetch salons');
			}
		} catch (error) {
			console.error('❌ Error fetching admin salon:', error);
			setAdminSalonError(error.message);
			setProfArr([]);
			throw error;
		} finally {
			setAdminSalonLoading(false);
		}
	};



	const handleAddWaitingEmp = (ids) => {
    const selectedEmployees = mastersArr.filter(
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
		e.preventDefault()
		setIsDragging(true)
		setStartX(e.pageX - containerRef.current.offsetLeft)
		setScrollLeft(containerRef.current.scrollLeft)
	}

	const handleMouseMove = (e, containerRef) => {
		if (!isDragging) return
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



const moreDataAppoint = useMemo(() => {
  let filteredAppoints = [...appointments];

  // Filter qo'shish
  if (selectedFilter) {
    const today = new Date();
    if (selectedFilter === 1) {
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      filteredAppoints = filteredAppoints.filter(item => {
        const appDate = new Date(item.application_date);
        return appDate.toISOString().split('T')[0] === todayStr;
      });
    } else if (selectedFilter === 2) {
      const firstDayOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      firstDayOfWeek.setDate(today.getDate() - diff);
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      filteredAppoints = filteredAppoints.filter(item => {
        const appDate = new Date(item.application_date);
        return appDate >= firstDayOfWeek && appDate <= lastDayOfWeek;
      });
    } else if (selectedFilter === 3) {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      filteredAppoints = filteredAppoints.filter(item => {
        const appDate = new Date(item.application_date);
        return appDate >= firstDayOfMonth && appDate <= lastDayOfMonth;
      });
    } else if (selectedFilter === 4) {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
      filteredAppoints = filteredAppoints.filter(item => {
        const appDate = new Date(item.application_date);
        return appDate >= firstDayOfYear && appDate <= lastDayOfYear;
      });
    }
  }

  // Ma'lumotlarni transformatsiya qilish
  return filteredAppoints.map((item) => {
    const date = new Date(item.application_date); // Faqat sana uchun
    const dayOfApp = date.getDate();
    const monthOfApp = date.getMonth(); // 0-11 oraliqda qaytaradi
    const yearOfApp = date.getFullYear();

    // application_time dan faqat soat va minutni olish
    const timeParts = item.application_time.split(':');
    const hourOfApp = parseInt(timeParts[0], 10); // Soatni olish
    const minuteOfApp = parseInt(timeParts[1], 10); // Minutni olish

    return {
      ...item,
      date: { day: dayOfApp, month: monthOfApp, year: yearOfApp },
      time: { hour: hourOfApp, minute: minuteOfApp },
    };
  });
}, [appointments, selectedFilter]);
	


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


	useEffect(() => {
		const savedPos = JSON.parse(localStorage.getItem("whiteBoxPos"));
		if (savedPos && whiteBoxRef.current) {
			const { topVH, leftVW, heightVH, widthVW } = savedPos;
			const whiteBox = whiteBoxRef.current;
			whiteBox.style.top = `${topVH}vh`;
			whiteBox.style.left = `${leftVW}vw`;
			whiteBox.style.height = `${heightVH}vh`;
			whiteBox.style.width = `${widthVW}vw`;
		}
	}, []);
	useEffect(() => {
		localStorage.setItem("icons", JSON.stringify(selectIcon));
	}, [selectIcon])




	return (
		<AppContext.Provider value={{
			t, handleChange, language, sidebarTop,
			lightImg, darkImg, selectedIcon, moreDataAppoint,
			selectedElement, setSelectedElement, isRightSidebarOpen,
			openRightSidebar, closeRightSidebar, selectIcon, handleClick,
			moveWhiteBoxToElement, whiteBoxRef,
			// Schedule state va funksiyalari
			isDragging, startX, scrollLeft, selectDay, setSelectDay,
			handleMouseDown, handleMouseMove, handleMouseUp, scrollRight,
			// Employees state
			waitingEmp, setWaitingEmp, handleAddWaitingEmp,
			isCheckedItem, setIsCheckedItem, handleRemoveWaitingEmp,
			// Home state
			selectedFilter, setSelectedFilter, confirmModal, setConfirmModal,
			mastersArr, setMastersArr, handleConfirm,
			//Schedule state
			addSched, setAddSched, schedArr,
			// Profile page state
			profArr, setProfArr, commentsArr, setCommentsArr,
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
	uploadSalonPhotos, deleteSalonPhoto

}}>
	{children}
</AppContext.Provider>
	)
}

export const UseGlobalContext = () => {
	return useContext(AppContext);
}