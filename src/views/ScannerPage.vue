<template>
  <div class="admin-container">
    <!-- Scanner Control Panel -->
    <div class="control-panel">
      <!-- Scanner Viewfinder Card -->
      <div class="scanner-wrapper">
        <qr-stream :key="scannerKey" @decode="onDecode" class="scanner-stream">
          <!-- Premium Sci-Fi HUD Overlaid on Camera Feed -->
          <div class="scanner-hud">
            <div class="viewfinder-frame">
              <!-- Corner notches -->
              <div class="hud-corner corner-tl"></div>
              <div class="hud-corner corner-tr"></div>
              <div class="hud-corner corner-bl"></div>
              <div class="hud-corner corner-br"></div>

              <!-- sweeping laser line -->
              <div class="hud-laser"></div>
            </div>
          </div>
        </qr-stream>
      </div>
    </div>

    <!-- Scan Results Dashboard -->
    <div class="results-dashboard">
      <h3 class="results-title">
        <i class="fa-solid fa-duotone fa-square-poll-horizontal"></i> ผลลัพท์
      </h3>

      <Transition name="fade-slide" mode="out-in">
        <!-- Loading State -->
        <div
          v-if="isLoading"
          class="results-card loading-state"
          :key="'loading'"
        >
          <div class="loading-spinner-wrap">
            <div class="spinner"></div>
          </div>
          <p class="loading-text">กำลังตรวจสอบข้อมูล...</p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="errorMsg"
          class="results-card error-state"
          :key="'error'"
        >
          <div class="error-header">
            <div class="error-icon-wrap">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="error-message">
              <h4>เกิดข้อผิดพลาด</h4>
              <p>{{ errorMsg }}</p>
            </div>
          </div>
          <button @click="resetScanner" class="btn-reset btn-danger">
            สแกนอีกครั้ง
          </button>
        </div>

        <!-- Check-In Success State -->
        <div
          v-else-if="isCheckInSuccess"
          class="results-card checkin-success-state"
          :key="'checkin-success'"
        >
          <div class="success-header">
            <div class="success-icon-wrap">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <div class="success-message">
              <h4>เช็คอินสำเร็จ</h4>
              <p>บันทึกการเช็คอินของผู้ปกครองเรียบร้อยแล้ว</p>
            </div>
          </div>

          <div class="results-table">
            <div class="results-row">
              <span class="row-label">
                <i class="fa-solid fa-duotone fa-id-card"></i>
                เลขประจำตัวนักเรียน
              </span>
              <span class="row-value id-highlight">
                {{ parent.Students?.fields?.StudentID || "N/A" }}
              </span>
            </div>
            <div class="results-row">
              <span class="row-label">
                <i class="fa-duotone fa-solid fa-user-graduate"></i>
                นักเรียน
              </span>
              <span class="row-value id-highlight">
                {{ parent.studentFullName || "N/A" }}
              </span>
            </div>
            <div class="results-row">
              <span class="row-label">
                <i class="fa-solid fa-duotone fa-user-shield"></i> ผู้ปกครอง
              </span>
              <span class="row-valueName">
                {{ parent.FullName }} ({{ parent.Relationship }})
              </span>
            </div>
          </div>

          <button @click="resetScanner" class="btn-reset">สแกนคนต่อไป</button>
        </div>

        <!-- Already Checked In State -->
        <div
          v-else-if="parent.Id && parent.Checked"
          class="results-card warning-state"
          :key="'already-checked'"
        >
          <div class="warning-header">
            <div class="warning-icon-wrap">
              <i class="fa-solid fa-circle-exclamation"></i>
            </div>
            <div class="warning-message">
              <h4>เช็คอินไปแล้ว</h4>
              <p>คิวอาร์โค้ดนี้ถูกใช้งานเพื่อเช็คอินไปแล้ว</p>
            </div>
          </div>

          <div class="results-table">
            <div class="results-row">
              <span class="row-label">
                <i class="fa-solid fa-duotone fa-id-card"></i>
                เลขประจำตัวนักเรียน
              </span>
              <span class="row-value id-highlight">
                {{ parent.Students?.fields?.StudentID || "N/A" }}
              </span>
            </div>
            <div class="results-row">
              <span class="row-label">
                <i class="fa-duotone fa-solid fa-user-graduate"></i>
                นักเรียน
              </span>
              <span class="row-value id-highlight">
                {{ parent.studentFullName || "N/A" }}
              </span>
            </div>
            <div class="results-row">
              <span class="row-label">
                <i class="fa-solid fa-duotone fa-user-shield"></i> ผู้ปกครอง
              </span>
              <span class="row-valueName">
                {{ parent.FullName }} ({{ parent.Relationship }})
              </span>
            </div>
          </div>

          <button @click="resetScanner" class="btn-reset btn-warning-action">
            สแกนอีกครั้ง
          </button>
        </div>

        <!-- Ready to Check-In State -->
        <div
          v-else-if="parent.Id"
          class="results-card success-state"
          :key="'success'"
        >
          <div class="success-header">
            <div class="success-icon-wrap">
              <i
                class="fa-solid fa-circle-notch fa-spin"
                v-if="isCheckingIn"
              ></i>
              <i class="fa-solid fa-duotone fa-circle-check" v-else></i>
            </div>
            <div class="success-message">
              <h4>ข้อมูลถูกต้อง</h4>
              <p>กรุณากดปุ่มเพื่อยืนยันการเช็คอิน</p>
            </div>
          </div>

          <div class="results-table">
            <div class="results-row">
              <span class="row-label">
                <i class="fa-solid fa-duotone fa-id-card"></i>
                เลขประจำตัวนักเรียน
              </span>
              <span class="row-value id-highlight">
                {{ parent.Students?.fields?.StudentID || "N/A" }}
              </span>
            </div>
            <div class="results-row">
              <span class="row-label">
                <i class="fa-duotone fa-solid fa-user-graduate"></i>
                นักเรียน
              </span>
              <span class="row-value id-highlight">
                {{ parent.studentFullName || "N/A" }}
              </span>
            </div>
            <div class="results-row">
              <span class="row-label">
                <i class="fa-solid fa-duotone fa-user-shield"></i> ผู้ปกครอง
              </span>
              <span class="row-valueName">
                {{ parent.FullName }} ({{ parent.Relationship }})
              </span>
            </div>
          </div>

          <div class="action-buttons">
            <button
              @click="checkIn(parent.Id)"
              :disabled="isCheckingIn"
              class="btn-reset"
            >
              {{ isCheckingIn ? "กำลังบันทึก..." : "ยืนยัน" }}
            </button>
            <button
              @click="resetScanner"
              :disabled="isCheckingIn"
              class="btn-reset btn-secondary"
            >
              ยกเลิก
            </button>
          </div>
        </div>

        <!-- Waiting / Empty State -->
        <div v-else class="results-card idle-state" :key="'idle'">
          <div class="idle-icon-wrap">
            <i class="fa-duotone fa-solid fa-scanner-gun animate-scanning"></i>
          </div>
          <p class="idle-text">พร้อมสแกน</p>
          <span class="idle-desc"
            >สแกน QR code จากผู้ปกครองลงบนหน้าจอด้านบน
          </span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref } from "vue";
