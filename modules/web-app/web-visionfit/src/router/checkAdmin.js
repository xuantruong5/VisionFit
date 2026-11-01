import api from "../services/api";
import { createToaster } from "@meforma/vue-toaster";

const toaster = createToaster({ position: "top-right" });

export default function (to, from, next) {
    var token = localStorage.getItem("token_admin");

    if (!token) {
        next("/admin/login");
        toaster.error("Vui lòng đăng nhập để truy cập trang quản trị!");
        return;
    }

    api
        .get("/admin/check-token")
        .then((res) => {
            if (res.data.status) {
                localStorage.setItem("ho_ten_admin", res.data.ho_ten || "VisionFit Admin");
                if (res.data.email) {
                    localStorage.setItem("email_admin", res.data.email);
                }
                next();
            } else {
                localStorage.removeItem("token_admin");
                localStorage.removeItem("ho_ten_admin");
                localStorage.removeItem("email_admin");
                next("/admin/login");
                toaster.error(res.data.message || "Phiên đăng nhập hết hạn!");
            }
        })
        .catch(() => {
            localStorage.removeItem("token_admin");
            localStorage.removeItem("ho_ten_admin");
            localStorage.removeItem("email_admin");
            next("/admin/login");
            toaster.error("Không thể kết nối xác thực hệ thống, vui lòng đăng nhập lại!");
        });
}

