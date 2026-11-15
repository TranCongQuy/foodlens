/**
 * Từ điển bản địa hóa tiếng Việt của FoodLens.
 * Chỉ giữ các chuỗi đang dùng thật: thương hiệu, điều hướng, xác thực và quản trị.
 */

export const vi = {
  brand: {
    name: 'FoodLens',
    tagline: 'Chụp món ăn, biết ngay calo',
    slogan: 'Chụp hoặc tải ảnh món ăn, AI ước lượng calo và dinh dưỡng trong vài giây',
    aiDisclaimer: 'Kết quả dinh dưỡng do AI ước lượng, chỉ mang tính tham khảo',
  },

  nav: {
    home: 'Trang chủ',
    settings: 'Cài đặt',
    admin: 'Quản trị',
    trust: 'Minh bạch AI',
    profile: 'Tài khoản',
    logout: 'Đăng xuất',
    login: 'Đăng nhập',
    register: 'Đăng ký',
  },

  auth: {
    loginTitle: 'Chào mừng bạn trở lại!',
    loginSubtitle: 'Đăng nhập để chụp món ăn và xem ước lượng dinh dưỡng bằng AI',
    registerTitle: 'Tạo tài khoản FoodLens',
    registerSubtitle: 'Đăng ký để phân tích món ăn và lưu lịch sử dinh dưỡng của bạn',
    forgotPasswordTitle: 'Khôi phục mật khẩu',
    forgotPasswordSubtitle: 'Nhập email để nhận liên kết đặt lại mật khẩu',
    emailLabel: 'Email của bạn',
    emailPlaceholder: 'ban@example.com',
    passwordLabel: 'Mật khẩu',
    passwordPlaceholder: 'Tối thiểu 6 ký tự',
    fullNameLabel: 'Họ và tên của bạn',
    fullNamePlaceholder: 'Ví dụ: Nguyễn Văn An',
    submitLogin: 'Đăng nhập ngay',
    submitRegister: 'Tạo tài khoản',
    submitForgot: 'Gửi liên kết khôi phục',
    hasAccount: 'Đã có tài khoản?',
    noAccount: 'Chưa có tài khoản?',
    backToLogin: 'Quay lại đăng nhập',
    errorInvalidEmail: 'Email không đúng định dạng',
    errorShortPassword: 'Mật khẩu phải có ít nhất 6 ký tự',
    errorNameRequired: 'Vui lòng nhập họ và tên',
    loginSuccess: 'Đăng nhập thành công! Chào mừng bạn.',
    registerSuccess: 'Đăng ký thành công! Bắt đầu phân tích món ăn đầu tiên nhé.',
    logoutSuccess: 'Đã đăng xuất an toàn.',
  },

  admin: {
    tabs: {
      overview: 'Tổng quan & KPI',
      costs: 'Chi phí & Hạn mức',
      users: 'Quản lý người dùng',
      audit: 'Nhật ký kiểm toán',
    },
    users: {
      title: 'Quản Lý Tài Khoản Người Dùng',
      searchUser: 'Tìm theo tên, email...',
      colName: 'Họ và tên',
      colRole: 'Vai trò',
      colStatus: 'Trạng thái',
      lockUser: 'Khóa tài khoản',
      unlockUser: 'Mở khóa tài khoản',
    },
    audit: {
      title: 'Nhật Ký Kiểm Toán Admin (Audit Logs)',
      colAdmin: 'Quản trị viên',
      colAction: 'Hành động',
      colTarget: 'Đối tượng tác động',
      colDetails: 'Chi tiết thay đổi',
      colTimestamp: 'Thời điểm',
    },
  },
};
