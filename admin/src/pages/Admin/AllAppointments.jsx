import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../../context/AdminContext";
import "../../index.css";
import { toast } from "react-toastify";

const VITE_BACKEND_URI = import.meta.env.VITE_BACKEND_URI;

const AllAppointments = () => {
  const { aToken, appointments, getAllAppointments } = useContext(AdminContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // Thêm state loading cho việc xoá

  const totalPages = Math.ceil(appointments.length / appointmentsPerPage);
  const navigate = useNavigate();

  useEffect(() => {
    if (aToken) {
      setIsLoading(true);
      getAllAppointments().finally(() => setIsLoading(false));
    }
  }, [aToken]);

  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", options);
  };

  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = appointments.slice(
    indexOfFirstAppointment,
    indexOfLastAppointment
  );

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    navigate(`/all-appointments?page=${pageNumber}`);
  };

  const handleDeleteAppointment = (id, patientId) => {
    toast.dismiss();
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-2 font-bold text-lg text-center">
            Bạn có chắc chắn muốn xoá cuộc hẹn này không?
          </p>
          <div className="flex justify-end gap-4">
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-700"
              onClick={async () => {
                setIsDeleting(true); // Bắt đầu quá trình xoá
                try {
                  const response = await axios.delete(
                    `${VITE_BACKEND_URI}/appointment/delete/${id}`,
                    {
                      data: { user_id: patientId },
                    }
                  );

                  if (response.data.success) {
                    toast.success("Xoá cuộc hẹn thành công!", {
                      position: "top-right",
                    });
                    getAllAppointments(); // Cập nhật lại danh sách cuộc hẹn
                    closeToast();
                  } else {
                    toast.error("Xoá cuộc hẹn thất bại!", {
                      position: "top-right",
                    });
                  }
                } catch (error) {
                  toast.error("Đã xảy ra lỗi khi xoá cuộc hẹn!", {
                    position: "top-right",
                  });
                } finally {
                  setIsDeleting(false); // Kết thúc quá trình xoá
                  closeToast();
                }
              }}
            >
              Xác nhận
            </button>
            <button
              className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              onClick={closeToast}
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: true,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  // Hàm render phân trang
  const renderPagination = () => {
    const paginationItems = [];

    paginationItems.push(
      <button
        key="prev"
        onClick={() => paginate(Math.max(1, currentPage - 1))}
        className={`py-1 px-3 border rounded ${
          currentPage === 1
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "text-gray-600"
        }`}
        disabled={currentPage === 1}
      >
        Trước
      </button>
    );

    paginationItems.push(
      <button
        key={1}
        onClick={() => paginate(1)}
        className={`py-1 px-3 border rounded ${
          currentPage === 1 ? "bg-indigo-500 text-white" : "text-gray-600"
        }`}
      >
        1
      </button>
    );

    if (currentPage > 2) {
      paginationItems.push(
        <span key="start-dots" className="px-2">
          ...
        </span>
      );
    }

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      paginationItems.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`py-1 px-3 border rounded ${
            i === currentPage ? "bg-indigo-500 text-white" : "text-gray-600"
          }`}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages - 1) {
      paginationItems.push(
        <span key="end-dots" className="px-2">
          ...
        </span>
      );
    }

    if (totalPages > 1) {
      paginationItems.push(
        <button
          key={totalPages}
          onClick={() => paginate(totalPages)}
          className={`py-1 px-3 border rounded ${
            currentPage === totalPages
              ? "bg-indigo-500 text-white"
              : "text-gray-600"
          }`}
        >
          {totalPages}
        </button>
      );
    }

    paginationItems.push(
      <button
        key="next"
        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
        className={`py-1 px-3 border rounded ${
          currentPage === totalPages
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "text-gray-600"
        }`}
        disabled={currentPage === totalPages}
      >
        Tiếp
      </button>
    );

    return (
      <div className="flex justify-center gap-4 mt-4">{paginationItems}</div>
    );
  };

  return (
    <div className="w-full max-w-6xl m-4">
      {isDeleting && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="animate-spin border-t-4 border-blue-600 border-solid rounded-full w-16 h-16" />
        </div>
      )}
      <p className="mb-3 text-lg font-medium">Tất cả các cuộc hẹn</p>
      <div className="bg-white border rounded-2xl text-sm max-h-[90vh] min-h-[60vh] overflow-y-scroll">
        {/* Table header */}
        <div className="grid grid-cols-[0.5fr_1fr_1fr_1fr_1fr_1fr_0.5fr] bg-gray-200 py-3 px-6 border-b gap-4 header">
          <p className="font-bold text-[16px] text-center">#</p>
          <p className="font-bold text-[16px] text-center">Bác sĩ</p>
          <p className="font-bold text-[16px] text-center">Bệnh nhân</p>
          <p className="font-bold text-[16px] text-center">Ngày</p>
          <p className="font-bold text-[16px] text-center">Ca</p>
          <p className="font-bold text-[16px] text-center">Trạng thái</p>
          <p className="font-bold text-[16px] text-center">Hành động</p>
        </div>

        {/* Appointments */}
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : currentAppointments && currentAppointments.length > 0 ? (
          currentAppointments.map((item, index) => (
            <div
              className="grid grid-cols-[0.5fr_1fr_1fr_1fr_1fr_1fr_0.5fr] text-gray-500 py-3 px-6 border-b hover:bg-gray-50 gap-4"
              key={index}
            >
              <p className="font-bold text-center">{index + 1}</p>
              <div className="flex md:justify-center gap-2 mb-2">
                <span className="sm:hidden font-semibold">Bác sĩ: </span>
                <p className="md:mb-0 text-gray-600 md:text-base">
                  {item.doctorInfo.name}
                </p>
              </div>

              <div className="flex items-center mb-2 md:mb-0 justify-start md:justify-center gap-2">
                <span className="sm:hidden font-semibold">Bệnh nhân:</span>
                <p className="text-gray-700 md:text-base truncate md:whitespace-normal md:w-auto">
                  {item.patientInfo.name}
                </p>
              </div>

              <div className="flex items-center mb-2 md:mb-0 justify-start md:justify-center gap-2">
                <span className="sm:hidden font-semibold">Ngày: </span>
                {formatDate(item.work_date)}
              </div>

              <div className="flex items-center mb-2 md:mb-0 justify-start md:justify-center gap-2 -mt-0.5">
                <span className="sm:hidden font-semibold">Ca: </span>
                <span
                  className={`py-1 px-2 rounded-full text-white text-sm text-center font-semibold
                  ${
                    item.work_shift === "afternoon"
                      ? "bg-orange-300"
                      : "bg-blue-400"
                  }
                  shadow-lg max-w-[100px] w-full h-[28px]`}
                >
                  {item.work_shift === "morning" ? "Sáng" : "Chiều"}
                </span>
              </div>

              {/* Appointment Status Button */}
              <div className="flex justify-center items-center">
                {item.status === "canceled" ? (
                  <button className="bg-red-500 text-white text-xs font-semibold py-1 px-2 rounded-full shadow-lg transition-all duration-300 w-[140px] h-[28px] text-center">
                    Đã hủy
                  </button>
                ) : item.status === "confirmed" ? (
                  <button className="bg-green-500 text-white text-xs font-semibold py-1 px-2 rounded-full shadow-lg transition-all duration-300 w-[140px] h-[28px] text-center">
                    Đã xác nhận
                  </button>
                ) : item.status === "pending" ? (
                  <button className="bg-yellow-500 text-white text-xs font-semibold py-1 px-2 rounded-full shadow-lg transition-all duration-300 w-[140px] h-[28px] text-center">
                    Chờ xác nhận
                  </button>
                ) : (
                  <button className="bg-blue-500 text-white text-xs font-semibold py-1 px-2 rounded-full shadow-lg transition-all duration-300 w-[140px] h-[28px] text-center">
                    Đã hoàn thành
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center items-center gap-2">
                {item.status === "pending" || item.status === "confirmed" ? (
                  <button
                    onClick={() => navigate(`/edit-appointment/${item._id}`)}
                    className="bg-blue-500 text-white py-1 px-3 rounded text-sm"
                  >
                    <i className="fa-regular fa-pen-to-square"></i>
                  </button>
                ) : (
                  <button
                    className="bg-gray-300 text-gray-600 py-1 px-3 rounded text-sm cursor-not-allowed"
                    disabled
                  >
                    <i className="fa-regular fa-pen-to-square"></i>
                  </button>
                )}

                <button
                  onClick={() =>
                    handleDeleteAppointment(item._id, item.patientInfo._id)
                  }
                  className="bg-red-500 text-white py-1 px-3 rounded text-sm"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex justify-center py-4">Không có cuộc hẹn nào.</div>
        )}
      </div>
      {renderPagination()}
    </div>
  );
};

export default AllAppointments;
