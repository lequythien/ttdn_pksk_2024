import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";
import React, { memo, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const VITE_BACKEND_URI = import.meta.env.VITE_BACKEND_URI;

// Component hiển thị từng bản ghi lịch sử khám bệnh
const MedicalRecordCard = memo(({ record }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Đang chờ xác nhận";
      case "canceled":
        return "Đã huỷ";
      case "completed":
        return "Đã hoàn thành";
      default:
        return "Đã xác nhận";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow w-[280px]">
      <CardContent className="p-6">
        {/* Phần hiển thị hình ảnh bác sĩ */}
        <div className="flex justify-center mb-4">
          <img
            src={record.history.doctor_image}
            alt={record.history.doctor_name}
            className="w-50 h-60 shadow-lg"
          />
        </div>

        {/* Phần hiển thị thông tin bác sĩ */}
        <div className="flex flex-col items-center">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-blue-500 mr-2" />
            <span className="font-medium">Bs. {record.history.doctor_name}</span>
          </div>
          <Badge className={`${getStatusColor(record.history.status)} px-3 py-1 rounded-full text-sm font-medium mt-2`}>
            Trạng thái: {getStatusText(record.history.status)}
          </Badge>
          <div className="flex items-center mt-2 space-x-4 border-t">
            <div className="flex items-center mt-2">
              <Calendar className="w-5 h-5 text-gray-500 mr-2" />
              <span>{new Date(record.history.work_date).toLocaleDateString("vi-VN")}</span>
            </div>
            <div className="flex items-center mt-2">
              <Clock className="w-5 h-5 text-gray-500 mr-2" />
              <span>{record.history.work_shift === "morning" ? "Buổi sáng" : "Buổi chiều"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Component hiển thị spinner khi đang tải dữ liệu
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Component hiển thị thông báo lỗi
const ErrorAlert = ({ message }) => (
  <div className="container mx-auto px-4 py-8 flex justify-center items-center">
    <Alert variant="destructive">
      <AlertDescription className="text-center">{"Hiện tại bạn không có lịch sử lịch hẹn"}</AlertDescription>
    </Alert>
  </div>
);

// Component chính MedicalHistory
const MedicalHistory = () => {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isTokenValid = (token) => {
    if (!token) return false;
    try {
      const decoded = JSON.parse(atob(token.split(".")[1])); // Decode token
      if (decoded.exp * 1000 < Date.now()) return false; // Check expiration
    } catch (e) {
      return false;
    }
    return true;
  };

  const fetchMedicalHistory = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setError(null);

    if (!token || !isTokenValid(token)) {
      navigate("/account");
      return;
    }

    try {
      const userId = user._id ? user._id : user.id;
      const response = await fetch(`${VITE_BACKEND_URI}/medical-history/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.historyAppointments && Array.isArray(data.historyAppointments)) {
        setMedicalRecords(data.historyAppointments);
      } else {
        throw new Error("Dữ liệu từ server không hợp lệ");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalHistory();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="sm:text-4xl font-semibold text-center text-[#00759c]">Lịch sử lịch hẹn</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorAlert message={error} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 row-gap-4 max-h-[880px] overflow-y-auto">
              {medicalRecords.length === 0 ? (
                <div className="col-span-full flex items-center justify-center text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">Chưa có lịch sử lịch hẹn nào.</p>
                </div>
              ) : (
                medicalRecords.map((record, index) => (
                  <div key={index}>
                    <MedicalRecordCard record={record} />
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalHistory;
