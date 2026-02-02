import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import SvgIcon from './components/SvgIcon.vue'

import './assets/index.css'
import 'virtual:svg-icons-register'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('svg-icon', SvgIcon)

app.mount('#app')
