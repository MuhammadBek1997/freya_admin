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

// API base URL configuration
const API_BASE_URL = import.meta.env.DEV 
  ? "http://localhost:3007/api"
  : import.meta.env.VITE_API_BASE_URL;

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



	// Check if user is already logged in on app start
	useEffect(() => {
		const token = localStorage.getItem('authToken');
		const userData = localStorage.getItem('userData');
		
		if (token && userData) {
			try {
				const parsedUser = JSON.parse(userData);
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

			const data = await response.json();
			console.log('Response data:', data);

			if (response.ok) {
				const userData = {
					id: data.user.id,
					username: data.user.username,
					email: data.user.email,
					full_name: data.user.full_name,
					role: 'admin',
					salon_id: data.user.salon_id
				};

				localStorage.setItem('authToken', data.token);
				localStorage.setItem('userData', JSON.stringify(userData));
				
				setUser(userData);
				setIsAuthenticated(true);
				
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

			if (response.ok) {
				const userData = {
					id: data.user.id,
					username: data.user.username || data.user.name,
					email: data.user.email,
					name: data.user.name,
					role: 'employee',
					salon_id: data.user.salon_id
				};

				localStorage.setItem('authToken', data.token);
				localStorage.setItem('userData', JSON.stringify(userData));
				
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
			fetchAppointments(user.salon_id);
			fetchSchedules();
			fetchEmployees();
			fetchServices();
			fetchSalons();
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
			employees, employeesLoading, employeesError, fetchEmployees,
			// Services state va funksiyalari
			services, servicesLoading, servicesError, fetchServices, createService,
			// Salons state va funksiyalari
			salons, salonsLoading, salonsError, fetchSalons

		}}>
			{children}
		</AppContext.Provider>
	)
}

export const UseGlobalContext = () => {
	return useContext(AppContext);
}