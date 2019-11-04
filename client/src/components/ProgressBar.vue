<template>
    <div class="progress-bar-area">
        <b-progress
            :value="percentage"
            variant="warning"
            striped
            :animated="true"
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
    private interval: number | undefined; // setInterval
    public percentage: number = 0;

    public constructor() {
        super();
    }

    public mounted() {
        // rendering each 500ms
        this.interval = setInterval(() => {
            const uploaded = this.$props.uploaded;
            const total = this.$props.total;
            this.percentage = Math.round((uploaded / total) * 100);
        }, 500);
    }

    public destroyed() {
        clearInterval(this.interval);
    }
}
</script>
<style scoped>
.progress-bar-area {
    padding: 15px 10px 15px 10px;
}

.percentage {
    text-align: center;
}
</style>
