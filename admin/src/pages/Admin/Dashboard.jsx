import axios from 'axios'; // Nhập axios
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import React, { useContext, useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";

const VITE_BACKEND_URI = import.meta.env.VITE_BACKEND_URI;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const {
    aToken,
    getDashData,
    getAllPatients,
    getAllDoctors,
    getUpcomingApointmentsDashData,
    countAppointments,
    countPatient,
    dashUpApData,
    doctors,
  } = useContext(AdminContext);

  const [revenueData, setRevenueData] = useState([
    { month: "Tháng 1", revenue: 0 },
    { month: "Tháng 2", revenue: 0 },
    { month: "Tháng 3", revenue: 0 },
    { month: "Tháng 4", revenue: 0 },
    { month: "Tháng 5", revenue: 0 },
    { month: "Tháng 6", revenue: 0 },
    { month: "Tháng 7", revenue: 0 },
    { month: "Tháng 8", revenue: 0 },
    { month: "Tháng 9", revenue: 0 },
    { month: "Tháng 10", revenue: 0 },
    { month: "Tháng 11", revenue: 0 },
    { month: "Tháng 12", revenue: 0 },
  ]);

  // Sử dụng useEffect để gọi API và lấy dữ liệu doanh thu
  useEffect(() => {
    const fetchRevenueData = async () => {
      if (aToken) {
        try {
          const response = await axios.get(`${VITE_BACKEND_URI}/get-money-dashboard-admin`, {
            headers: {
              Authorization: `Bearer ${aToken}`,
            },
          });
          const data = response.data; // Lấy dữ liệu từ response

          // Cập nhật doanh thu vào tháng tương ứng
          const updatedRevenueData = revenueData.map((item) => {
            const revenueItem = data.find((d) => d.month === item.month);
            return {
              ...item,
              revenue: revenueItem ? revenueItem.revenue : 0,
            };
          });

          setRevenueData(updatedRevenueData);
        } catch (error) {
          console.error("Error fetching revenue data:", error);
        }
      }
    };

    fetchRevenueData();
    getDashData();
    getAllPatients();
    getAllDoctors();
    getUpcomingApointmentsDashData();
  }, [aToken]);

  // Cấu hình biểu đồ
  const chartData = {
    labels: revenueData.map((item) => item.month),
    datasets: [
      {
        label: "Doanh thu (VND)",
        data: revenueData.map((item) => item.revenue),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "#4B5563",
          font: {
            size: 10,
            weight: "bold",
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#1F2937",
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 12,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#4B5563",
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: "#E5E7EB",
          borderDash: [5, 5],
        },
        ticks: {
          color: "#4B5563",
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div className="m-5 w-full overflow-x-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Hiển thị số lượng bác sĩ */}
        <div className="relative flex-1 min-w-0 bg-[#4fc2f7] p-4 rounded border-2 cursor-pointer hover:scale-105 transition-all flex items-center justify-center shadow-lg overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white opacity-50 rounded-full z-10"></div>
          <div className="absolute top-[60px] right-[-40px] w-16 h-16 bg-white opacity-30 rounded-full z-10"></div>

          <div className="text-center relative z-20">
            <img className="w-14 mx-auto" src={assets.doctor_icon} alt="" />
            <p className="text-xl font-semibold text-white">{doctors.length}</p>
            <p className="text-white text-xl font-semibold">Bác sĩ</p>
          </div>
        </div>

        {/* Hiển thị số lượng lịch hẹn */}
        <div className="relative flex-1 min-w-0 bg-[#32db9d] p-4 rounded border-2 cursor-pointer hover:scale-105 transition-all flex items-center justify-center shadow-lg overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white opacity-50 rounded-full z-10"></div>
          <div className="absolute top-[60px] right-[-40px] w-16 h-16 bg-white opacity-30 rounded-full z-10"></div>

          <div className="text-center relative z-20">
            <img className="w-14 mx-auto" src={assets.appointments_icon3} alt="" />
            <p className="text-xl font-semibold text-white">{countAppointments.length}</p>
            <p className="text-white text-xl font-semibold">Lịch hẹn hoàn thành</p>
          </div>
        </div>

        {/* Hiển thị số lượng bệnh nhân */}
        <div className="relative flex-1 min-w-0 bg-[#ff8a66] p-4 rounded border-2 cursor-pointer hover:scale-105 transition-all flex items-center justify-center shadow-lg overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white opacity-50 rounded-full z-10"></div>
          <div className="absolute top-[60px] right-[-40px] w-16 h-16 bg-white opacity-30 rounded-full z-10"></div>

          <div className="text-center relative z-20">
            <img className="w-14 mx-auto" src={assets.patients_icon} alt="" />
            <p className="text-xl font-semibold text-white">{countPatient.length}</p>
            <p className="text-white text-xl font-semibold">Bệnh nhân đã khám</p>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-10 flex flex-wrap lg:flex-nowrap gap-3 mb-4">
        {/* Cột trái: Biểu đồ doanh thu */}
        <div className="flex-1 bg-white p-4 rounded-lg border-2 border-gray-100 cursor-pointer transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-center min-h-[350px]">
            <Bar data={chartData} options={options} />
          </div>
          <div className="mt-4 text-center text-gray-600">
            <p className="text-sm font-bold">Biểu đồ thể hiện doanh thu hàng tháng trong năm.</p>
          </div>
        </div>

        {/* Cột phải: Hiển thị lịch hẹn sắp tới */}
        <div className="w-full lg:w-1/2 bg-white rounded-lg border-2 border-gray-100 shadow-lg">
          {/* Tiêu đề */}
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-100 rounded-t">
            <img src={assets.list_icon} alt="icon" className="w-6 h-6" />
            <p className="font-semibold text-gray-800 text-lg">Lịch hẹn sắp tới</p>
          </div>
          {/* Nội dung */}
          <div className="overflow-x-auto">
            {/* Giao diện desktop */}
            <div className="hidden sm:block">
              <div className="max-h-[420px] overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full bg-white rounded-lg shadow-md">
                  {/* Header */}
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4 text-center text-gray-700 font-semibold">#</th>
                      <th className="py-3 px-4 text-center text-gray-700 font-semibold">Bệnh nhân</th>
                      <th className="py-3 px-4 text-center text-gray-700 font-semibold">Bác sĩ</th>
                      <th className="py-3 px-4 text-center text-gray-700 font-semibold">Ca làm việc</th>
                      <th className="py-3 px-4 text-center text-gray-700 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>

                  {/* Nội dung */}
                  <tbody>
                    {dashUpApData &&
                      dashUpApData.map((item, index) => (
                        <tr key={index} className={`hover:bg-gray-50 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                          {/* Số thứ tự */}
                          <td className="font-bold text-sm py-4 text-center">{index + 1}</td>

                          {/* Bệnh nhân */}
                          <td className="py-4 px-4 text-center">
                            <p className="font-medium text-gray-800">
                              {item.patient_id ? item.patient_id.user_id.name : "Không có tên"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Ngày khám: {new Date(item.work_date).toLocaleDateString("vi-VN")}
                            </p>
                          </td>

                          {/* Bác sĩ */}
                          <td className="py-4 px-4 text-center">
                            <p className="font-medium text-gray-800">
                              {item.doctor_id ? item.doctor_id.user_id.name : "Không có tên"}
                            </p>
                          </td>

                          {/* Ca làm việc */}
                          <td className="py-4 px-5 text-center">
                            <p className={`py-1 px-4 rounded-full text-white text-base font-semibold ${item.work_shift === "afternoon" ? "bg-orange-400" : "bg-blue-400"} shadow-md`}>
                              {item.work_shift === "morning" ? "Sáng" : "Chiều"}
                            </p>
                          </td>

                          {/* Trạng thái */}
                          <td className="py-4 px-4 text-center">
                            <button className={`py-1 px-4 rounded-full text-sm font-medium text-white shadow-md w-[120px] h-[32px] ${item.status === "confirmed" ? "bg-green-500" : "bg-red-500"}`}>
                              {item.status === "confirmed" ? "Đã xác nhận" : "Chưa xác nhận"}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Giao diện mobile */}
            <div className="sm:hidden">
              <div className="max-h-[320px] overflow-y-auto border border-gray-200 rounded-lg"> {/* Thêm border và rounded */}
                {dashUpApData &&
                  dashUpApData.map((item, index) => (
                    <div key={index} className={`border-b py-3 px-3 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                      {/* Số thứ tự */}
                      <div className="text-center text-sm font-bold mb-2">
                        <p>{index + 1}</p>
                      </div>

                      {/* Bệnh nhân */}
                      <div className="text-base font-semibold mb-2">
                        <span className="font-semibold">Bệnh nhân: </span>{item.patient_id ? item.patient_id.user_id.name : "Không có tên"}
                      </div>

                      {/* Ngày khám */}
                      <div className="text-sm font-semibold text-gray-700 mb-2">
                        <span className="font-semibold">Ngày khám: </span>
                        {new Date(item.work_date).toLocaleDateString("vi-VN")}
                      </div>

                      {/* Ca làm việc */}
                      <div className="text-sm font-semibold text-gray-700 mb-2">
                        <span className="font-semibold">Ca khám: </span>
                        {item.work_shift === "morning" ? "Sáng" : "Chiều"}
                      </div>

                      {/* Trạng thái */}
                      <div className="text-sm font-semibold text-gray-700">
                        <span className="font-semibold">Trạng thái: </span>
                        {item.status === "confirmed" ? (
                          <span className="bg-green-500 text-white py-1 px-2 rounded-full">Đã xác nhận</span>
                        ) : (
                          <span className="bg-red-500 text-white py-1 px-2 rounded-full">Chưa xác nhận</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;