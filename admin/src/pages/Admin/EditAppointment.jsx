import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../../index.css";

const VITE_BACKEND_URI = import.meta.env.VITE_BACKEND_URI;

const AppointmentDetails = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await axios.get(
          `${VITE_BACKEND_URI}/appointment/find/${id}`
        );
        if (response.data.success) {
          setAppointment(response.data.data);
          setSelectedDoctorId(response.data.data.doctor_id);
        } else {
          toast.error("Không tìm thấy thông tin cuộc hẹn!");
        }
      } catch (error) {
        toast.error(
          error.response?.data.message || "Đã xảy ra lỗi khi lấy thông tin!"
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchDoctors = async () => {
      try {
        const response = await axios.get(`${VITE_BACKEND_URI}/doctor/find-all`);
        if (response.data.success) {
          setDoctors(response.data.doctors);
        } else {
          toast.error("Không tìm thấy danh sách bác sĩ!");
        }
      } catch (error) {
        toast.error(
          error.response?.data.message ||
          "Đã xảy ra lỗi khi lấy danh sách bác sĩ!"
        );
      }
    };

    fetchAppointment();
    fetchDoctors();
  }, [id]);

  useEffect(() => {
    const fetchDoctorSchedules = async () => {
      if (selectedDoctorId) {
        try {
          const doctor = doctors.find((doc) => doc._id === selectedDoctorId);
          if (doctor) {
            const currentDateTime = new Date();
            const filteredSchedules = doctor.schedules.filter((schedule) => {
              const scheduleDate = new Date(schedule.work_date);
              const morningShiftStart = new Date(scheduleDate);
              morningShiftStart.setHours(7, 30);

              const afternoonShiftStart = new Date(scheduleDate);
              afternoonShiftStart.setHours(13, 30);
              return (
                scheduleDate > currentDateTime ||
                (schedule.work_shift === "morning" &&
                  morningShiftStart > currentDateTime) ||
                (schedule.work_shift === "afternoon" &&
                  afternoonShiftStart > currentDateTime)
              );
            });

            setDoctorSchedules(filteredSchedules);

            // Nếu không có lịch làm việc, xóa thông tin lịch làm việc
            if (filteredSchedules.length === 0) {
              setAppointment((prev) => ({
                ...prev,
                work_date: "",
                work_shift: "",
              }));
            }
          }
        } catch (error) {
          toast.error("Đã xảy ra lỗi khi lấy lịch làm việc của bác sĩ!");
        }
      }
    };

    fetchDoctorSchedules();
  }, [selectedDoctorId, doctors]);

  const onCancelHandler = () => {
    navigate("/all-appointments");
  };

  const handleDoctorChange = (event) => {
    const newDoctorId = event.target.value; // Lưu ID bác sĩ mới
    setSelectedDoctorId(newDoctorId); // Cập nhật bác sĩ được chọn

    // Xóa lịch làm việc cũ khi bác sĩ thay đổi
    setAppointment((prev) => ({
      ...prev,
      work_date: "",
      work_shift: "",
    }));
  };

  const handleScheduleChange = (event) => {
    const selectedSchedule = doctorSchedules.find(
      (schedule) => schedule.work_date === event.target.value
    );
    if (selectedSchedule) {
      setAppointment((prev) => ({
        ...prev,
        work_date: selectedSchedule.work_date,
        work_shift: selectedSchedule.work_shift,
      }));
    } else {
      // Nếu không chọn lịch nào, xóa thông tin lịch làm việc
      setAppointment((prev) => ({
        ...prev,
        work_date: "",
        work_shift: "",
      }));
    }
  };

  const handleUpdateAppointment = async () => {
    setIsLoadingUpdate(true); // Bắt đầu loading
    try {
      const updatedData = {
        work_date: appointment.work_date,
        work_shift: appointment.work_shift,
        doctor_id: selectedDoctorId,
        patient_id: appointment.patient_id,
        status: appointment.status,
      };

      const response = await axios.put(
        `${VITE_BACKEND_URI}/appointment/admin-update/${id}`,
        updatedData
      );

      if (response.data.success) {
        toast.success("Cập nhật cuộc hẹn thành công!");
        navigate("/all-appointments");
      } else {
        toast.error("Cập nhật cuộc hẹn thất bại!");
      }
    } catch (error) {
      toast.error(
        error.response?.data.message || "Đã xảy ra lỗi khi cập nhật!"
      );
    } finally {
      setIsLoadingUpdate(false); // Kết thúc loading
    }
  };

  if (loading) {
    return <div className="items-center">Loading...</div>;
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full">
        <div className="flex flex-col items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-20 w-20 text-gray-500 mb-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-13a1 1 0 112 0v2a1 1 0 11-2 0V5zm0 4a1 1 0 112 0v4a1 1 0 11-2 0V9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-lg font-semibold text-gray-700">
            Không có thông tin cuộc hẹn.
          </p>
        </div>
      </div>
    ); // Nếu không có thông tin
  }

  return (
    <div className="m-5 w-full">
      {/* Giao diện Desktop */}
      <div className="hidden lg:block">
        <form>
          <div className="flex justify-between items-center mb-4">
            <p className="md:text-3xl text-xl font-bold text-[#0091a1]">Thông tin cuộc hẹn</p>
          </div>
          <div className="overflow-x-auto bg-white p-4 rounded-md shadow-md">
            <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-500">
              <div className="w-full lg:flex-1 flex flex-col gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <p className="font-bold">Bác sĩ:</p>
                  <select
                    className="border rounded px-3 py-2 text-black"
                    value={selectedDoctorId}
                    onChange={handleDoctorChange}
                  >
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        {doctor.user_id.name} ({doctor.specialization_id.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <p className="font-bold">Bệnh nhân:</p>
                  <input
                    className="border rounded px-3 py-2"
                    type="text"
                    value={appointment.patient_name}
                    readOnly
                  />
                </div>
              </div>

              <div className="w-full lg:flex-1 flex flex-col gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <p className="font-bold">Ngày - Ca khám:</p>
                  <select
                    className="border rounded px-3 py-2"
                    value={appointment.work_date}
                    onChange={handleScheduleChange}
                  >
                    <option value="">Chọn ngày khám</option>
                    {doctorSchedules.map((schedule) => (
                      <option key={schedule.work_date} value={schedule.work_date}>
                        {new Date(schedule.work_date).toLocaleDateString()} - {schedule.work_shift === "morning" ? "Sáng" : "Chiều"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <p className="font-bold">Trạng thái:</p>
                  <input
                    className="border rounded px-3 py-2"
                    type="text"
                    value={
                      appointment.status === "canceled"
                        ? "Đã huỷ"
                        : appointment.status === "confirmed"
                          ? "Đã xác nhận"
                          : appointment.status === "pending"
                            ? "Đang chờ xác nhận"
                            : "Đã xác nhận"
                    }
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={handleUpdateAppointment}
                className={`bg-blue-500 px-10 py-3 text-white rounded-full hover:bg-blue-600 ${isLoadingUpdate ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isLoadingUpdate}
              >
                {isLoadingUpdate ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                  </div>
                ) : (
                  "Cập nhật"
                )}
              </button>
              <button
                type="button"
                onClick={onCancelHandler}
                className="bg-gray-300 px-10 py-3 text-black rounded-full hover:bg-gray-400"
              >
                Quay lại
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Giao diện Mobile */}
      <div className="lg:hidden">
        <form>
          <div className="flex justify-between items-center mb-2">
            <p className="text-2xl font-bold text-[#0091a1]">Thông tin cuộc hẹn</p>
          </div>
          <div className="overflow-x-auto bg-white p-2 rounded-md shadow-md">
            <div className="flex flex-col gap-2 text-gray-500">
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm">Bác sĩ:</p>
                <select
                  className="border rounded px-2 py-1 text-black text-sm"
                  value={selectedDoctorId}
                  onChange={handleDoctorChange}
                >
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.user_id.name} ({doctor.specialization_id.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm">Bệnh nhân:</p>
                <input
                  className="border rounded px-2 py-1 text-sm"
                  type="text"
                  value={appointment.patient_name}
                  readOnly
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm">Ngày - Ca khám:</p>
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={appointment.work_date}
                  onChange={handleScheduleChange}
                >
                  <option value="">Chọn ngày khám</option>
                  {doctorSchedules.map((schedule) => (
                    <option key={schedule.work_date} value={schedule.work_date}>
                      {new Date(schedule.work_date).toLocaleDateString()} - {schedule.work_shift === "morning" ? "Sáng" : "Chiều"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-bold text-sm">Trạng thái:</p>
                <input
                  className="border rounded px-2 py-1 text-sm"
                  type="text"
                  value={
                    appointment.status === "canceled"
                      ? "Đã huỷ"
                      : appointment.status === "confirmed"
                        ? "Đã xác nhận"
                        : appointment.status === "pending"
                          ? "Đang chờ xác nhận"
                          : "Đã xác nhận"
                  }
                  readOnly
                />
              </div>
              <div className="w-full lg:flex-1 flex flex-col gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <p className="font-bold">Ngày - Ca khám:</p>
                  <select
                    className="border rounded px-3 py-2"
                    value={appointment.work_date || ""}
                    onChange={handleScheduleChange}
                  >
                    <option value="">Chọn ngày khám</option>
                    {doctorSchedules.map((schedule) => (
                      <option key={schedule.work_date} value={schedule.work_date}>
                        {new Date(schedule.work_date).toLocaleDateString()} -{" "}
                        {schedule.work_shift === "morning" ? "Sáng" : "Chiều"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleUpdateAppointment}
                    className={`bg-blue-500 px-6 py-2 text-white rounded-full hover:bg-blue-600 ${isLoadingUpdate ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={isLoadingUpdate}
                  >
                    {isLoadingUpdate ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      "Cập nhật"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelHandler}
                    className="bg-gray-300 px-6 py-2 text-black rounded-full hover:bg-gray-400"
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                type="button"
                onClick={handleUpdateAppointment}
                className={`bg-blue-500 px-10 py-3 text-white rounded-full hover:bg-blue-600 ${isLoadingUpdate ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                disabled={
                  isLoadingUpdate ||
                  !appointment.work_date ||
                  !appointment.work_shift
                } // Vô hiệu hóa nút nếu không có lịch làm việc
              >
                {isLoadingUpdate ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
                  </div>
                ) : (
                  "Cập nhật"
                )}
              </button>

              <button
                type="button"
                onClick={onCancelHandler}
                className="bg-gray-300 px-10 py-3 text-black rounded-full hover:bg-gray-400"
              >
                Quay lại
              </button>
            </div>
          </div >
        </form>
      </div >
    </div>
  );
};

export default AppointmentDetails;
