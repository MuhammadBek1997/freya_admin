// Frontend kodlarni tekshirdim. Employee bilan bog'liq bir nechta muammo bor:
// 1. Employees.jsx - mastersArr bo'sh keladi
// Employees.jsx da mastersArr dan foydalanilmoqda, lekin u Context'da to'g'ri yangilanmayapti.
// Context.jsxda fetchEmployees funksiyasi mavjud va setMastersArr(items) qiladi, lekin Employees.jsx sahifasi ochilganda bu funksiya chaqirilmayapti.
// Yechim: Employees.jsx da useEffect qo'shish
// javascript// Employees.jsx ga qo'shing
// import React, { useState, useEffect } from 'react';
// import { UseGlobalContext } from '../Context';

// const Employees = () => {
//   const { 
//     t, waitingEmp, setWaitingEmp, mastersArr, setMastersArr, 
//     handleAddWaitingEmp, handleRemoveWaitingEmp, isCheckedItem, setIsCheckedItem,
//     fetchEmployees, employeesLoading  // 👈 Bu ikkalasini qo'shing
//   } = UseGlobalContext();
  
//   const [openCardId, setOpenCardId] = useState(null);
//   const [isMenuOpen, setIsMenuOpen] = useState({ menu: null, cardId: null });
//   const [showWait, setShowWait] = useState(false);
//   const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);

//   // 👇 Bu useEffect ni qo'shing
//   useEffect(() => {
//     // Sahifa ochilganda xodimlarni yuklash
//     fetchEmployees();
//   }, []);

//   // Function to toggle the menu for a specific card
//   const handleToggleMenu = (id) => {
//     setOpenCardId((prevId) => (prevId === id ? null : id));
//   };

//   // ... qolgan kod

//   return (
//     <section>
//       <nav className="employ-nav">
//         {/* ... */}
//         <div className="employ-nav-summ">
//           <h2>{mastersArr.length}</h2>
//           <h5>{t('employSmry')}</h5>
//         </div>
//       </nav>
      
//       <div className="employ-body">
//         {employeesLoading ? (
//           <div style={{ textAlign: 'center', padding: '2rem' }}>
//             {t('loading')}...
//           </div>
//         ) : showWait ? (
//           waitingEmp.map((item) => (
//             <EmployWaitingCard key={item.id} {...item} /* ... */ />
//           ))
//         ) : (
//           workingEmployees.map((item) => (
//             <EmployeeCard key={item.id} {...item} /* ... */ />
//           ))
//         )}
//       </div>
      
//       {/* ... qolgan kod */}
//     </section>
//   );
// };

// export default Employees;

// 2. Context.jsx - fetchEmployees muammosi
// Context.jsx da fetchEmployees to'g'ri ishlayapti, lekin faqat useEffect da chaqirilyapti (login bo'lgandan keyin). Lekin Employees sahifasi ochilganda qayta chaqirilmaydi.
// Yechim: Context.jsx ni export qilish
// Context.jsx da fetchEmployees allaqachon export qilingan, shuning uchun Employees.jsx dan chaqirilishi mumkin. Yuqoridagi yechim bilan hal bo'ladi.

// 3. AddEmployeeModal - xodim yaratish
// AddEmployeeModal komponenti kodda ko'rsatilmagan, lekin createEmployee funksiyasi Context.jsx da mavjud.
// Modal komponent quyidagicha bo'lishi kerak:
// javascript// AddEmployeeModal.jsx
// import React, { useState } from 'react';
// import { UseGlobalContext } from '../Context';

// const AddEmployeeModal = ({ onClose, onEmployeeAdded }) => {
//   const { t, createEmployee, user } = UseGlobalContext();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
  
//   const [formData, setFormData] = useState({
//     name: '',
//     username: '',
//     password: '',
//     phone: '',
//     email: '',
//     position: '',
//     salon_id: user?.salon_id || ''
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     try {
//       await createEmployee(formData);
//       onEmployeeAdded(); // Sahifani yangilash
//       onClose(); // Modalni yopish
//     } catch (err) {
//       setError(err.message || 'Xodim yaratishda xatolik');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//         <h2>{t('employAddBtn')}</h2>
        
//         {error && (
//           <div style={{ color: 'red', marginBottom: '1rem' }}>
//             {error}
//           </div>
//         )}
        
//         <form onSubmit={handleSubmit}>
//           <input
//             type="text"
//             placeholder="Ism"
//             value={formData.name}
//             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//             required
//           />
          
//           <input
//             type="text"
//             placeholder="Username"
//             value={formData.username}
//             onChange={(e) => setFormData({ ...formData, username: e.target.value })}
//             required
//           />
          
//           <input
//             type="password"
//             placeholder="Parol"
//             value={formData.password}
//             onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//             required
//           />
          
//           <input
//             type="tel"
//             placeholder="Telefon"
//             value={formData.phone}
//             onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//           />
          
//           <input
//             type="email"
//             placeholder="Email"
//             value={formData.email}
//             onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//           />
          
//           <input
//             type="text"
//             placeholder="Lavozim"
//             value={formData.position}
//             onChange={(e) => setFormData({ ...formData, position: e.target.value })}
//           />
          
//           <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
//             <button type="submit" disabled={loading}>
//               {loading ? 'Yuklanmoqda...' : 'Qo\'shish'}
//             </button>
//             <button type="button" onClick={onClose}>
//               Bekor qilish
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddEmployeeModal;