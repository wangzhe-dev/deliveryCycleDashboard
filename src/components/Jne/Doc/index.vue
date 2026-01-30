<!--
 * @Author: zhaijs
 * @Date: 2023-07-28 11:21:43
 * @LastEditTime: 2023-08-01 10:30:06
 * @Description: 请填写简介
-->
<template>
  <div>
    <svg-icon icon-class="question" @click="goto" />
  </div>
</template>

<script setup>
const url = ref('http://doc.jne.vip/jne-cloud');

function goto() {
  window.open(url.value)
}
</script>