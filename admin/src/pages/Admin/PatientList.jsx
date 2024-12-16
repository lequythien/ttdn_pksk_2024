import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AdminContext } from "../../context/AdminContext";

const VITE_BACKEND_URI = import.meta.env.VITE_BACKEND_URI;

const PatientList = () => {
  const { patient, getAllPatients } = useContext(AdminContext);
  const navigate = useNavigate();
  const location = useLocation(); // Lấy thông tin location
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(10);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Hiển thị thông báo thành công nếu có từ state
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage);
    }
  }, [location.state]);

  useEffect(() => {
    getAllPatients();
  }, [getAllPatients]);

  const totalPages = Math.ceil(patient.length / patientsPerPage);
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = patient.slice(
    indexOfFirstPatient,
    indexOfLastPatient
  );

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    navigate(`/patient-list?page=${pageNumber}`);
  };

  useEffect(() => {
    return () => {
      toast.dismiss(); // Đóng thông báo khi component bị hủy (trang đóng)
    };
  }, []);

  const deletePatient = async (id, name) => {
    toast.dismiss();
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-2 font-bold text-lg text-center">
            Bạn có chắc chắn muốn xóa bệnh nhân{" "}
            <span className="text-red-600">{name}</span> này không?
          </p>
          <div className="flex justify-end gap-4">
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-700"
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await axios.delete(
                    `${VITE_BACKEND_URI}/patient/delete/${id}`
                  );
                  toast.success(`Bệnh nhân ${name} đã được xóa thành công!`, {
                    position: "top-right",
                  });
                  getAllPatients();
                  closeToast();
                } catch (error) {
                  console.error("Lỗi khi xóa bệnh nhân:", error);
                  toast.error("Có lỗi xảy ra khi xóa bệnh nhân!", {
                    position: "top-right",
                  });
                } finally {
                  setIsDeleting(false);
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
          currentPage === 1 ? "bg-blue-600 text-white" : "text-gray-600"
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
            i === currentPage ? "bg-blue-600 text-white" : "text-gray-600"
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
              ? "bg-blue-600 text-white"
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
      <div className="flex justify-center gap-2 mt-4">{paginationItems}</div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      {isDeleting && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="animate-spin border-t-4 border-blue-600 border-solid rounded-full w-16 h-16" />
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <p className="text-2xl md:text-3xl font-bold text-[#0091a1]">
          Tất Cả Bệnh Nhân
        </p>
        <button
          onClick={() => navigate("/add-patient")}
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

      {/* Responsive Table */}
      <div className="mt-4 overflow-x-auto bg-white rounded-md shadow-md">
        <table className="min-w-full table-auto bg-white border-collapse hidden md:table">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 border-b text-left text-sm font-bold">
                #
              </th>
              <th className="py-2 px-4 border-b text-center text-sm font-bold">
                Tên Bệnh Nhân
              </th>
              <th className="py-2 px-4 border-b text-center text-sm font-bold">
                Email
              </th>
              <th className="py-2 px-4 border-b text-center text-sm font-bold">
                Số Điện Thoại
              </th>
              <th className="py-2 px-4 border-b text-left text-sm font-bold">
                Hành Động
              </th>
            </tr>
          </thead>
          <tbody>
            {currentPatients && currentPatients.length > 0 ? (
              currentPatients.map((patient, index) => (
                <tr key={patient._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b text-sm font-semibold">
                    {index + 1}
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {patient.user_id.name}
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {patient.user_id.email}
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {patient.user_id.phone}
                  </td>
                  <td className="py-2 px-4 border-b text-sm flex gap-2">
                    <svg
                      onClick={() => navigate(`/edit-patient/${patient._id}`)}
                      className="w-6 h-6 md:w-8 md:h-8 cursor-pointer text-blue-500 bg-blue-100 rounded-full p-1 md:p-2 transition-all shadow-lg"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M3.99 16.854l-1.314 3.504a.75.75 0 0 0 .966.965l3.503-1.314a3 3 0 0 0 1.068-.687L18.36 9.175s-.354-1.061-1.414-2.122c-1.06-1.06-2.122-1.414-2.122-1.414L4.677 15.786a3 3 0 0 0-.687 1.068zm12.249-12.63l1.383-1.383c.248-.248.579-.406.925-.348.487.08 1.232.322 1.934 1.025.703.703.945 1.447 1.025 1.934.058.346-.1.677-.348.925L19.774 7.76s-.353-1.06-1.414-2.12c-1.06-1.062-2.121-1.415-2.121-1.415z"
                        fill="#000000"
                      ></path>
                    </svg>

                    <svg
                      onClick={() =>
                        deletePatient(patient._id, patient.user_id.name)
                      }
                      className="w-6 h-6 md:w-8 md:h-8 cursor-pointer text-red-500 bg-red-100 rounded-full p-1 md:p-2 transition-all shadow-lg"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M5.755,20.283,4,8H20L18.245,20.283A2,2,0,0,1,16.265,22H7.735A2,2,0,0,1,5.755,20.283ZM21,4H16V3a1,1,0,0,0-1-1H9A1,1,0,0,0,8,3V4H3A1,1,0,0,0,3,6H21a1,1,0,0,0,0-2Z"
                        fill="#c42121"
                      ></path>
                    </svg>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="py-40 px-38 text-center text-gray-500 bg-white"
                >
                  Không có bệnh nhân nào
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mobile View: List Style */}
        <div className="block md:hidden">
          {currentPatients.map((patient, index) => (
            <div
              key={patient._id}
              className="bg-gray-50 p-4 mb-2 rounded-md shadow-md flex flex-col gap-2"
            >
              <p className="text-sm font-bold text-center text-gray-700">
                {index + 1}
              </p>

              <div className="text-left sm:text-center">
                <p className="text-base md:text-center font-medium md:font-normal">
                  <span className="md:hidden font-semibold">
                    Tên bệnh nhân:{" "}
                  </span>
                  {patient.user_id.name}
                </p>
              </div>

              <div className="text-left sm:text-center">
                <p className="text-sm md:text-center font-medium md:font-normal">
                  <span className="md:hidden font-semibold">Email: </span>
                  {patient.user_id.email}
                </p>
              </div>

              <div className="text-left sm:text-center">
                <p className="text-sm md:text-center font-medium md:font-normal">
                  <span className="md:hidden font-semibold">
                    Số điện thoại:{" "}
                  </span>
                  {patient.user_id.phone}
                </p>
              </div>

              <div className="flex justify-center gap-2 mt-2">
                <button
                  onClick={() => navigate(`/edit-patient/${patient._id}`)}
                  className="bg-blue-500 text-white py-1 px-3 rounded text-sm"
                >
                  Sửa
                  <i className="fa-solid fa-user-pen ml-2"></i>
                </button>
                <button
                  onClick={() =>
                    deletePatient(patient._id, patient.user_id.name)
                  }
                  className="bg-red-500 text-white py-1 px-3 rounded text-sm"
                >
                  Xóa
                  <i className="fa-solid fa-trash ml-2"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {patient.length > patientsPerPage && renderPagination()}
    </div>
  );
};

export default PatientList;
