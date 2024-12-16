import { BellIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AdminContext } from "../context/AdminContext";
import { DoctorContext } from "../context/DoctorContext";
import "../index.css";

const VITE_BACKEND_URI = import.meta.env.VITE_BACKEND_URI;

const Navbar = () => {
  const { aToken, setAToken } = useContext(AdminContext);
  const { dToken, setDToken } = useContext(DoctorContext);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Kiểm tra token khi khởi động
  useEffect(() => {
    const storedAToken = localStorage.getItem("aToken");
    const storedDToken = localStorage.getItem("dToken");

    if (storedAToken) {
      setAToken(storedAToken);
    }

    if (storedDToken) {
      setDToken(storedDToken);
    }
  }, [setAToken, setDToken]);

  const logout = () => {
    navigate("/login");
    setAToken("");
    localStorage.removeItem("aToken");
    setDToken("");
    localStorage.removeItem("dToken");
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const fetchNotifications = async () => {
    try {
      const doctorInfo = JSON.parse(sessionStorage.getItem("doctorInfo"));
      const doctorId = doctorInfo ? doctorInfo.id : null;
      const response = await axios.get(
        `${VITE_BACKEND_URI}/notification/get-notification-doctor/${doctorId}`
      );
      setNotifications(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy thông báo:", error);
    }
  };

  useEffect(() => {
    if (dToken) {
      fetchNotifications();
    }
  }, [dToken]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${VITE_BACKEND_URI}/notification/read/${notificationId}`
      );
      const updatedNotifications = notifications.map((notification) =>
        notification._id === notificationId
          ? { ...notification, isRead: true }
          : notification
      );
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error("Lỗi khi cập nhật thông báo:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (dToken) {
        fetchNotifications();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dToken]);

  const handleDelete = async (notificationId) => {
    try {
      await axios.delete(
        `${VITE_BACKEND_URI}/notification/delete/${notificationId}`
      );
      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== notificationId)
      );
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);
    }
  };

  const groupedNotifications = notifications
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .reduce((acc, notification) => {
      const time = notification.createdAt;
      if (!acc[time]) {
        acc[time] = [];
      }
      acc[time].push(notification);
      return acc;
    }, {});

  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.pointerEvents = "none";
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.pointerEvents = "auto";
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.pointerEvents = "auto";
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  return (
    <div className="flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white sticky top-0 z-50">
      <a
        href={
          aToken
            ? "http://localhost:5174/admin-dashboard"
            : "http://localhost:5174/doctor-dashboard"
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
          <img
            className="w-36 sm:w-40 cursor-pointer"
            src={assets.admin_logo}
            alt=""
          />
          <p className="border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600 text-center sm:text-left">
            {aToken ? "Quản trị viên" : "Bác sĩ"}
          </p>
        </div>
      </a>

      <div className="flex items-center gap-4">
        {!aToken && (
          <div
            className="relative cursor-pointer"
            onClick={toggleModal}
            role="button"
            aria-label="Mở thông báo"
          >
            <BellIcon className="w-6 h-6 text-gray-600" />
            {unreadNotifications > 0 && (
              <span
                className="absolute bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center -top-1 -right-1"
                role="button"
                aria-label="Xem thông báo chưa đọc"
              >
                {unreadNotifications}
              </span>
            )}
          </div>
        )}

        <button
          onClick={logout}
          className="bg-[#0091a1] text-white text-sm px-5 py-2 rounded-full"
        >
          <span className="hidden md:inline">Đăng xuất</span>
          <i className="fa-solid fa-right-from-bracket mx-2"></i>
        </button>
      </div>

      {isModalOpen && !aToken && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-gray-500 bg-opacity-50">
          <div className="bg-white p-5 rounded-lg w-4/5 sm:w-3/4 lg:w-1/2 max-w-5xl modal-content">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Thông báo</h3>
              <button onClick={toggleModal} className="text-gray-500 text-lg">
                Đóng
              </button>
            </div>
            <div className="mt-6">
              {Object.keys(groupedNotifications).length > 0 ? (
                <div className="h-80 overflow-y-auto">
                  {Object.keys(groupedNotifications).map((time) => (
                    <div key={time}>
                      <h4 className="font-semibold text-sm text-gray-500 mt-4">
                        {formatTime(time)}
                      </h4>
                      <ul className="space-y-4">
                        {groupedNotifications[time].map((notification) => (
                          <li
                            key={notification._id}
                            className={`py-3 px-4 border-b border-black-200 flex items-start justify-between gap-2 hover:bg-blue-50 cursor-pointer ${
                              !notification.isRead
                                ? "font-semibold bg-gray-100"
                                : ""
                            }`}
                            onClick={() => markAsRead(notification._id)}
                          >
                            <div className="flex items-start gap-2">
                              <i className="fa-regular fa-bell mt-1"></i>
                              <p className="md:text-base text-sm text-gray-800">
                                {notification.content}
                              </p>
                            </div>
                            <li
                              onClick={(e) => {
                                e.stopPropagation(); // Ngăn chặn sự kiện click lan truyền
                                handleDelete(notification._id);
                              }}
                              className="cursor-pointer hover:bg-red-100 text-red-500 px-4 py-2 transition-all duration-200 rounded-md"
                            >
                              <i className="fa-regular fa-trash-can"></i>
                            </li>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Không có thông báo mới.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
