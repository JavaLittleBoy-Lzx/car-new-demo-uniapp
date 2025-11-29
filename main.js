import App from './App'

import uView from '@/uni_modules/uview-ui'
Vue.use(uView)
// vuex
import store from './store'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
import mixin from './common/mixin'

// 方式一：全局引入（推荐）
import dayjs from 'dayjs'
Vue.prototype.$dayjs = dayjs

Vue.prototype.$store = store

Vue.config.productionTip = false

App.mpType = 'app'
// #ifdef MP
// 引入uView对小程序分享的mixin封装
const mpShare = require('@/uni_modules/uview-ui/libs/mixin/mpShare.js')
Vue.mixin(mpShare)
// #endif
const app = new Vue({
	store,
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif// 引入请求封装
require('./util/request/index')(app)
