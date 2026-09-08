import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        redirect: '/admin/dashboard'
    },

    {
        path: '/admin/dashboard',
        component: () => import('../components/Admin/dashboard/dashboard.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/gymmer',
        component: () => import('../components/Admin/gymmer/gymmer.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/trainer',
        component: () => import('../components/Admin/trainer/trainer.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/phan-cong',
        component: () => import('../components/Admin/phanCong/phanCong.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/goi-tap',
        component: () => import('../components/Admin/goiTap/goiTap.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/lich-lop',
        component: () => import('../components/Admin/lichLop/lichLop.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/video',
        component: () => import('../components/Admin/video/video.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/phan-tich-ai',
        component: () => import('../components/Admin/phanTichAI/phanTichAI.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/trainer-review',
        component: () => import('../components/Admin/trainerReview/trainerReview.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/bao-cao-ai',
        component: () => import('../components/Admin/baoCaoAI/baoCaoAI.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/ban-goi',
        component: () => import('../components/Admin/banGoi/banGoi.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/hoa-don',
        component: () => import('../components/Admin/hoaDon/hoaDon.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/giao-dich',
        component: () => import('../components/Admin/giaoDich/giaoDich.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/bao-cao-doanh-thu',
        component: () => import('../components/Admin/baoCaoDoanhThu/baoCaoDoanhThu.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/phan-quyen',
        component: () => import('../components/Admin/phanQuyen/phanQuyen.vue'),
        meta: {
            layout: 'admin'
        }
    },

    {
        path: '/admin/login',
        name: 'AdminLogin',
        component: () => import('../components/Admin/login/login.vue'),
        meta: {
            layout: 'blank'
        }
    },

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router