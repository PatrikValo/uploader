<template>
    <div class="progress-bar-area">
        <b-progress
            :value="percentage"
            variant="warning"
            height="1.5rem"
            class="mt-2"
        ></b-progress>
        <p class="text-secondary percentage">{{ percentage }}%</p>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({
    props: {
        uploaded: Number,
        total: Number
    }
})
export default class ProgressBar extends Vue {
    private interval?: number; // setInterval
    private percentage: number = 0;

    public constructor() {
        super();
    }

    // noinspection JSUnusedGlobalSymbols
    public mounted() {
        // rendering each 500ms
        this.interval = window.setInterval(() => {
            const { total, uploaded } = this.$props;

            this.percentage = Math.round((uploaded / total) * 100);
        }, 500);
    }

    // noinspection JSUnusedGlobalSymbols
    public destroyed() {
        clearInterval(this.interval);
    }
}
</script>
<style scoped>
.progress-bar-area {
    padding: 15px 10px 0 10px;
}

.percentage {
    text-align: center;
}
</style>
