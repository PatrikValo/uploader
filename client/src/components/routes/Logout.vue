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
    components: { LoadingPage },
    props: {
        auth: AuthDropbox
    }
})
export default class Logout extends Vue {
    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    public mounted() {
        try {
            const a: AuthDropbox = this.$props.auth;
            a.logout();
            setTimeout(() => {
                return this.$router.push("/");
            }, 500);
        } catch (e) {
            return this.$router.push("/");
        }
    }
}
</script>
