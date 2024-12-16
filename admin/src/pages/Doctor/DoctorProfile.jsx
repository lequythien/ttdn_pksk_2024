import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DoctorContext } from "../../context/DoctorContext";

const DoctorProfile = () => {
  const { dToken, profileData, getProfileData, backendUrl } = useContext(DoctorContext);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReadMore, setIsReadMore] = useState(false);

  useEffect(() => {
    if (profileData) {
      setFormData(profileData.doctorProfile);
    }
  }, [profileData]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle image changes
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const doctorInfo = JSON.parse(sessionStorage.getItem("doctorInfo"));
      const doctorId = doctorInfo ? doctorInfo.id : null;
      const updatedData = new FormData();

      // Thêm tất cả các trường vào FormData
      updatedData.append("name", formData.name || "");
      updatedData.append("email", formData.email || "");
      updatedData.append("phone", formData.phone || "");
      updatedData.append("description", formData.description || "");

      // Gửi giá trị price mà không cần loại bỏ dấu chấm
      updatedData.append("price", formData.price || "0");
      updatedData.append("available", formData.available ? "true" : "false");

      // Chỉ thêm hình ảnh nếu có ảnh mới được chọn
      if (selectedImage) {
        updatedData.append("image", selectedImage);
      }

      // Chỉ thêm mật khẩu nếu có
      if (newPassword) {
        updatedData.append("oldPassword", oldPassword || "");
        updatedData.append("newPassword", newPassword);
      }

      const { data } = await axios.put(
        `${backendUrl}/doctor/update-profile/${doctorId}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${dToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        setIsEdit(false);
        getProfileData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response ? error.response.data.message : "Đã xảy ra lỗi!");
    } finally {
      setLoading(false);
    }
  };


  // Cancel changes
  const handleCancel = () => {
    setIsEdit(false);
    setSelectedImage(null);
    setPreviewImage(null);
    setNewPassword("");
    setOldPassword("");
  };

  // Handle Read More / Read Less toggle
  const handleReadMoreToggle = () => setIsReadMore(!isReadMore);

  useEffect(() => {
    if (dToken) {
      getProfileData();
    }
  }, [dToken]);

  // Check if the update button should be disabled
  const isUpdateDisabled = () => {
    return (
      isEdit &&
      (newPassword && !oldPassword)
    );
  };

  const formatPrice = (price) => {
    if (isNaN(price)) return price;
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    profileData && (
      <div className={`w-full max-w-4xl mx-auto p-5 bg-gray-50 shadow-md rounded-md mt-8 ${isEdit ? 'h-auto' : 'h-[450px]'} mb-5`}>
        <div className="flex flex-col sm:flex-row gap-5 mb-6">
          {/* Left section: Image, Name, and Specialization */}
          <div className="flex flex-col items-center sm:items-start gap-4 sm:w-1/3">
            <div className="relative ml-6">
              <img
                className="bg-primary/80 sm:max-w-64 h-64 rounded-lg object-cover shadow-lg"
                src={
                  previewImage
                    ? previewImage
                    : selectedImage
                      ? URL.createObjectURL(selectedImage)
                      : profileData.doctorProfile.image
                }
                alt="Profile"
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg">
                  <div className="animate-spin rounded-full border-t-4 border-blue-600 w-16 h-16"></div>
                </div>
              )}
              {isEdit && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-40 transition-opacity duration-300">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center cursor-pointer text-white"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-sm">Thay đổi ảnh</span>
                    <input
                      id="file-upload"
                      name="image"
                      type="file"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center text-center w-full">
              {isEdit ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="text-xl text-center font-semibold text-gray-800 w-full sm:w-auto border border-gray-200 p-2 rounded-md"
                  placeholder="Name"
                />
              ) : (
                <h2 className="text-2xl font-semibold text-gray-800">
                  {profileData.doctorProfile.name}
                </h2>
              )}
              <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <p>
                      Khoa: {profileData.doctorProfile.specialization_id.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        onChange={() => {
                          if (isEdit) {
                            setFormData((prev) => ({
                              ...prev,
                              available: !prev.available,
                            }));
                          }
                        }}
                        checked={formData.available}
                        type="checkbox"
                        name="available"
                        id=""
                      />
                      <label htmlFor="available-checkbox" className="cursor-pointer">
                        Available
                      </label>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right section: Email, Phone, Description */}
          <div className="sm:w-2/3 bg-white p-6 rounded-md shadow-sm">
            <div className="mb-6">
              {isEdit ? (
                <>
                  <label className="block text-gray-700 font-bold mb-1">
                    Email:
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-blue-500"
                    placeholder="Email"
                  />
                </>
              ) : (
                <p className="text-gray-800 text-lg">
                  <span className="font-bold">Email:</span>{" "}
                  {profileData.doctorProfile.email}
                </p>
              )}
            </div>

            <div className="mb-6">
              {isEdit ? (
                <>
                  <label className="block text-gray-700 font-bold mb-1">
                    Số điện thoại:
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone"
                  />
                </>
              ) : (
                <p className="text-gray-800 text-lg">
                  <span className="font-bold">Số điện thoại:</span>{" "}
                  {profileData.doctorProfile.phone}
                </p>
              )}
            </div>

            <div className="mb-6">
              {isEdit ? (
                <>
                  <label className="block text-gray-700 font-bold mb-1">
                    Giá:
                  </label>
                  <input
                    type="text" // Sử dụng type="text" để cho phép dấu phân cách
                    name="price"
                    value={formData.price ? formatPrice(formData.price) : ""}
                    onChange={(e) =>
                      handleInputChange({
                        target: {
                          name: "price",
                          value: e.target.value.replace(/\./g, ""), // Xóa dấu chấm trước khi lưu
                        },
                      })
                    }
                    className="w-full p-3 border-2 border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-blue-500"
                    placeholder="Giá"
                  />
                </>
              ) : (
                <p className="text-gray-800 text-lg">
                  <span className="font-bold">Giá:</span>{" "}
                  {formatPrice(profileData.doctorProfile.price)} VND
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-1">
                Giới thiệu:
              </label>
              {isEdit ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full h-[90px] p-3 border-2 border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-blue-500"
                  placeholder="Description"
                />
              ) : (
                <textarea
                  name="description"
                  value={profileData.doctorProfile.description}
                  onChange={handleInputChange}
                  readOnly={!isEdit}
                  className="w-full h-[90px] p-3 border-2 border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-blue-500"
                  placeholder="Description"
                />
              )}
            </div>

            {isEdit && (
              <div className="mb-6">
                {/* New Password Field */}
                <label className="block text-gray-700 font-bold mb-1">
                  Mật khẩu mới:
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-blue-500"
                  placeholder="Mật khẩu mới"
                />

                {/* Old Password Field */}
                {newPassword && (
                  <>
                    <label className="block text-gray-700 font-bold mb-1 mt-4">
                      Mật khẩu cũ:
                    </label>
                    <input
                      type="text"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full p-3 border-2 border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-blue-500"
                      placeholder="Mật khẩu cũ"
                    />
                  </>
                )}
              </div>
            )}

            <div className="flex justify-center space-x-2">
              {isEdit ? (
                <>
                  <button
                    onClick={updateProfile}
                    className={`px-4 py-2 rounded-md ${loading || isUpdateDisabled()
                      ? "bg-gray-300 text-black disabled-button"
                      : "bg-[#219c9e] text-white"
                      }`}
                    disabled={loading || isUpdateDisabled()}
                  >
                    {loading ? "Cập nhật..." : "Cập nhật"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-300 text-black rounded-md"
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEdit(true)}
                  className="px-4 py-2 bg-[#219c9e] text-white rounded-md"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default DoctorProfile;