import { QrStream } from "vue3-qr-reader";

const decodeText = ref(null);
const parent = ref({});
const isLoading = ref(false);
const isCheckingIn = ref(false);
const errorMsg = ref(null);
const isCheckInSuccess = ref(false);
const scannerKey = ref(0);

const onDecode = (data) => {
  // If we are currently loading, checking in, displaying success, or already found a parent, guard against extra stream triggers
  if (
    isLoading.value ||
    isCheckingIn.value ||
    isCheckInSuccess.value ||
    parent.value.Id
  ) {
    return;
  }

  if (data && data !== decodeText.value) {
    decodeText.value = data;
    isCheckInSuccess.value = false;
    errorMsg.value = null;
    parent.value = {};

    const parts = data.split("-");
    if (parts.length >= 2) {
      const parentName = parts.slice(1).join("-");
      getParent(parentName);
    } else {
      errorMsg.value = "รูปแบบ QR Code ไม่ถูกต้อง (ข้อมูลไม่ครบ)";
    }
  }
};

const getParent = (p) => {
  isLoading.value = true;
  errorMsg.value = null;
  const options = {
    method: "GET",
    url: "https://ndb.3xbun.com/api/v3/data/pynnt7fm0gsgwlq/mtlg3m3ctl8sx6l/records",
    params: {
      offset: "0",
      limit: "25",
      where: `(FullName, eq, ${p})`,
      viewId: "vwsj72zlszng170u",
    },
    headers: { "xc-token": "wU0uyFeODMGzOqqkIUethPYhnZn_FqXXgifuiXWu" },
  };

  axios
    .request(options)
    .then((res) => {
      isLoading.value = false;
      if (res.data && res.data.records && res.data.records.length > 0) {
        parent.value = res.data.records[0].fields;
        parent.value.Id = res.data.records[0].id;
      } else {
        errorMsg.value = "ไม่พบข้อมูลผู้ปกครองนี้ในระบบ";
      }
    })
    .catch((err) => {
      isLoading.value = false;
      console.error(err);
      errorMsg.value = "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ปกครอง";
    });
};

