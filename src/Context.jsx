import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { dataAppoint } from "./data/data";
import { mastersData } from "./data/mastersData";
import { scheduleData } from "./data/scheduleData";
import { companyData } from "./data/companyData";
import { comments } from "./data/commentsData";
import useFetch from "./hooks/useFetch";
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

const AppContext = createContext();

export const AppProvider = ({ children }) => {

	// Authentication state
	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [authLoading, setAuthLoading] = useState(true);

	// API base URL
	const API_BASE_URL = "https://freya-salon-backend-cc373ce6622a.herokuapp.com/api";

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
	};

	// Get auth token for API requests
	const getAuthToken = () => {
		return localStorage.getItem('authToken');
	};

	const handleConfirm = async (item) => {
		let newItem = {
			id: item.id,
			customer_name: item.customer_name,
			appointment_date: item.appointment_date,
			appointment_time: item.appointment_time,
			is_confirmed: false,
			salon: item.salon,
			service: item.service,
			master: item.master
		}

		try {
			const response = await fetch(appointUrl + `${item.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newItem),
			});

			if (!response.ok) {
				throw new Error("Update failed!");
			}

			const result = await response.json();
			console.log("✅ Updated:", result);

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
	const [selectDay, setSelectDay] = useState(scheduleData)

	// Employees sahifasi uchun state
	const [waitingEmp, setWaitingEmp] = useState(JSON.parse(localStorage.getItem("waitingEmp")) || [])

	// Home sahifasi uchun state
	const [selectedFilter, setSelectedFilter] = useState(null)
	const [mastersArr, setMastersArr] = useState(mastersData)

	// Schedule qo'shish uchun
	const [addSched, setAddSched] = useState(false)
	const [schedArr, setSchedArr] = useState(scheduleData)
	const [commentsArr , setCommentsArr] = useState(comments)

	

	// Profile uchun data
	const [profArr , setProfArr] = useState(companyData)



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

	// const confirmCustomer = (amount)=>{
	// 	setConfirmModal(true)

	// }

	


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
  let filteredAppoints = [...dataAppoint];

  // Filter qo'shish
  if (selectedFilter) {
    const today = new Date();
    if (selectedFilter === 1) {
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      filteredAppoints = filteredAppoints.filter(item => item.appointment_date === todayStr);
    } else if (selectedFilter === 2) {
      const firstDayOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      firstDayOfWeek.setDate(today.getDate() - diff);
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      filteredAppoints = filteredAppoints.filter(item => {
        const appDate = new Date(item.appointment_date);
        return appDate >= firstDayOfWeek && appDate <= lastDayOfWeek;
      });
    } else if (selectedFilter === 3) {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      filteredAppoints = filteredAppoints.filter(item => {
        const appDate = new Date(item.appointment_date);
        return appDate >= firstDayOfMonth && appDate <= lastDayOfMonth;
      });
    } else if (selectedFilter === 4) {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
      filteredAppoints = filteredAppoints.filter(item => {
        const appDate = new Date(item.appointment_date);
        return appDate >= firstDayOfYear && appDate <= lastDayOfYear;
      });
    }
  }

  // Ma'lumotlarni transformatsiya qilish
  return filteredAppoints.map((item) => {
    const date = new Date(item.appointment_date); // Faqat sana uchun
    const dayOfApp = date.getDate();
    const monthOfApp = date.getMonth(); // 0-11 oraliqda qaytaradi
    const yearOfApp = date.getFullYear();

    // appointment_time dan faqat soat va minutni olish
    const timeParts = item.appointment_time.split(':');
    const hourOfApp = parseInt(timeParts[0], 10); // Soatni olish
    const minuteOfApp = parseInt(timeParts[1], 10); // Minutni olish

    return {
      ...item,
      date: { day: dayOfApp, month: monthOfApp, year: yearOfApp },
      time: { hour: hourOfApp, minute: minuteOfApp },
    };
  });
}, [selectedFilter]);
	


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

		whiteBox.style.top = `${topVH}vh`;
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
			companyData,commentsArr,
			// Authentication state va funksiyalari
			user, isAuthenticated, authLoading,
			loginAdmin, loginEmployee, logout, getAuthToken

		}}>
			{children}
		</AppContext.Provider>
	)
}

export const UseGlobalContext = () => {
	return useContext(AppContext);
}