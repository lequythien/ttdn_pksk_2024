import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { assets } from "../assets/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import { AppContext } from "../context/AppContext";
import "../index.css";

const VITE_BACKEND_URI = import.meta.env.VITE_BACKEND_URI;

const Appointment = () => {
  const { docId } = useParams();
  const { user } = useContext(AppContext);
  const navigate = useNavigate();

  const phone = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")).phone
    : "";

  const [docInfo, setDocInfo] = useState(null);
  const [slotTime, setSlotTime] = useState("");
  const [doctorSchedule, setDoctorSchedule] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorLoadingSchedule, setErrorLoadingSchedule] = useState(false);
  const [isBookingDisabled, setIsBookingDisabled] = useState(false);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Fetch doctor information
  const fetchDocInfo = async () => {
    try {
      const response = await axios.get(`${VITE_BACKEND_URI}/doctor/find/${docId}`);
      setDocInfo(response.data);
    } catch (error) {
      console.error("Error fetching doctor info:", error);
      toast.error("Không thể lấy thông tin bác sĩ.");
    }
  };

  // Fetch doctor's schedule
  const fetchDoctorSchedule = async () => {
    try {
      const response = await axios.get(`${VITE_BACKEND_URI}/get-schedule-doctor/${docId}`);
      const groupedSchedule = response.data.reduce((acc, schedule) => {
        const dateStr = new Date(schedule.work_date).toISOString().split("T")[0];
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(schedule);
        return acc;
      }, {});
      setDoctorSchedule(groupedSchedule);
      setErrorLoadingSchedule(false);
    } catch (error) {
      console.error("Error fetching doctor schedule:", error);
      setErrorLoadingSchedule(true);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchDocInfo();
      await fetchDoctorSchedule();
      setLoading(false);
    };
    fetchData();
  }, [docId]);

  useEffect(() => {
    setSelectedDate(null);
    setSlotTime("");
  }, [docId]);

  // Handle booking appointment
  const handleBooking = () => {
    setIsBookingDisabled(true);
    setIsLoadingBooking(true);

    const loggedInUser = user || JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser) {
      toast.warn("Vui lòng đăng nhập để đặt lịch hẹn.", {
        onClose: () => {
          resetBookingState();
          navigate("/account");
        },
        autoClose: 3000,
      });
      setIsLoadingBooking(false);
      return;
    }

    if (!phone) {
      toast.warn(
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center mb-2">
            <p className="font-bold text-lg">Cảnh báo</p>
          </div>
          <p>Bạn chưa cập nhật số điện thoại.</p>
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => {
                navigate("/my-profile");
                resetBookingState();
                toast.dismiss();
              }}
              className="bg-green-500 text-white px-4 py-2 rounded transition duration-300 hover:bg-green-600"
            >
              Cập nhật
            </button>
            <button
              onClick={() => {
                resetBookingState(); // Reset state when canceling
                toast.dismiss();
              }}
              className="bg-gray-300 text-black px-4 py-2 rounded transition duration-300 hover:bg-gray-400"
            >
              Hủy
            </button>
          </div>
        </div>,
        {
          position: "top-center",
          autoClose: 5000,
          closeOnClick: false,
          draggable: false,
        }
      );
      setIsLoadingBooking(false);
      return;
    }

    if (!selectedDate || !slotTime) {
      toast.warn("Vui lòng chọn ngày và ca làm việc.", {
        onClose: () => resetBookingState(),
      });
      setIsLoadingBooking(false);
      return;
    }

    const formattedDate = new Date(selectedDate).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });

    toast.info(
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center mb-2">
          <p className="font-bold text-lg">Xác nhận</p>
        </div>
        <p>
          Bạn có chắc chắn muốn đặt lịch hẹn vào {formattedDate} ca {slotTime} không?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              confirmBooking();
              setIsLoadingBooking(false);
              toast.dismiss();
            }}
            className="bg-green-500 text-white px-4 py-2 rounded transition duration-300 hover:bg-green-600"
          >
            Xác nhận
          </button>
          <button
            onClick={() => {
              resetBookingState(); // Reset state when canceling confirmation
              setIsLoadingBooking(false);
              toast.dismiss();
            }}
            className="bg-gray-300 text-black px-4 py-2 rounded transition duration-300 hover:bg-gray-400"
          >
            Hủy
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: 5000,
        closeOnClick: false,
        draggable: false,
        onClose: () => setIsLoadingBooking(false),
      }
    );
  };

  const resetBookingState = () => {
    setSelectedDate(null);
    setSlotTime("");
    setIsBookingDisabled(false);
  };

  // Confirm the booking
  const confirmBooking = async () => {
    try {
      const patientId = user?.id || JSON.parse(localStorage.getItem("user"))?.id;
      if (!patientId) {
        console.error("Không tìm thấy thông tin bệnh nhân.");
        toast.error("Thông tin bệnh nhân không hợp lệ.");
        resetBookingState();
        return;
      }

      const selectedSchedule = doctorSchedule[selectedDate]?.find(
        (schedule) =>
          (schedule.work_shift === "morning" && slotTime === "Buổi sáng") ||
          (schedule.work_shift === "afternoon" && slotTime === "Buổi chiều")
      );

      if (!selectedSchedule) {
        console.error("Không tìm thấy ca làm việc đã chọn.");
        toast.error("Không tìm thấy lịch hẹn cho ngày và giờ đã chọn.");
        resetBookingState();
        return;
      }

      const appointmentData = {
        patient_id: patientId,
        doctor_id: docId,
        work_shift: selectedSchedule.work_shift,
        work_date: selectedSchedule.work_date,
      };

      const token = user?.token || "";
      await axios.post(
        `${VITE_BACKEND_URI}/create-appointment/${patientId}`,
        appointmentData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Đặt lịch hẹn thành công!");
      resetBookingState();
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error(error.response?.data?.message || "Lỗi không xác định.");
      resetBookingState();
    } finally {
      setIsLoadingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-2xl mt-10 text-gray-500">
        Đang tải thông tin bác sĩ...
      </div>
    );
  }

  if (!docInfo) {
    return (
      <div className="text-center text-2xl mt-10 text-gray-500">
        Không tìm thấy thông tin bác sĩ.
      </div>
    );
  }

  const formatPrice = (price) => {
    if (isNaN(price)) return price;
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const renderDescription = () => {
    if (!docInfo || !docInfo.description) return null;

    const description = docInfo.description;
    const isLongDescription = description.length > 300;

    return (
      <p className="text-sm text-gray-500 mt-1 max-w-full sm:max-w-[12000px]" style={{ lineHeight: "1.5", textAlign: "justify" }}>
        {isDescriptionExpanded ? description : `${description.substring(0, 300)}${isLongDescription ? '...' : ''}`}
        {isLongDescription && (
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          >
            {isDescriptionExpanded ? " (Thu gọn)" : " (Xem thêm)"}
          </span>
        )}
      </p>
    );
  };

  return (
    <div>
      <ToastContainer />
      {/* ----- Doctor Details ----- */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <img
            className="bg-primary w-full sm:max-w-72 rounded-lg"
            src={docInfo.user_id.image}
            alt=""
          />
        </div>

        <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
          <p className="flex items-center gap-2 text-2xl font-medium text-gray-900" style={{ lineHeight: "2.5" }}>
            {docInfo.user_id.name}
            <img className="w-5" src={assets.verified_icon} alt="Verified" />
          </p>
          <div className="flex items-center gap-2 text-sm mt-1 text-gray-600" style={{ lineHeight: "2.5" }}>
            <p>Giá: {docInfo.price ? formatPrice(docInfo.price) : "0"} VND</p>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1 text-gray-600" style={{ lineHeight: "2.5" }}>
            <p>Chuyên Khoa: {docInfo.specialization_id.name}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm mt-1 text-gray-600" style={{ lineHeight: "2.5" }}>
              <p>Số điện thoại: {docInfo.user_id.phone}</p>
            </div>
            <p className="flex items-center gap-1 text-sm font-medium text-gray-900" style={{ lineHeight: "2.5" }}>
              Giới thiệu <img src={assets.info_icon} alt="Info" />
            </p>
            {renderDescription()}
          </div>
        </div>
      </div>

      {/* ----- Booking slots ----- */}
      <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
        <p className="flex justify-between items-center">
          Đặt khám nhanh:
          {Object.keys(doctorSchedule).length > 8 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const scrollContainer = document.querySelector(".overflow-x-auto");
                  scrollContainer.scrollBy({ left: -100, behavior: "smooth" });
                }}
                className="w-10 h-10 bg-gray-300 text-black p-2 rounded-full transition-all duration-300 hover:bg-gray-400"
              >
                &#8592;
              </button>
              <button
                onClick={() => {
                  const scrollContainer = document.querySelector(".overflow-x-auto");
                  scrollContainer.scrollBy({ left: 100, behavior: "smooth" });
                }}
                className="w-10 h-10 bg-gray-300 text-black p-2 rounded-full transition-all duration-300 hover:bg-gray-400"
              >
                &#8594;
              </button>
            </div>
          )}
        </p>

        {errorLoadingSchedule ? (
          <p className="text-red-500">Hiện tại bác sĩ chưa có lịch làm việc.</p>
        ) : (
          <div className="relative">
            <div className="flex gap-3 items-center w-full overflow-x-auto mt-4 py-2 whitespace-nowrap">
              {Object.keys(doctorSchedule).map((dateStr) => {
                const date = new Date(dateStr);
                const dayOfWeek = date.toLocaleDateString("vi-VN", { weekday: "long" });
                const isSelected = selectedDate === dateStr;

                return (
                  <div
                    key={dateStr}
                    className={`text-center w-[80px] h-[80px] flex flex-col justify-center items-center rounded-full border cursor-pointer transition-all duration-300
                    ${isSelected
                        ? "bg-[#00759c] text-white border-[#00759c]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                      }
                    m-3 p-4`}
                    style={{ borderRadius: "50%" }}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setSlotTime(""); // Reset slot time
                      setIsBookingDisabled(false); // Reset booking disabled state
                    }}
                  >
                    <p className={`text-sm font-bold ${isSelected ? "text-white" : "text-gray-600"}`}>
                      {dayOfWeek}
                    </p>
                    <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-gray-500"}`}>
                      {`${date.getDate()}/${date.getMonth() + 1}`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedDate && !errorLoadingSchedule && (
          <div className="flex items-center gap-3 w-full overflow-x-auto mt-4 ml-5">
            {doctorSchedule[selectedDate]
              .sort((a, b) => (a.work_shift === "morning" ? -1 : 1))
              .map((schedule) => (
                <p
                  key={schedule._id}
                  onClick={() =>
                    setSlotTime(
                      schedule.work_shift === "morning" ? "Buổi sáng" : "Buổi chiều"
                    )
                  }
                  className={`text-sm font-semibold px-6 py-3 rounded-full cursor-pointer transition-all duration-300 ${slotTime === (schedule.work_shift === "morning" ? "Buổi sáng" : "Buổi chiều")
                    ? "bg-[#00759c] text-white"
                    : "text-gray-500 border border-gray-300 hover:border-[#00759c] hover:text-[#00759c]"
                    }`}
                >
                  {schedule.work_shift === "morning" ? "Buổi sáng" : "Buổi chiều"}
                </p>
              ))}
          </div>
        )}

        {selectedDate && slotTime && (
          <button
            onClick={handleBooking}
            disabled={isBookingDisabled || isLoadingBooking}
            className={`bg-[#00759c] text-white text-sm font-bold px-14 py-3 rounded-full my-6 ml-5 ${isBookingDisabled || isLoadingBooking ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {isLoadingBooking ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0 8 8 0 01-16 0z" />
                </svg>
                Đang đặt lịch...
              </div>
            ) : (
              "Đặt lịch hẹn"
            )}
          </button>
        )}
      </div>
      {/* ----- Related Doctors ----- */}
      <RelatedDoctors docId={docId} speciality={docInfo.specialization_id.name} />
    </div>
  );
};

export default Appointment;