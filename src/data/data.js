// Test ma'lumotlari - Appointments
export const dataAppoint = [
  {
    id: 10000,
    customer_name: "Aziza Rahimova",
    appointment_date: "2025-09-14",
    appointment_time: "19:16:43.810Z",
    is_confirmed: false,
    is_verified: true,
    salon: 0,
    service: 30000,
    master: 0
  },
  {
    id: 10001,
    customer_name: "Sardor Xo'jayev",
    appointment_date: "2025-09-15",
    appointment_time: "19:06:43.810Z",
    is_confirmed: false,
    salon: 0,
    service: 30001,
    master: 40006
  },
  {
    id: 10002,
    customer_name: "Nodira Karimova",
    appointment_date: "2025-09-16",
    appointment_time: "19:16:43.810Z",
    is_confirmed: false,
    salon: 0,
    service: 30002,
    master: 40002
  },
  {
    id: 10003,
    customer_name: "Jamshid To'xtayev",
    appointment_date: "2025-09-17",
    appointment_time: "19:16:43.810Z",
    is_confirmed: false,
    salon: 0,
    service: 30003,
    master: 40001
  },
  {
    id: 10004,
    customer_name: "Gulnoza Saidova",
    appointment_date: "2025-09-18",
    appointment_time: "19:16:43.810Z",
    is_confirmed: false,
    salon: 0,
    service: 30004,
    master: 40011
  },
  {
    id: 10005,
    customer_name: "Shaxzod Axmedov",
    appointment_date: "2025-09-19",
    appointment_time: "19:16:43.810Z",
    is_confirmed: false,
    salon: 0,
    service: 30005,
    master: 40005
  },
  {
    id: 10006,
    customer_name: "Malika Yusupova",
    appointment_date: "2025-09-20",
    appointment_time: "19:16:43.810Z",
    is_confirmed: false,
    salon: 0,
    service: 30006,
    master: 40009
  },
  {
    id: 10007,
    customer_name: "Rustam Qodirov",
    appointment_date: "2025-09-21",
    appointment_time: "19:16:43.810Z",
    is_confirmed: false,
    salon: 0,
    service: 30007,
    master: 40007
  }
];

// Test ma'lumotlari - Employees/Masters
export const dataEmployees = [
  {
    id: 40001,
    name: "Dilnoza Karimova",
    username: "dilnoza_master",
    email: "dilnoza@freya.uz",
    phone: "+998901234567",
    role: "employee",
    salon_id: 1,
    specialization: "Soch kesish va bo'yash",
    experience_years: 5,
    rating: 4.8,
    is_active: true,
    avatar: "/images/masterImage.png"
  },
  {
    id: 40002,
    name: "Shohrux Toshmatov",
    username: "shohrux_barber",
    email: "shohrux@freya.uz",
    phone: "+998901234568",
    role: "employee",
    salon_id: 1,
    specialization: "Erkaklar sartaroshxonasi",
    experience_years: 3,
    rating: 4.6,
    is_active: true,
    avatar: "/images/masterImage.png"
  },
  {
    id: 40005,
    name: "Madina Yusupova",
    username: "madina_stylist",
    email: "madina@freya.uz",
    phone: "+998901234569",
    role: "employee",
    salon_id: 1,
    specialization: "Stilist va makiyaj",
    experience_years: 7,
    rating: 4.9,
    is_active: true,
    avatar: "/images/masterImage.png"
  },
  {
    id: 40006,
    name: "Bobur Rahmonov",
    username: "bobur_master",
    email: "bobur@freya.uz",
    phone: "+998901234570",
    role: "employee",
    salon_id: 1,
    specialization: "Soch kesish",
    experience_years: 4,
    rating: 4.7,
    is_active: true,
    avatar: "/images/masterImage.png"
  },
  {
    id: 40007,
    name: "Zarina Abdullayeva",
    username: "zarina_beauty",
    email: "zarina@freya.uz",
    phone: "+998901234571",
    role: "employee",
    salon_id: 1,
    specialization: "Go'zallik va parvarish",
    experience_years: 6,
    rating: 4.8,
    is_active: true,
    avatar: "/images/masterImage.png"
  },
  {
    id: 40009,
    name: "Jasur Mirzayev",
    username: "jasur_stylist",
    email: "jasur@freya.uz",
    phone: "+998901234572",
    role: "employee",
    salon_id: 1,
    specialization: "Erkaklar stili",
    experience_years: 5,
    rating: 4.5,
    is_active: true,
    avatar: "/images/masterImage.png"
  },
  {
    id: 40011,
    name: "Nigora Saidova",
    username: "nigora_master",
    email: "nigora@freya.uz",
    phone: "+998901234573",
    role: "employee",
    salon_id: 1,
    specialization: "Soch bo'yash va davolash",
    experience_years: 8,
    rating: 4.9,
    is_active: true,
    avatar: "/images/masterImage.png"
  }
];

