import Vue from "vue";
import VueRouter from "vue-router";
import UploadComponent from "./components/Upload.vue";
import DownloadComponent from "./components/Download.vue";
// import NoFoundComponent from "./components/NoFound.vue";

Vue.use(VueRouter);

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
    template: `<router-view></router-view>`,
    router
});
