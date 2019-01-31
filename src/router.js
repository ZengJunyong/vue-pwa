import Vue from 'vue'
import Router from 'vue-router'
import Index from './views/Index.vue'
import Room from './views/Room.vue'

Vue.use(Router)

export default new Router({
    mode: 'hash',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            name: 'index',
            component: Index
        },
        {
            path: '/room',
            name: 'room',
            component: Room
        },
        // {
        //   path: '/about',
        //   name: 'about',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        //   component: () => import(/* webpackChunkName: "about" */ './views/About.vue')
        // }
    ]
})