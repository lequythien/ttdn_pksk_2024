// notification
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const VITE_BACKEND_URI = import.meta.env.VITE_BACKEND_URI;

// Chức năng tính thời gian trước đây
const timeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  const seconds = diffInSeconds;
  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(diffInSeconds / 3600);
  const days = Math.floor(diffInSeconds / (3600 * 24));

  if (days > 0) return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  if (minutes > 0) return `${minutes} phút trước`;
  return `${seconds} giây trước`;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, setUnreadCount } = useContext(AppContext);
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);

  const token = user?.token || localStorage.getItem("token");
  const userId = JSON.parse(localStorage.getItem("user") || "{}").id;

  // Lấy thông báo từ server
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${VITE_BACKEND_URI}/notification/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNotifications(response.data.data);

      const unreadCount = response.data.data.filter(
        (notification) => !notification.isRead
      ).length;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user && !token) {
      navigate("/account");
    } else {
      fetchNotifications();
    }
  }, [token, navigate, user]);

  // Đánh dấu thông báo là đã đọc
  const handleNotificationClick = async (id) => {
    try {
      await axios.put(
        `${VITE_BACKEND_URI}/notification/read/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setActiveMenu(null);

      const updatedNotifications = notifications.map((notification) =>
        notification._id === id
          ? { ...notification, isRead: true }
          : notification
      );
      setNotifications(updatedNotifications);

      const unreadCount = updatedNotifications.filter(
        (notification) => !notification.isRead
      ).length;
      setUnreadCount(unreadCount);
      localStorage.setItem("unreadCount", unreadCount);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Xóa thông báo
  const handleDelete = async (notificationId) => {
    try {
      const response = await axios.delete(
        `${VITE_BACKEND_URI}/notification/delete/${notificationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        const deletedNotification = notifications.find(
          (n) => n._id === notificationId
        );
        const updatedNotifications = notifications.filter(
          (n) => n._id !== notificationId
        );
        setNotifications(updatedNotifications);

        if (!deletedNotification.isRead) {
          const unreadCount = updatedNotifications.filter(
            (notification) => !notification.isRead
          ).length;
          setUnreadCount(unreadCount);
        }
      } else {
        console.error("Could not delete notification on the server");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const sortedNotifications = notifications.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const displayedNotifications = showAll
    ? sortedNotifications
    : sortedNotifications.slice(0, 10);

  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setActiveMenu((prevMenu) => (prevMenu === id ? null : id));
  };

  return (
    <div className="container mx-auto p-4 cursor-pointer">
      <h1 className="text-2xl font-semibold mb-4">Thông báo của bạn</h1>

      {loading ? (
        <div className="text-center text-gray-500">Đang tải thông báo...</div>
      ) : notifications.length === 0 ? (
        <p className="text-center text-gray-500">Không có thông báo nào.</p>
      ) : (
        displayedNotifications.map((notification) => (
          <div
            key={notification._id}
            className={`flex items-start border-b border-gray-300 py-2 ${
              !notification.isRead ? "bg-transparent" : ""
            }`}
            onClick={() => handleNotificationClick(notification._id)}
          >
            <img
              src={assets.notification_icon}
              alt="Notification Icon"
              className="w-6 h-6"
            />
            <div className="flex-1 ml-3 cursor-pointer">
              <p className="font-medium mr-2">
                {notification.isRead ? (
                  notification.content
                ) : (
                  <strong>{notification.content}</strong>
                )}
              </p>
              <p className="text-xs text-gray-400">
                {timeAgo(notification.createdAt)}
              </p>
            </div>

            {/* 3 dots menu */}
            <div className="relative menu-container">
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={(e) => toggleMenu(notification._id, e)}
              >
                <span className="material-icons">
                  <i className="fa-solid fa-ellipsis hidden sm:inline"></i>
                  <i className="fa-solid fa-ellipsis-vertical sm:hidden"></i>
                </span>
              </button>

              {/* Dropdown menu */}
              {activeMenu === notification._id && (
                <div className="absolute right-0 mt-2 border border-gray-300 bg-white shadow-lg rounded-md w-48 z-10">
                  <ul className="text-sm">
                    <li
                      onClick={() => handleNotificationClick(notification._id)}
                      className="cursor-pointer hover:bg-gray-100 px-4 py-2 transition-all duration-200 rounded-md"
                    >
                      <i className="fa-solid fa-envelope-circle-check mr-2"></i>
                      Đánh dấu đã đọc
                    </li>

                    <li
                      onClick={() => handleDelete(notification._id)}
                      className="cursor-pointer hover:bg-red-100 text-red-500 px-4 py-2 transition-all duration-200 rounded-md"
                    >
                      <i className="fa-regular fa-trash-can mr-2"></i>
                      Xóa thông báo
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {notifications.length > 10 && (
        <div className="text-center mt-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="bg-gray-400 text-white py-2 px-4 rounded-full"
          >
            {showAll ? "Thu gọn" : "Xem tất cả"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