const checkIn = (id) => {
  isCheckingIn.value = true;
  errorMsg.value = null;
  axios
    .patch(
      "https://ndb.3xbun.com/api/v3/data/pynnt7fm0gsgwlq/mtlg3m3ctl8sx6l/records",
      {
        id: id,
        fields: {
          Checked: true,
        },
      },
      {
        headers: { "xc-token": "wU0uyFeODMGzOqqkIUethPYhnZn_FqXXgifuiXWu" },
      },
    )
    .then((res) => {
      isCheckingIn.value = false;
      isCheckInSuccess.value = true;
      parent.value.Checked = true;
      console.log(res.data);
    })
    .catch((err) => {
      isCheckingIn.value = false;
      console.error(err);
      errorMsg.value = "เกิดข้อผิดพลาดในการบันทึกการเช็คอิน";
    });
};

const resetScanner = () => {
  decodeText.value = null;
  parent.value = {};
  errorMsg.value = null;
  isCheckInSuccess.value = false;
  scannerKey.value++; // Force QrStream component to unmount & remount, resetting internal decode state
};
</script>

<style lang="css" scoped>
.admin-container {
  display: flex;
  flex-direction: column;
  gap: 1em;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

/* Header styling */
.admin-header {
  text-align: center;
  margin-bottom: 0.5rem;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(56, 172, 231, 0.12);
  border: 1px solid rgba(56, 172, 231, 0.25);
  padding: 0.35rem 0.85rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: 1px;
  margin-bottom: 0.75rem;
}

.admin-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--white);
  letter-spacing: 0.5px;
}

.admin-subtitle {
  font-size: 0.9rem;
  color: #a5a5a5;
  margin-top: 0.35rem;
}

/* Control Panel / Camera section */
.control-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  background: linear-gradient(
    135deg,
    rgba(65, 76, 80, 0.2) 0%,
    rgba(25, 36, 39, 0.4) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.75rem;
  border-radius: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.scanner-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.4rem 0.85rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #2ecc71;
  box-shadow: 0 0 8px #2ecc71;
}

.status-text {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #2ecc71;
}

/* Scanner Frame */
.scanner-wrapper {
  position: relative;
  width: 280px;
  height: 280px;
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(56, 172, 231, 0.3);
}

.scanner-stream {
  width: 100%;
  height: 100%;
  display: block;
}

/* Sci-fi Overlay HUD */
.scanner-hud {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
}

.viewfinder-frame {
  position: relative;
  width: 75%;
  height: 75%;
  border: 1px dashed rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
  box-shadow: 0 0 0 9999px rgba(10, 15, 17, 0.65);
}

/* Corner brackets styling */
.hud-corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 3px solid var(--primary);
  filter: drop-shadow(0 0 4px rgba(56, 172, 231, 0.5));
}

.corner-tl {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 0.5rem;
}

.corner-tr {
  top: -2px;
  right: -2px;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 0.5rem;
}

.corner-bl {
  bottom: -2px;
  left: -2px;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 0.5rem;
}

.corner-br {
  bottom: -2px;
  right: -2px;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 0.5rem;
}

/* Pulsing scanner sweep line */
.hud-laser {
  position: absolute;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  box-shadow: 0 0 10px var(--primary);
  animation: laser-sweep 2.5s ease-in-out infinite;
}

@keyframes laser-sweep {
  0% {
    top: 5%;
  }
  50% {
    top: 95%;
  }
  100% {
    top: 5%;
  }
}

/* Results Dashboard styling */
.results-dashboard {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.results-title {
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--white);
}

.results-title i {
  color: var(--primary);
}

.results-card {
  border-radius: 1.25rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: all 0.3s ease;
}

/* Results Card Idle State */
.idle-state {
  background: rgba(65, 76, 80, 0.15);
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}

.idle-icon-wrap {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.idle-icon-wrap i {
  font-size: 1.75rem;
  color: #617378;
}

.animate-scanning {
  animation: slow-ping 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.idle-text {
  font-weight: 700;
  color: #a5a5a5;
  font-size: 1.05rem;
  letter-spacing: 0.5px;
}

.idle-desc {
  font-size: 0.8rem;
  color: #718388;
  max-width: 80%;
}

/* Results Card Success State */
.success-state {
  background: linear-gradient(
    135deg,
    rgba(46, 204, 113, 0.05) 0%,
    rgba(25, 36, 39, 0.6) 100%
  );
  border-color: rgba(46, 204, 113, 0.25);
}

.success-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid rgba(46, 204, 113, 0.15);
  padding-bottom: 0.85rem;
}

.success-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(46, 204, 113, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2ecc71;
  font-size: 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 0 15px rgba(46, 204, 113, 0.2);
}

.success-message h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2ecc71;
}

.success-message p {
  font-size: 0.8rem;
  color: #a5a5a5;
}

.results-table {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-bottom: 1.5rem;
}

.results-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.25);
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.row-label {
  font-size: 0.8rem;
  color: #a5a5a5;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.row-label i {
  color: var(--primary);
  font-size: 0.9rem;
}

.row-value {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--white);
}

.row-valueName {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--white);
}

.id-highlight {
  font-family: monospace;
  color: var(--primary);
  font-size: 1.1rem;
  letter-spacing: 0.5px;
}

.raw-data-row {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.raw-value {
  width: 100%;
}

.raw-value code {
  display: block;
  font-family: monospace;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.4rem 0.75rem;
  border-radius: 0.35rem;
  color: #a5d8ff;
  font-size: 0.85rem;
  word-break: break-all;
}

/* Reset / scan again action */
.btn-reset {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: #fff;
  border: none;
  padding: 0.8rem;
  border-radius: 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.25);
  transition: all 0.2s ease;
}

.btn-reset:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(46, 204, 113, 0.35);
}

.btn-reset:active {
  transform: translateY(0);
}

/* Pulse animation */
@keyframes slow-ping {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.95);
  }
}

.animate-pulse {
  animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 8px #2ecc71;
  }
  50% {
    opacity: 0.4;
    transform: scale(0.9);
    box-shadow: 0 0 2px #2ecc71;
  }
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease-out;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* State styling adjustments */
.loading-state {
  background: rgba(65, 76, 80, 0.15);
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.loading-spinner-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner {
  width: 40px;
  height: 40px;
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

.loading-text {
  font-weight: 600;
  color: #a5a5a5;
  font-size: 1rem;
}

.error-state {
  background: linear-gradient(
    135deg,
    rgba(231, 76, 60, 0.05) 0%,
    rgba(25, 36, 39, 0.6) 100%
  );
  border-color: rgba(231, 76, 60, 0.25);
  gap: 1.5rem;
}

.error-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(231, 76, 60, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e74c3c;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.error-message h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #e74c3c;
}

.error-message p {
  font-size: 0.8rem;
  color: #a5a5a5;
  margin-top: 0.25rem;
}

.warning-state {
  background: linear-gradient(
    135deg,
    rgba(230, 126, 34, 0.05) 0%,
    rgba(25, 36, 39, 0.6) 100%
  );
  border-color: rgba(230, 126, 34, 0.25);
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid rgba(230, 126, 34, 0.15);
  padding-bottom: 0.85rem;
}

.warning-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(230, 126, 34, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e67e22;
  font-size: 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 0 15px rgba(230, 126, 34, 0.2);
}

.warning-message h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #e67e22;
}

.warning-message p {
  font-size: 0.8rem;
  color: #a5a5a5;
}

.checkin-success-state {
  background: linear-gradient(
    135deg,
    rgba(46, 204, 113, 0.08) 0%,
    rgba(25, 36, 39, 0.6) 100%
  );
  border-color: rgba(46, 204, 113, 0.35);
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.action-buttons button {
  flex: 1;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: #a5a5a5 !important;
  box-shadow: none !important;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}

.btn-warning-action {
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%) !important;
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.25) !important;
}

.btn-warning-action:hover {
  box-shadow: 0 6px 16px rgba(230, 126, 34, 0.35) !important;
}

.btn-danger {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%) !important;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.25) !important;
}

.btn-danger:hover {
  box-shadow: 0 6px 16px rgba(231, 76, 60, 0.35) !important;
}
</style>
