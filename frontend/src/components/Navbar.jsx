import React, { useContext, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

const VITE_BACKEND_URI = import.meta.env.VITE_BACKEND_URI;

const Navbar = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AppContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const token = localStorage.getItem('token');

  // Sử dụng useRef để giữ kết nối WebSocket
  const wsRef = useRef(null);

  useEffect(() => {
    // Kiểm tra token khi component được khởi tạo
    if (token) {
      // Bạn có thể gọi API để lấy thông tin người dùng dựa trên token
      // Ví dụ: fetchUserData(token).then(setUser);
      // Hoặc nếu bạn đã có thông tin người dùng trong localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        setUser(userData);
      }
    }
  }, [token, setUser]);

  useEffect(() => {
    if (user) {
      // Khởi tạo WebSocket
      const wsProtocol =
        window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      const ws = new WebSocket(`${wsProtocol}${VITE_BACKEND_URI.replace('http://', '')}`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ user_id: user.id }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };

      return () => ws.close();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/account');
  };

  const requestNotificationUpdate = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ user_id: user.id, action: 'update' }));
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      requestNotificationUpdate();
    }, 2000);
    return () => clearInterval(intervalId);
  }, [user]);

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  return (
    <div className="flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400 bg-white sticky top-0 z-50">
      <img
        onClick={() => navigate('/')}
        className="w-20 sm:w-24 cursor-pointer"
        src={assets.logo}
        alt="Logo"
      />

      <ul className="hidden md:flex items-start gap-5 font-medium">
        <NavLink to="/" activeClassName="underline">
          <li className="py-1 text-base">Trang chủ</li>
        </NavLink>
        <NavLink to="/doctors" activeClassName="underline">
          <li className="py-1 text-base">Tất cả bác sĩ</li>
        </NavLink>
        <NavLink to="/abouts" activeClassName="underline">
          <li className="py-1 text-base">Về chúng tôi</li>
        </NavLink>
        <NavLink to="/contact" activeClassName="underline">
          <li className="py-1 text-base">Liên hệ</li>
        </NavLink>
        <NavLink to="/all-schedule" activeClassName="underline">
          <li className="py-1 text-base">Lịch làm việc</li>
        </NavLink>
      </ul>

      <div className="flex items-center gap-4">
        {user ? (
          <div
            className="flex items-center gap-2 cursor-pointer relative"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <img className="w-8 rounded-full" src={assets.profile_pic} alt="Avatar" />
            <p className="font-medium text-gray-700">{user.name}</p>
            <img className="w-2.5" src={assets.dropdown_icon} alt="Dropdown Icon" />
            {showDropdown && (
              <div className="absolute top-0 -left-6 pt-14 text-base font-medium text-gray-600 z-20">
                <div className="min-w-52 bg-stone-100 rounded flex flex-col gap-4 p-4">
                  <p onClick={() => navigate('my-profile')} className="hover:text-black cursor-pointer">
                    Hồ sơ của tôi
                  </p>
                  <p onClick={() => navigate('my-appointments')} className="hover:text-black cursor-pointer">
                    Lịch hẹn của tôi
                  </p>
                  <p onClick={() => navigate('medical-history')} className="hover:text-black cursor-pointer">
                    Lịch sử khám bệnh
                  </p>
                  <p onClick={handleLogout} className="hover:text-black cursor-pointer">
                    Đăng xuất
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <NavLink to="/account">
            <button className="bg-[#00759c] text-white px-8 py-3 rounded-full font-light hidden md:block">
              Đăng nhập
            </button>
          </NavLink>
        )}

        {user && (
          <div className="relative">
            <img
              onClick={() => {
                handleNotificationClick();
                requestNotificationUpdate(); // Yêu cầu cập nhật danh sách thông báo khi click
              }}
              className="w-6 cursor-pointer"
              src={assets.notification_icon}
              alt="Thông báo"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
