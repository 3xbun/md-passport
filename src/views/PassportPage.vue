<template>
  <div class="passport-container">
    <!-- Student Passport Card -->
    <div class="passport-card" v-if="profile && profile.StudentID">
      <div class="card-body">
        <div class="student-info">
          <div class="info-row">
            <span class="info-label">เลขประจำตัวนักเรียน</span>
            <span class="info-value id-value">{{ profile.StudentID }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">ชื่อ - นามสกุล</span>
            <span class="info-value">{{ profile.FullName }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">ห้อง</span>
            <span class="info-value">ม.6/{{ profile.Room }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading-container">
      <div class="spinner"></div>
      <p>กำลังโหลดรายละเอียด...</p>
    </div>

    <!-- Parents QR Code Section -->
    <div
      class="parents-section"
      v-if="
        profile && profile.ParentsFullName && profile.ParentsFullName.length
      "
    >
      <h3 class="section-title">
        <i class="fa-solid fa-duotone fa-shield-halved"></i>
        ผู้ปกครองที่ลงทะเบียน
      </h3>
      <p class="section-desc">เลือกผู้ปกครองเพื่อแสดง QR code</p>

      <div class="parents-grid">
        <div
          class="parent-card"
          v-for="(parent, index) in profile.ParentsFullName"
          :key="index"
          @click="openQRModal(parent, profile.ParentsRel[index])"
        >
          <div class="parent-info">
            <span class="parent-name">{{ parent }}</span>
            <span class="parent-relation">{{
              profile.ParentsRel[index] || "Guardian"
            }}</span>
          </div>
          <button class="qr-trigger-btn" aria-label="Show QR Code">
            <i class="fa-solid fa-duotone fa-qrcode"></i>
            <span>แสดง QR</span>
          </button>
        </div>
      </div>
    </div>

    <!-- QRCodeModal Component -->
    <QRCodeModal
      :is-open="isModalOpen"
      :value="selectedQRValue"
      :title="selectedQRTitle"
      :subtitle="selectedQRSubtitle"
      @close="closeQRModal"
    />
  </div>
</template>

<script setup>
import { inject, onMounted, ref } from "vue";
import axios from "axios";
import QRCodeModal from "../components/QRCode.vue";
import router from "../routes";

const profile = inject("profile");
const state = inject("state");

// Modal State
const isModalOpen = ref(false);
const selectedQRValue = ref("");
const selectedQRTitle = ref("Parent QR Code");
const selectedQRSubtitle = ref("");

const openQRModal = (parent, rel) => {
  if (!profile.value || !profile.value.StudentID) return;
  selectedQRValue.value = profile.value.StudentID + "-" + parent;
  selectedQRTitle.value = "Parent QR Code";
  selectedQRSubtitle.value = `${parent} (${rel || "Guardian"})`;
  isModalOpen.value = true;
};

const closeQRModal = () => {
  isModalOpen.value = false;
};

onMounted(() => {
  if (!state.value.isAuthenticated) {
    router.push("/login");
  } else {
    const options = {
      method: "GET",
      url: "https://ndb.3xbun.com/api/v2/tables/md4y4grpi2qzyd2/records",
      params: {
        offset: "0",
        limit: "25",
        where: "",
        viewId: "vw8cogyvicxn6vjt",
      },
      headers: {
        "xc-token": "wU0uyFeODMGzOqqkIUethPYhnZn_FqXXgifuiXWu",
      },
    };

    axios
      .request(options)
      .then((res) => {
        profile.value = res.data.list[0];
      })
      .catch((err) => console.error(err));
  }
});
</script>

<style lang="css" scoped>
.passport-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

/* Card container */
.passport-card {
  background: linear-gradient(
    135deg,
    rgba(65, 76, 80, 0.4) 0%,
    rgba(25, 36, 39, 0.6) 100%
  );
  border: 1px solid rgba(56, 172, 231, 0.2);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow:
    0 15px 35px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

/* Subtle corner decoration to mimic a security pass */
.passport-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #38ace7, #192427);
}

.card-subtitle {
  font-size: 0.75rem;
  color: #a5a5a5;
  letter-spacing: 1px;
  margin-top: 0.25rem;
}

.card-body {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  flex-grow: 1;
}

.info-row {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.75rem;
  color: #a5a5a5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--white);
}

.id-value {
  font-family: monospace;
  color: var(--primary);
  font-size: 1.2rem;
  letter-spacing: 0.5px;
}

/* Parents / Guardians Section */
.parents-section {
  margin-top: 1rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  color: var(--primary);
}

.section-desc {
  font-size: 0.85rem;
  color: #a5a5a5;
  margin-bottom: 1.25rem;
}

.parents-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.parent-card {
  background: rgba(65, 76, 80, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.parent-card:hover {
  background: rgba(56, 172, 231, 0.1);
  border-color: rgba(56, 172, 231, 0.3);
  transform: translateY(-2px);
}

.parent-card:active {
  transform: translateY(0);
}

.parent-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.parent-name {
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--white);
}

.parent-relation {
  font-size: 0.8rem;
  color: var(--primary);
  font-weight: 500;
  background: rgba(56, 172, 231, 0.1);
  padding: 0.15rem 0.6rem;
  border-radius: 1rem;
  width: fit-content;
}

.qr-trigger-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(
    135deg,
    rgba(56, 172, 231, 0.1) 0%,
    rgba(56, 172, 231, 0.2) 100%
  );
  border: 1px solid rgba(56, 172, 231, 0.3);
  color: var(--white);
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.fa-qrcode {
  padding-top: 4px;
}

.parent-card:hover .qr-trigger-btn {
  background: var(--primary);
  color: #192427;
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(56, 172, 231, 0.25);
}

/* Loading State styles */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1.5rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(56, 172, 231, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive adjustment */
@media (max-width: 480px) {
  .card-body {
    flex-direction: column;
    text-align: center;
    gap: 1.25rem;
  }
  .profile-avatar {
    margin: 0 auto;
  }
}
</style>
