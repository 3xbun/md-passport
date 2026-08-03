<template>
  <div class="signInBtn btn drop-shadow" @click="login()">
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/960px-Microsoft_logo.svg.png"
      alt=""
      class="logo"
    />
    <strong>Sign In With Office365</strong>
  </div>
</template>

<script setup>
import { inject } from "vue";
import { PublicClientApplication } from "@azure/msal-browser";

import config from "../config";
import router from "../routes";

const profile = inject("profile");
const state = inject("state");

const Azure = new PublicClientApplication({
  auth: {
    clientId: config.CLIENT_ID,
    authority: config.AUTHORITY,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
});

const handleResponse = (res) => {
  if (res !== null) {
    const account = {
      Username: res.account.username.toLowerCase().split(".")[0],
      FullName: res.account.name.replace(/[0-9]/g, ""),
    };

    state.value.isAuthenticated = true;
    profile.value = account;

    localStorage.setItem("profile", JSON.stringify(account));
    localStorage.setItem("isAuthenticated", true);

    router.push("/passport/" + account.Username);
  }
};

Azure.handleRedirectPromise().then(handleResponse);

const login = () => {
  Azure.loginRedirect(config.SCOPES);
};
</script>

<style scoped>
.signInBtn {
  display: flex;
  height: 3em;
  background: var(--white);
  width: 80%;
  margin: 2em auto;
  padding: 0.5em;
  border-radius: 0.5em;
  gap: 1em;
  justify-content: center;
  align-items: center;
  color: var(--bg-dark);
}

img {
  height: 100%;
}
</style>
