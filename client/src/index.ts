import Vue from "vue";
import VueRouter from "vue-router";
import BootstrapVue from "bootstrap-vue";
import { LayoutPlugin } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import UploadComponent from "./components/Upload.vue";
import DownloadComponent from "./components/Download.vue";
import NotFoundComponent from "./components/NotFound.vue";
import App from "./App.vue";

Vue.use(VueRouter);

Vue.use(BootstrapVue);
Vue.use(LayoutPlugin);

const routes = [
    { path: "/download/:id", component: DownloadComponent },
    { path: "/", component: UploadComponent },
    { path: "/error", component: NotFoundComponent },
    { path: "*", redirect: "/" }
];

const router = new VueRouter({
    mode: "history",
    routes: routes
});

new Vue({
    el: "#app",
    router,
    render: h => h(App)
});
