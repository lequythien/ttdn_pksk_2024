import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";

const Doctors = () => {
  const { speciality } = useParams();
  const [filterDoc, setFilterDoc] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorsPerPage] = useState(8);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchDoctors = async () => {
    try {
      const response = await axios.get("http://localhost:5000/doctor/find-all");
      setDoctors(response.data.success ? response.data.doctors : []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const response = await axios.get("http://localhost:5000/specialization/find-all");
      setSpecializations(response.data.success ? response.data.specializations : []);
    } catch (error) {
      console.error("Error fetching specializations:", error);
    }
  };

  const applyFilter = () => {
    const filtered = speciality
      ? doctors.filter((doc) => doc.specialization_id?.name === speciality)
      : doctors;
    setFilterDoc(filtered);
  };

  useEffect(() => {
    fetchDoctors();
    fetchSpecializations();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [doctors, speciality]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setCurrentPage(Number(queryParams.get("page")) || 1);
  }, [location]);

  const totalDoctors = filterDoc.length;
  const totalPages = Math.ceil(totalDoctors / doctorsPerPage);
  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = filterDoc.slice(indexOfFirstDoctor, indexOfLastDoctor);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const queryParams = new URLSearchParams(location.search);
    queryParams.set("page", page);
    navigate(`/doctors${speciality ? `/${speciality}` : ""}?${queryParams.toString()}`, { replace: true });
  };

  const renderPagination = () => {
    const paginationItems = [];
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        paginationItems.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`py-1 px-3 border rounded ${i === currentPage ? "bg-indigo-500 text-white" : "text-gray-600"}`}
          >
            {i}
          </button>
        );
      } else if (
        (i === currentPage - delta - 1 && currentPage > delta + 2) ||
        (i === currentPage + delta + 1 && currentPage < totalPages - delta - 1)
      ) {
        paginationItems.push(<span key={i} className="px-2">...</span>);
      }
    }

    return (
      <div className="flex justify-center items-center mt-6 space-x-2">
        {paginationItems}
      </div>
    );
  };

  return (
    <div>
      <p className="text-gray-600">Duyệt qua các bác sĩ chuyên khoa.</p>
      <div className="flex flex-col sm:flex-row items-start gap-5 mt-5">
        <button
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showFilter ? "bg-primary text-white" : ""}`}
          onClick={() => setShowFilter((prev) => !prev)}
        >
          Filters
        </button>
        <div className={`flex-col gap-4 text-[18px] text-gray-600 ${showFilter ? "flex" : "hidden sm:flex"}`}>
          {specializations.map((spec) => (
            <div
              key={spec._id}
              onClick={() => speciality === spec.name ? navigate("/doctors") : navigate(`/doctors/${spec.name}`)}
              className={`w-[263px] h-[49px] pl-3 pr-16 border border-gray-300 rounded transition-all cursor-pointer flex items-center ${speciality === spec.name ? "bg-indigo-100 text-black" : ""}`}
            >
              <p className="m-0">{spec.name}</p>
            </div>
          ))}
        </div>
        <div className="w-full grid grid-cols-4 gap-4 gap-y-6">
          {currentDoctors.map((item, index) => (
            <div
              onClick={() => navigate(`/appointment/${item._id}`)}
              className="border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500"
              key={index}
            >
              <img className="bg-blue-50" src={item.user_id.image} alt="" />
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-center text-[#00759c]">
                  <p className="w-2 h-2 bg-[#00759c] rounded-full"></p>
                  <p>Đặt lịch</p>
                </div>
                <p className="text-gray-900 text-lg font-medium">{item.user_id.name}</p>
                <p className="text-gray-600 text-sm">{item.specialization_id ? item.specialization_id.name : "Chưa có chuyên khoa"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {totalPages > 1 && renderPagination()}
    </div>
  );
};

export default Doctors;
