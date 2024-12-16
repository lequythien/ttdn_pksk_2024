const Joi = require("joi");

const specializationSchema = Joi.object({
  name: Joi.string().min(1).required().messages({
    "string.base": "Tên chuyên khoa phải là một chuỗi.",
    "string.empty": "Tên chuyên khoa không được để trống.",
    "string.min": "Tên chuyên khoa phải có ít nhất {#limit} ký tự.",
    "any.required": "Tên chuyên khoa là bắt buộc.",
  }),
  description: Joi.string().required().messages({
    "string.base": "Mô tả phải là một chuỗi.",
    "string.empty": "Mô tả không được để trống.",
    "any.required": "Mô tả là bắt buộc.",
  }),
  image: Joi.any()
  .custom((value, helpers) => {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', "image/svg+xml",];

    // Check if `mimetype` exists and is valid
    if (!value || !value.mimetype || !validImageTypes.includes(value.mimetype)) {
      // Use helpers.message to ensure the custom message is always shown
      return helpers.message('Tệp tải lên phải là một ảnh (JPEG, PNG, GIF, SVG).');
    }
    return value;
  }),
});

const validateSpecialization = (data) => {
  return specializationSchema.validate(data);
};

module.exports = validateSpecialization;
