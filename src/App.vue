<template>
  <div class="container">
    <Header />
    <router-view></router-view>
  </div>
</template>

<script setup>
import { onMounted, provide, ref } from "vue";

import Header from "./components/Header.vue";

const profile = ref("");
const state = ref({
  isAuthenticated: localStorage.isAuthenticated || false,
});

provide("profile", profile);
provide("state", state);

onMounted(() => {
  if (localStorage.getItem("profile")) {
    profile.value = JSON.parse(localStorage.getItem("profile"));
  }
});
</script>

<style lang="css" scoped></style>
