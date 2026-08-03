import { createRouter, createWebHistory } from "vue-router";

import LoginPage from "../views/LoginPage.vue";
import PassportPage from "../views/PassportPage.vue";
import ScannerPage from "../views/ScannerPage.vue";
import ParentPage from "../views/ParentPage.vue";

const routes = [
  {
    path: "/",
    component: LoginPage,
  },
  {
    path: "/login",
    name: "login",
    component: LoginPage,
  },
  {
    path: "/passport/:stdID",
    name: "passport",
    component: PassportPage,
  },
  {
    path: "/passport/scan",
    name: "scan",
    component: ScannerPage,
  },
  {
    path: "/list",
    name: "parent-list",
    component: ParentPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