// Test ma'lumotlari - Services
export const dataServices = [
  {
    id: 30000,
    name: "Soch kesish (ayollar)",
    name_uz: "Soch kesish (ayollar)",
    name_en: "Women's Haircut",
    name_ru: "Женская стрижка",
    description: "Professional ayollar soch kesish xizmati",
    price: 150000,
    duration: 60,
    salon_id: 1,
    category: "haircut",
    is_active: true
  },
  {
    id: 30001,
    name: "Soch kesish (erkaklar)",
    name_uz: "Soch kesish (erkaklar)",
    name_en: "Men's Haircut",
    name_ru: "Мужская стрижка",
    description: "Professional erkaklar soch kesish xizmati",
    price: 100000,
    duration: 45,
    salon_id: 1,
    category: "haircut",
    is_active: true
  },
  {
    id: 30002,
    name: "Soch bo'yash",
    name_uz: "Soch bo'yash",
    name_en: "Hair Coloring",
    name_ru: "Окрашивание волос",
    description: "Professional soch bo'yash xizmati",
    price: 300000,
    duration: 120,
    salon_id: 1,
    category: "coloring",
    is_active: true
  },
  {
    id: 30003,
    name: "Makiyaj",
    name_uz: "Makiyaj",
    name_en: "Makeup",
    name_ru: "Макияж",
    description: "Professional makiyaj xizmati",
    price: 200000,
    duration: 90,
    salon_id: 1,
    category: "makeup",
    is_active: true
  },
  {
    id: 30004,
    name: "Manikür",
    name_uz: "Manikür",
    name_en: "Manicure",
    name_ru: "Маникюр",
    description: "Professional manikür xizmati",
    price: 120000,
    duration: 75,
    salon_id: 1,
    category: "nails",
    is_active: true
  },
  {
    id: 30005,
    name: "Pedikür",
    name_uz: "Pedikür",
    name_en: "Pedicure",
    name_ru: "Педикюр",
    description: "Professional pedikür xizmati",
    price: 150000,
    duration: 90,
    salon_id: 1,
    category: "nails",
    is_active: true
  },
  {
    id: 30006,
    name: "Yuz parvarishi",
    name_uz: "Yuz parvarishi",
    name_en: "Facial Treatment",
    name_ru: "Уход за лицом",
    description: "Professional yuz parvarish xizmati",
    price: 250000,
    duration: 105,
    salon_id: 1,
    category: "skincare",
    is_active: true
  },
  {
    id: 30007,
    name: "Massaj",
    name_uz: "Massaj",
    name_en: "Massage",
    name_ru: "Массаж",
    description: "Relaksatsiya massaj xizmati",
    price: 180000,
    duration: 60,
    salon_id: 1,
    category: "massage",
    is_active: true
  }
];

// Test ma'lumotlari - Schedules
export const dataSchedules = [
  {
    id: 50001,
    employee_id: 40001,
    date: "2025-01-20",
    start_time: "09:00",
    end_time: "18:00",
    is_available: true,
    break_start: "13:00",
    break_end: "14:00"
  },
  {
    id: 50002,
    employee_id: 40002,
    date: "2025-01-20",
    start_time: "10:00",
    end_time: "19:00",
    is_available: true,
    break_start: "14:00",
    break_end: "15:00"
  },
  {
    id: 50003,
    employee_id: 40005,
    date: "2025-01-21",
    start_time: "08:00",
    end_time: "17:00",
    is_available: true,
    break_start: "12:00",
    break_end: "13:00"
  },
  {
    id: 50004,
    employee_id: 40006,
    date: "2025-01-21",
    start_time: "09:30",
    end_time: "18:30",
    is_available: true,
    break_start: "13:30",
    break_end: "14:30"
  }
];

