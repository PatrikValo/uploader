<template>
    <b-container class="h-100">
        <loading-page></loading-page>
    </b-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import LoadingPage from "../LoadingPage.vue";
import AuthDropbox from "../../ts/authDropbox";

@Component({
    components: { LoadingPage }
})
export default class Auth extends Vue {
    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    public mounted() {
        const hash = this.$route.hash;
        if (!hash) {
            this.$router.push("/");
            return (location.href = "/");
        }

        try {
            const auth = new AuthDropbox();
            auth.logIn(hash);
            location.href = "/";
        } catch (e) {
            location.href = "/";
        }
    }
}
</script>
