import Vue from "vue";
import VueRouter from "vue-router";
import BootstrapVue from "bootstrap-vue";
import { LayoutPlugin } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import UploadComponent from "./components/Upload.vue";
import DownloadComponent from "./components/Download.vue";

// import NoFoundComponent from "./components/NoFound.vue";

Vue.use(VueRouter);

Vue.use(BootstrapVue);
Vue.use(LayoutPlugin);

const routes = [
    { path: "/", component: UploadComponent },
    { path: "/download/:id", component: DownloadComponent }
    // { path: "*", component: NoFoundComponent }
];

const router = new VueRouter({
    mode: "history",
    routes: routes
});

new Vue({
    el: "#app",
    template: `<div class="bgr">
            <router-view></router-view>
        </div>`,
    router
});
