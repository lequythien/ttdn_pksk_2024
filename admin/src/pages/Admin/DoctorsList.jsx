import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AdminContext } from "../../context/AdminContext";
import { convertToSlug } from "../../utils/stringUtils";

const VITE_BACKEND_URI = import.meta.env.VITE_BACKEND_URI;

const DoctorsList = () => {
  const { doctors, aToken, getAllDoctors } = useContext(AdminContext);
  const [confirmToastId, setConfirmToastId] = useState(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [specializations, setSpecializations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpecializationsLoading, setIsSpecializationsLoading] =
    useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const doctorsPerPage = 8;

  const navigate = useNavigate();
  const location = useLocation();

  const DoctorCardSkeleton = () => {
    return (
      <div className="border border-indigo-200 rounded-xl overflow-hidden">
        {/* Image placeholder */}
        <div className="relative">
          <div className="h-48 bg-gray-200 animate-pulse" />
          <div className="absolute top-2 left-2 bg-gray-200 animate-pulse h-6 w-24 rounded-full" />
        </div>

        {/* Content placeholder */}
        <div className="p-4 space-y-3">
          <div className="h-7 bg-gray-200 animate-pulse rounded w-[383px]" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3" />
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-4 bg-gray-200 animate-pulse rounded w-16" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const page = queryParams.get("page");
    if (page) {
      setCurrentPage(Number(page));
    }
    if (aToken) {
      setIsLoading(true);
      Promise.all([getAllDoctors(), fetchSpecializations()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [aToken, location.search]);

  const fetchSpecializations = async () => {
    setIsSpecializationsLoading(true);
    try {
      const response = await axios.get(
        `${VITE_BACKEND_URI}/specialization/find-all`
      );
      if (
        response.data.success &&
        Array.isArray(response.data.specializations)
      ) {
        setSpecializations(response.data.specializations);
      } else {
        toast.error("Dữ liệu chuyên khoa không hợp lệ.");
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi lấy danh sách chuyên khoa.");
    } finally {
      setIsSpecializationsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      toast.dismiss(); // Đóng thông báo khi component bị hủy (trang đóng)
    };
  }, []);

  const deleteDoctor = async (id, name) => {
    if (confirmToastId) {
      toast.dismiss(confirmToastId);
    }

    const newToastId = toast(
      <div>
        <p className="mb-2 font-bold text-lg text-center">
          Bạn có chắc chắn muốn xóa bác sĩ{" "}
          <strong className="text-red-600">{name}</strong> này không?
        </p>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => {
              setIsDeleting(true); // Bắt đầu quá trình xóa
              confirmDeleteDoctor(id);
              toast.dismiss(newToastId);
            }}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Xác nhận
          </button>
          <button
            onClick={() => toast.dismiss(newToastId)}
            className="bg-gray-300 text-gray-800 px-3 py-1 rounded"
          >
            Hủy bỏ
          </button>
        </div>
      </div>,
      {
        autoClose: true,
        closeOnClick: false,
        position: "top-center",
        className: "custom-toast",
      }
    );

    setConfirmToastId(newToastId);
  };

  const confirmDeleteDoctor = async (id) => {
    try {
      const response = await axios.delete(
        `${VITE_BACKEND_URI}/doctor/delete/${id}`,
        {
          headers: {
            Authorization: `Bearer ${aToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(`Đã xóa bác sĩ thành công!`);
        getAllDoctors();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi xóa bác sĩ.");
    } finally {
      setIsDeleting(false); // Kết thúc quá trình xóa
    }
  };

  // Pagination logic
  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;

  // Lọc danh sách bác sĩ theo chuyên khoa đã chọn
  const filteredDoctors = selectedSpecialization
    ? doctors.filter(
        (doctor) => doctor.specialization_id.name === selectedSpecialization
      )
    : doctors;

  const currentDoctors = filteredDoctors.slice(
    indexOfFirstDoctor,
    indexOfLastDoctor
  );
  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    navigate(
      `/doctor-list${
        selectedSpecialization
          ? `/${convertToSlug(selectedSpecialization)}`
          : ""
      }?page=${pageNumber}`
    );
  };

  const formatPrice = (price) => {
    if (isNaN(price)) return price;
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Hàm render phân trang
  const renderPagination = () => {
    const paginationItems = [];

    // Nút "Trang trước"
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

    // Hiển thị trang 1
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

    // Nút "Trang tiếp theo"
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
    <div className="m-5 max-h-[90vh] overflow-y-scroll">
      {isDeleting && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="animate-spin border-t-4 border-blue-600 border-solid rounded-full w-16 h-16" />
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h1 className="md:text-3xl text-xl font-bold text-[#0091a1] text-center md:text-left mb-4 md:mb-0">
          Tất cả bác sĩ
        </h1>
        <div className="flex items-center shadow-lg w-full md:w-auto">
          <select
            value={selectedSpecialization}
            onChange={(e) => {
              const specializationSlug = convertToSlug(e.target.value);
              setSelectedSpecialization(e.target.value);
              navigate(`/doctor-list?specialization=${specializationSlug}`);
            }}
            className="px-5 py-3 rounded-lg bg-white text-gray-800 border border-gray-300 transition-all duration-300 shadow-non focus:outline-none hover:border-blue-400 w-full md:w-auto"
          >
            <option value="" className="text-gray-500">
              Chọn chuyên khoa
            </option>
            {Array.isArray(specializations) &&
              specializations.map((spec) => (
                <option
                  key={spec._id}
                  value={spec.name}
                  className="text-gray-700"
                >
                  {spec.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
        {isLoading
          ? [...Array(8)].map((_, index) => (
              <DoctorCardSkeleton key={`skeleton-${index}`} />
            ))
          : currentDoctors.map((item) => (
              <div
                className="border border-indigo-200 rounded-xl overflow-hidden cursor-pointer group relative"
                key={item.user_id._id}
              >
                <div className="relative">
                  <img
                    className="bg-indigo-50 group-hover:bg-primary transition-all duration-500"
                    src={item.user_id.image}
                    alt="Doctor"
                  />

                  <span className="absolute top-2 left-2 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded-full">
                    {item.specialization_id.name}
                  </span>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      className="bg-red-500 text-white p-2 rounded-full transition duration-200 ease-in-out hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                      onClick={() =>
                        deleteDoctor(item.user_id._id, item.user_id.name)
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 3h6m2 0a1 1 0 011 1v1H6V4a1 1 0 011-1h10zM4 7h16M10 11v6m4-6v6M5 7h14l-1.68 14.14A2 2 0 0115.33 23H8.67a2 2 0 01-1.99-1.86L5 7z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-neutral-800 text-lg font-medium">
                    Bs. {item.user_id.name}
                  </p>
                  <p className="text-zinc-600 text-sm">
                    SĐT: {item.user_id.phone}
                  </p>
                  <p className="text-zinc-600 text-sm truncate">
                    Email: {item.user_id.email}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-zinc-600 text-sm">
                      Giá: {item.price ? formatPrice(item.price) : "0"} VND
                    </p>
                    <p className="text-zinc-600 text-sm">
                      {item.available === true ? (
                        <div className="flex items-center gap-2 text-sm text-center text-[#00759c]">
                          <p className="w-2 h-2 bg-[#00759c] rounded-full"></p>
                          <p>Lịch hẹn</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-center text-[#9c0000]">
                          <p className="w-2 h-2 bg-[#9c0000] rounded-full"></p>
                          <p>Lịch hẹn</p>
                        </div>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Pagination Controls */}
      {filteredDoctors.length > doctorsPerPage && renderPagination()}
    </div>
  );
};

export default DoctorsList;
