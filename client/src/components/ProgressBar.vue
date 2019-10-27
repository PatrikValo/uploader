<template>
    <div class="progress-bar-area">
        <b-progress
            :value="percentage"
            variant="warning"
            striped
            :animated="true"
            class="mt-2"
        ></b-progress>
        <div class="percentage">{{ percentage }}%</div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component({
    props: {
        uploaded: Number,
        total: Number
    }
})
export default class ProgressBar extends Vue {
    private _interval: number | undefined; // setInterval
    public percentage: number = 0;

    public constructor() {
        super();
    }

    public mounted() {
        // rendering each 500ms
        this._interval = setInterval(() => {
            const uploaded = this.$props.uploaded;
            const total = this.$props.total;
            this.percentage = Math.round((uploaded / total) * 100);
        }, 500);
    }

    public destroyed() {
        clearInterval(this._interval);
    }
}
</script>
<style scoped>
.progress-bar-area {
    padding: 15px 0 15px 0;
}

.percentage {
    text-align: center;
}
</style>
