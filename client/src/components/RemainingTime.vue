<template>
    <div>
        <div id="line"></div>
        <p class="text-secondary">{{ secondsToAppropriateTime }}</p>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";

@Component({
    props: {
        uploaded: Number,
        size: Number
    }
})
export default class RemainingTime extends Vue {
    private startTime: Date = new Date();
    private interval: number | undefined;
    private remainingSeconds: number = Infinity;

    public constructor() {
        super();
    }

    public mounted() {
        // rendering each 500ms
        this.interval = setInterval(() => {
            const secondsElapsed =
                (new Date().getTime() - this.startTime.getTime()) / 1000;
            const bytesPerSecond = this.$props.uploaded / secondsElapsed;
            const remainingBytes = this.$props.size - this.$props.uploaded;
            this.remainingSeconds = Math.round(remainingBytes / bytesPerSecond);
        }, 1000);
    }

    public destroyed() {
        clearInterval(this.interval);
    }

    get secondsToAppropriateTime() {
        let seconds = this.remainingSeconds;
        if (seconds == Infinity) {
            return "Nekonečno";
        }

        if (seconds < 60) {
            return seconds + "s";
        }

        if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            seconds = seconds % 60;
            return `${minutes}m ${seconds}s`;
        }

        if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.ceil((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }

        if (seconds < 604800) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.ceil((seconds % 86400) / 3600);
            return `${days}d ${hours}h`;
        }

        return (
            Math.floor(seconds / 604800) +
            "t " +
            Math.ceil((seconds % 604800) / 86400) +
            "d"
        );
    }
}
</script>
<style scoped>
#line {
    padding: 10px 0 0 0;
    border-top: 1px solid #6c757d;
    width: 120px;
    margin-left: auto;
    margin-right: auto;
}
</style>
