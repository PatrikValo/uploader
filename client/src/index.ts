import BootstrapVue from "bootstrap-vue";
import {
    AlertPlugin,
    ButtonPlugin,
    DropdownPlugin,
    LayoutPlugin,
    ModalPlugin,
    ProgressPlugin
} from "bootstrap-vue";
import Vue from "vue";
import VueRouter from "vue-router";
import App from "./App.vue";
import AuthComponent from "./components/routes/Auth.vue";
import CompatibilityComponent from "./components/routes/Compatibility.vue";
import CopyComponent from "./components/routes/Copy.vue";
import DownloadComponent from "./components/routes/Download.vue";
import LogoutComponent from "./components/routes/Logout.vue";
import NotFoundComponent from "./components/routes/NotFound.vue";
import UploadComponent from "./components/routes/Upload.vue";
import "./style/style.scss";

Vue.use(VueRouter);

Vue.use(AlertPlugin);
Vue.use(DropdownPlugin);
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
    { path: "/compatibility", component: CompatibilityComponent },
    { path: "/auth", component: AuthComponent },
    { path: "/logout", component: LogoutComponent },
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
