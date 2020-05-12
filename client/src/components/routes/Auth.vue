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
export default class Auth extends Vue {
    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    public mounted() {
        const { hash } = this.$route;

        if (!hash) {
            return this.$router.push("/");
        }

        try {
            const a: AuthDropbox = this.$props.auth;
            a.login(hash);

            setTimeout(() => {
                return this.$router.push("/");
            }, 500);
        } catch (e) {
            return this.$router.push("/");
        }
    }
}
</script>
