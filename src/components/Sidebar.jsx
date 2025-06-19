// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// // import './css/Sidebar.css';

// export default function Sidebar({ user, onLogout, activeItem, setActiveItem }) {
//   const navigate = useNavigate();
//   const [menuOpen, setMenuOpen] = useState(false);

//   useEffect(() => {
//     const id = 'fontawesome-cdn';
//     if (!document.getElementById(id)) {
//       const link = document.createElement('link');
//       link.id = id;
//       link.rel = 'stylesheet';
//       link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
//       link.crossOrigin = 'anonymous';
//       document.head.appendChild(link);
//     }
//   }, []);

//   const menuItems = [
//     { key: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
//     { key: 'profile', icon: 'fas fa-user', label: 'Profile' },
//   ];

//   const handleMenuClick = (key) => {
//     setActiveItem(key);
//     setMenuOpen(false); // close menu on mobile
//     navigate(`/${key}`);
//   };

//   return (
//     <div className="custom-sidebar">
//       <button className="global-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
//         <i className="fas fa-bars"></i>
//       </button>

//       <div className="profile-header">
//         <div className="profile-pic">
//           <i className="fas fa-user-circle fa-2x"></i>
//         </div>
//         <div>
//           <h3>{user.name}</h3>
//           <p>{user.email}</p>
//         </div>
//       </div>

//       <ul className={`sidebar-menu ${menuOpen ? 'open' : ''}`}>
//         {menuItems.map((item) => (
//           <li
//             key={item.key}
//             className={activeItem === item.key ? 'active' : ''}
//             onClick={() => handleMenuClick(item.key)}
//           >
//             <i className={item.icon}></i> {item.label}
//           </li>
//         ))}
//         <li onClick={onLogout}>
//           <i className="fas fa-sign-out-alt"></i> Sign Out
//         </li>
//       </ul>
//     </div>
//   );
// }
