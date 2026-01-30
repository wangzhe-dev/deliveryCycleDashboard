<template>
    <div class="dashboard">
        
      <A3DV modelUrl="/models/000-D710P-DK7A-BM147A.fbx" modelType="fbx"></A3DV>
    </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

import A3DV from './model/3DBom.vue';

</script>
<style scoped>
    .dashboard{
        height: 100%;
    }
</style>