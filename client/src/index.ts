import BootstrapVue from "bootstrap-vue";
import { LayoutPlugin, ModalPlugin, ProgressPlugin } from "bootstrap-vue";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "bootstrap/dist/css/bootstrap.css";
import Vue from "vue";
import VueRouter from "vue-router";
import App from "./App.vue";
import DownloadComponent from "./components/routes/Download.vue";
import NotFoundComponent from "./components/routes/NotFound.vue";
import UploadComponent from "./components/routes/Upload.vue";

Vue.use(VueRouter);

Vue.use(BootstrapVue);
Vue.use(LayoutPlugin);
Vue.use(ProgressPlugin);
Vue.use(ModalPlugin);

const routes = [
    { path: "/download/:id", component: DownloadComponent },
    { path: "/", component: UploadComponent },
    { path: "/error", component: NotFoundComponent },
    { path: "*", redirect: "/" }
];

const router = new VueRouter({
    mode: "history",
    routes
});

const vue = new Vue({
    el: "#app",
    render: h => h(App),
    router
});