// Test ma'lumotlari - Salons
export const dataSalons = [
  {
    id: 1,
    name: "Freya Beauty Salon",
    name_uz: "Freya Go'zallik Saloni",
    name_en: "Freya Beauty Salon",
    name_ru: "Салон красоты Freya",
    description: "Zamonaviy go'zallik saloni",
    description_uz: "Zamonaviy go'zallik saloni barcha xizmatlar bilan",
    description_en: "Modern beauty salon with all services",
    description_ru: "Современный салон красоты со всеми услугами",
    address: "Toshkent sh., Yunusobod tumani, Amir Temur ko'chasi 108",
    phone: "+998712345678",
    email: "info@freya.uz",
    website: "https://freya.uz",
    working_hours: {
      monday: "09:00-20:00",
      tuesday: "09:00-20:00",
      wednesday: "09:00-20:00",
      thursday: "09:00-20:00",
      friday: "09:00-20:00",
      saturday: "10:00-18:00",
      sunday: "Yopiq"
    },
    salon_comfort: ["wifi", "parking", "coffee", "music"],
    salon_additionals: [
      "Bepul Wi-Fi",
      "Avtomobil to'xtash joyi",
      "Bepul qahva va choy",
      "Bolalar o'yin zonasi"
    ],
    salon_sale: {
      amount: "20%",
      date: "2025-02-14"
    },
    rating: 4.8,
    is_active: true,
    salon_photos: [
      "/images/companyDemoImage.png",
      "/images/homeDashImg.png"
    ]
  }
];

// Test ma'lumotlari - Messages/Conversations
export const dataConversations = [
  {
    id: 60001,
    customer_id: 70001,
    customer_name: "Aziza Rahimova",
    last_message: "Ertaga soat 15:00 ga yozib qo'ying",
    last_message_time: "2025-01-19T14:30:00Z",
    unread_count: 2,
    is_active: true
  },
  {
    id: 60002,
    customer_id: 70002,
    customer_name: "Sardor Xo'jayev",
    last_message: "Rahmat, juda yaxshi xizmat",
    last_message_time: "2025-01-19T12:15:00Z",
    unread_count: 0,
    is_active: true
  },
  {
    id: 60003,
    customer_id: 70003,
    customer_name: "Nodira Karimova",
    last_message: "Narxlar haqida ma'lumot bering",
    last_message_time: "2025-01-19T10:45:00Z",
    unread_count: 1,
    is_active: true
  }
];

export const dataMessages = [
  {
    id: 80001,
    conversation_id: 60001,
    sender_id: 70001,
    sender_type: "customer",
    message: "Salom, ertaga bo'sh vaqtingiz bormi?",
    timestamp: "2025-01-19T14:25:00Z",
    is_read: true
  },
  {
    id: 80002,
    conversation_id: 60001,
    sender_id: 40001,
    sender_type: "employee",
    message: "Salom! Ha, ertaga soat 15:00 dan bo'sh",
    timestamp: "2025-01-19T14:27:00Z",
    is_read: true
  },
  {
    id: 80003,
    conversation_id: 60001,
    sender_id: 70001,
    sender_type: "customer",
    message: "Ertaga soat 15:00 ga yozib qo'ying",
    timestamp: "2025-01-19T14:30:00Z",
    is_read: false
  }
];

// Test ma'lumotlari - Statistics
export const dataStatistics = {
  daily: {
    appointments: 12,
    revenue: 2400000,
    new_customers: 3,
    completed_services: 10
  },
  weekly: {
    appointments: 78,
    revenue: 15600000,
    new_customers: 18,
    completed_services: 65
  },
  monthly: {
    appointments: 324,
    revenue: 64800000,
    new_customers: 89,
    completed_services: 298
  }
};
