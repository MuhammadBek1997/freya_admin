export const companyData = [
  {
    id: 0,
    name: "GLAMFACE",
    title:"GLAMFACE — Твоя территория красоты",
    rating: 3.5,
    icon: '/images/companyIcon.png',
    company_images: [
      '/images/companyDemoImage.png',
      '/images/companyDemoImage.png',
      '/images/companyDemoImage.png',
      '/images/companyDemoImage.png',
      '/images/companyDemoImage.png',
    ],
    working_hours: {
      start_time: "8:00",
      end_time: "22:00"
    },
    phone: ["+998712002310"],
    address: "Tashkent, Mirzo Ulug'bek tumani, Bog'ishamol ko'chasi",
    location:{
      long:"69.22609051466301",
      lat:"41.25939201584926"
    },
    employees: [
      { name: "Аниса Рахимова", phone: "+998 90 123-45-67" },
      { name: "Анна Смирнова", phone: "+998 91 234-56-78" },
      { name: "Диляра Юлдашева", phone: "+998 93 345-67-89" },
      { name: "Мария Иванова", phone: "+998 94 456-78-90" },
      { name: "Екатерина Петрова", phone: "+998 95 567-89-01" }
    ],
    social_media: [
      {
        type: "Instagram",
        link: "https://instagram.com/glamface_uz"
      }
    ],
    description: "GLAMFACE — это место, где ты становишься самой лучшей версией себя. Мы объединяем профессионализм, уют и безупречный стиль. У нас работают мастера, влюблённые в своё дело — от идеального макияжа и укладки до ухода за кожей и ногтями. Каждый клиент — это вдохновение для нас. Мы не просто оказываем услуги, мы создаём атмосферу, в которую хочется возвращаться снова и снова. GLAMFACE — это пространство, где забота о красоте превращается в настоящий ритуал. Здесь каждая деталь продумана до мелочей: от приятной атмосферы и дружелюбной команды до высокого уровня сервиса и индивидуального подхода. Мы верим, что красота начинается с внутренней гармонии, и именно поэтому наши мастера стремятся подчеркнуть естественные достоинства каждого клиента, создавая образы, которые отражают стиль, характер и настроение. Мы ценим доверие и время наших гостей, поэтому всё, что мы делаем, направлено на то, чтобы ты чувствовала себя особенной. GLAMFACE — это больше, чем бьюти-пространство. Это место силы, вдохновения и уверенности, где ты открываешь в себе новые грани и учишься любить себя ещё больше.",
    additionals:[
      "Мы заботимся о вашей безопасности и красоте — стерильные инструменты, премиум-материалы и индивидуальный подход гарантированы.",
      "Запись по предварительной договорённости.",
      "Следите за акциями и розыгрышами в наших соцсетях!"
    ],
    facilities: [
      { name: "parking", icon: "/images/parking", value: false },
      { name: "water", icon: "/images/water", value: true },
      { name: "bath", icon: "/images/bath", value: true },
      { name: "allow16", icon: "/images/child", value: true },
      { name: "cafe", icon: "/images/cafe", value: true },
      { name: "pets", icon: "/images/pets", value: false },
      { name: "towel", icon: "/images/towels", value: true },
      { name: "allow14", icon: "/images/child", value: false },
      { name: "onlyFemale", icon: "/images/female", value: true }
    ],
    comments:[
      {
        author:"",
        title:""
      }
    ],
    paymentSystem:{
      card_number:"9860010123456789",
      card_type:"HUMO",
      summ:1029230
    },
    top_clients:[
      {
          id:0 ,
          name:"Palonchi",
          phone:"+998901234567",
          visits:14
      },
      {
          id:1 ,
          name:"Palonchi",
          phone:"+998901234567",
          visits:14
      },
      {
          id:2,
          name:"Palonchi",
          phone:"+998901234567",
          visits:14
      },
      {
          id:3 ,
          name:"Palonchi",
          phone:"+998901234567",
          visits:14
      },
      {
          id:4 ,
          name:"Palonchi",
          phone:"+998901234567",
          visits:14
      },
    ]
  },
  {
    id: 1,
    name: "BEAUTY STUDIO",
    rating: 4.5,
    icon: '/images/companyIcon.png',
    company_images: [
      '/images/companyDemoImage.png',
      '/images/companyDemoImage.png'
    ],
    working_hours: {
      start_time: "8:00",
      end_time: "22:00"
    },
    phone: ["+998 71 300-12-34", "+998 90 987-65-43"],
    address: "Tashkent, Yunusobod tumani, Amir Temur ko'chasi",
    employees: [
      { name: "Сабина Алимова", phone: "+998 91 876-54-32" },
      { name: "Ольга Козлова", phone: "+998 93 765-43-21" }
    ],
    social_media: ["https://instagram.com/beautystudio_tz"],
    description: "Современный салон красоты с профессиональными мастерами.",
    facilities: [
      { name: "parking", icon: "/images/parking", value: false },
      { name: "water", icon: "/images/water", value: true },
      { name: "bath", icon: "/images/bath", value: true },
      { name: "allow14", icon: "/images/child", value: false },
      { name: "allow16", icon: "/images/child", value: true },
      { name: "cafe", icon: "/images/cafe", value: true },
      { name: "pets", icon: "/images/pets", value: false },
      { name: "towel", icon: "/images/towel", value: true },
      { name: "onlyFemale", icon: "/images/female", value: true }
    ]
  }
];