import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";

const DoctorWorkSchedule = () => {
  const { dToken, schedules, getDoctorSchedule, deleteSchedule, addSchedule } = useContext(DoctorContext);
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [schedulesPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showPastSchedules, setShowPastSchedules] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const doctorInfo = sessionStorage.getItem("doctorInfo");
    const doctorId = doctorInfo ? JSON.parse(doctorInfo).id : null;

    if (dToken && doctorId) {
      refreshSchedules(); // Gọi hàm để lấy lịch làm việc
    }
  }, [dToken]);

  const refreshSchedules = async () => {
    const doctorInfo = sessionStorage.getItem("doctorInfo");
    const doctorId = doctorInfo ? JSON.parse(doctorInfo).id : null;
    if (doctorId) {
      setLoading(true);
      try {
        await getDoctorSchedule(doctorId); // Gọi lại lịch làm việc
      } catch (error) {
        console.error("Lỗi khi lấy lịch làm việc:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddSchedule = async (newSchedule) => {
    try {
      await addSchedule(newSchedule); // Thêm lịch mới
      await refreshSchedules(); // Gọi lại để cập nhật lịch làm việc
    } catch (error) {
      console.error("Lỗi khi thêm lịch:", error);
    }
  };

  const formatDate = (date) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(date).toLocaleDateString("vi-VN", options);
  };

  const handleDeleteClick = (schedule) => {
    setSelectedSchedule(schedule);
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedSchedule) {
      try {
        await deleteSchedule(selectedSchedule._id); // Xóa lịch
        setShowModal(false);
        setSelectedSchedule(null);
        await refreshSchedules(); // Gọi lại để cập nhật lịch làm việc
      } catch (error) {
        console.error("Lỗi khi xóa lịch:", error);
      }
    }
  };

  useEffect(() => {
    setShowModal(false);
    setSelectedSchedule(null);
  }, [schedules]);

  // Hàm kiểm tra lịch đã qua
  const isPastSchedule = (workDate) => {
    const today = new Date();
    return new Date(workDate) < today.setHours(0, 0, 0, 0);
  };

  // Lọc lịch làm việc
  const filteredSchedules = schedules.filter((schedule) => {
    const workDate = new Date(schedule.work_date);
    return showPastSchedules || !isPastSchedule(schedule.work_date);
  });

  // Logic phân trang
  const totalSchedules = filteredSchedules.length;
  const totalPages = Math.ceil(totalSchedules / schedulesPerPage);
  const indexOfLastSchedule = currentPage * schedulesPerPage;
  const indexOfFirstSchedule = indexOfLastSchedule - schedulesPerPage;
  const currentSchedules = filteredSchedules.slice(
    indexOfFirstSchedule,
    indexOfLastSchedule
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    navigate(`/doctor-work-schedule?page=${page}`, { replace: true });
  };

  const renderPagination = () => {
    const delta = 1;
    const paginationItems = [];

    // Nút "Trang trước"
    paginationItems.push(
      <button
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        className={`py-1 px-3 border rounded w-[70px] flex items-center justify-center ${currentPage === 1
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "text-gray-600"
          }`}
        disabled={currentPage === 1}
      >
        <span className="hidden md:block">Trước</span>
        <i className="fa-solid fa-angle-left block md:hidden"></i>
      </button>
    );

    // Hiển thị trang 1
    paginationItems.push(
      <button
        key={1}
        onClick={() => handlePageChange(1)}
        className={`py-1 px-3 border rounded ${currentPage === 1 ? "bg-indigo-500 text-white" : "text-gray-600"
          }`}
      >
        1
      </button>
    );

    // Hiển thị dấu ba chấm nếu cần
    if (currentPage > 2) {
      paginationItems.push(
        <span key="start-dots" className="px-2">
          ...
        </span>
      );
    }

    // Hiển thị các trang xung quanh trang hiện tại
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      paginationItems.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`py-1 px-3 border rounded ${i === currentPage ? "bg-indigo-500 text-white" : "text-gray-600"
            }`}
        >
          {i}
        </button>
      );
    }

    // Hiển thị dấu ba chấm nếu cần
    if (currentPage < totalPages - 1) {
      paginationItems.push(
        <span key="end-dots" className="px-2">
          ...
        </span>
      );
    }

    // Hiển thị trang cuối
    if (totalPages > 1) {
      paginationItems.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`py-1 px-3 border rounded ${currentPage === totalPages
            ? "bg-indigo-500 text-white"
            : "text-gray-600"
            }`}
        >
          {totalPages}
        </button>
      );
    }

    // Nút "Trang tiếp theo"
    paginationItems.push(
      <button
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        className={`py-1 px-3 border rounded w-[70px] flex items-center justify-center ${currentPage === totalPages
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "text-gray-600"
          }`}
        disabled={currentPage === totalPages}
      >
        <span className="hidden md:block">Tiếp</span>
        <i className="fa-solid fa-angle-right block md:hidden"></i>
      </button>
    );

    return (
      <div className="flex justify-center items-center mt-6 space-x-2">
        {paginationItems}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 overflow-x-hidden">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xl md:text-3xl font-bold text-[#0091a1]">
          Tất Cả Lịch Làm Việc
        </p>

        {/* Nút để hiện/ẩn lịch đã qua */}
        <div className="flex items-center space-x-2 gap-4">
          <button
            onClick={() => setShowPastSchedules(!showPastSchedules)}
            className="text-blue-500 font-medium text-zinc-400 text-sm"
          >
            {showPastSchedules ? "Ẩn lịch đã qua" : "Hiện lịch đã qua"}
          </button>

          <button
            onClick={() => navigate("/doctor-create-schedule")}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-[#4CAF50] to-[#219B9D] text-white rounded-full shadow-md hover:from-[#45A049] hover:to-[#009688] transform hover:scale-110 transition-all duration-300"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-xl text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll">
        {/* Header chỉ hiển thị trên desktop */}
        <div className="hidden sm:grid grid-cols-[0.5fr_2fr_1fr_1fr] gap-4 py-4 px-6 bg-gray-200 border-b text-center">
          <p className="font-bold text-center text-[16px]">#</p>
          <p className="font-bold text-center text-[16px]">Ngày làm việc</p>
          <p className="font-bold text-center text-[16px]">Ca làm việc</p>
          <p className="font-bold text-center text-[16px]">Hành động</p>
        </div>



        {loading ? ( // Hiển thị spinner khi đang tải
          <div className="flex justify-center items-center py-6">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-solid rounded-full border-[#219c9e] border-t-transparent" role="status">
            </div>
          </div>
        ) : currentSchedules && currentSchedules.length > 0
          ? currentSchedules.map((schedule, index) => (
            <div
              key={schedule._id}
              className="flex flex-col sm:grid sm:grid-cols-[0.5fr_2fr_1fr_1fr] gap-3 py-3 px-5 border-b hover:bg-gray-50"
            >
              <p className="md:text-center text-center font-bold">
                {(currentPage - 1) * schedulesPerPage + index + 1}
              </p>
              <div className="flex md:justify-center items-center cursor-pointer">
                <span className="sm:hidden font-semibold mr-2">
                  Ngày làm việc:{" "}
                </span>
                <td
                  className="text-center font-medium md:border-none border-b text-[16px] hover:text-blue-400 cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/confirm-completed-appointments?date=${schedule.work_date.split("T")[0]
                      }&work-shift=${schedule.work_shift}`
                    )
                  }
                >
                  {formatDate(schedule.work_date)}
                </td>
              </div>
              <div className="flex sm:items-center sm:justify-center gap-2">
                <span className="sm:hidden font-semibold mr-2">
                  Ca làm việc:{" "}
                </span>
                <p
                  className={`py-0 md:py-1 rounded-full text-white text-sm text-center ${schedule.work_shift === "afternoon"
                    ? "bg-orange-300"
                    : "bg-blue-300"
                    } shadow-lg max-w-[100px] w-full`}
                >
                  {schedule.work_shift === "afternoon" ? "Chiều" : "Sáng"}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() =>
                    navigate(`/edit-work-schedule/${schedule._id}`)
                  }
                  className="bg-blue-500 text-white px-3 py-1 rounded shadow-md hover:bg-blue-600"
                >
                  <i className="fa-solid fa-user-pen"></i>
                </button>
                <button
                  onClick={() => handleDeleteClick(schedule)}
                  className="bg-red-500 text-white px-3 py-1 rounded shadow-md hover:bg-red-600"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))
          : !loading && (
            <p className="text-gray-500 text-center py-3">
              Không tìm thấy lịch làm việc nào.
            </p>
          )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && renderPagination()}

      {/* Modal xác nhận xóa */}
      {showModal && selectedSchedule && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-4 w-96 mx-auto">
            <h2 className="text-lg font-bold">Xác nhận xóa</h2>
            <p>Bạn có chắc chắn muốn xóa lịch này không?</p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="mr-2 px-4 py-2 bg-gray-300 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorWorkSchedule;