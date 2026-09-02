import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import LayoutAdmin from './layout/wrapper/Admin/layoutAdmin.vue'
import LayoutBlank from './layout/wrapper/Blank/layoutBlank.vue'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/css/main.css'

const app = createApp(App)

app.use(router)

app.component('admin-layout', LayoutAdmin)
app.component('blank-layout', LayoutBlank)

app.mount('#app')