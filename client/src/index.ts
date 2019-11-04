import BootstrapVue from "bootstrap-vue";
import {
    ButtonPlugin,
    LayoutPlugin,
    ModalPlugin,
    ProgressPlugin
} from "bootstrap-vue";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "bootstrap/dist/css/bootstrap.css";
import Vue from "vue";
import VueRouter from "vue-router";
import App from "./App.vue";
import CopyComponent from "./components/routes/Copy.vue";
import DownloadComponent from "./components/routes/Download.vue";
import NotFoundComponent from "./components/routes/NotFound.vue";
import UploadComponent from "./components/routes/Upload.vue";
import "./style/css.css";

Vue.use(VueRouter);

Vue.use(BootstrapVue);
Vue.use(LayoutPlugin);
Vue.use(ProgressPlugin);
Vue.use(ModalPlugin);
Vue.use(ButtonPlugin);

const routes = [
    { path: "/download/:id", component: DownloadComponent },
    { path: "/", component: UploadComponent },
    { path: "/copy/:id", component: CopyComponent },
    { path: "/error", component: NotFoundComponent },
    { path: "*", redirect: "/" }
];

const router = new VueRouter({
    mode: "history",
    routes
});

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
const vue = new Vue({
    el: "#app",
    render: h => h(App),
    router
});
