<template>
  <Transition name="fade">
    <div v-if="isOpen" class="modal-backdrop" @click.self="close">
      <div class="modal-content" role="dialog" aria-modal="true">
        <!-- Close Button -->
        <button class="close-btn" @click="close" aria-label="Close modal">
          &times;
        </button>

        <!-- Header -->
        <div class="modal-header">
          <h3 class="modal-title">{{ title || "QR Code" }}</h3>
          <p class="modal-subtitle" v-if="subtitle">{{ subtitle }}</p>
        </div>

        <!-- QR Code Container -->
        <div class="qr-container">
          <QRCodeVue3
            :width="250"
            :height="250"
            :value="encodedValue"
            :qrOptions="{
              typeNumber: 0,
              mode: 'Byte',
              errorCorrectionLevel: 'H',
            }"
            :dotsOptions="{
              type: 'rounded',
              color: '#192427',
            }"
            :backgroundOptions="{
              color: '#ffffff',
            }"
            :cornersSquareOptions="{
              type: 'extra-rounded',
              color: '#192427',
            }"
            :cornersDotOptions="{
              type: 'dot',
              color: '#38ace7',
            }"
            class="qrcode-component"
          />
        </div>

        <!-- Value text / instruction -->
        <!-- <div class="qr-value-display">
          <code>{{ value }}</code>
        </div> -->

        <!-- Actions -->
        <div class="modal-footer">
          <button class="btn-primary" @click="close">ปิด</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from "vue";
import QRCodeVue3 from "qrcode-vue3";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: "QR Code",
  },
  subtitle: {
    type: String,
    default: "",
  },
});

// Convert UTF-8 strings (such as Thai) to a binary format so the QR generator
// encodes them correctly as UTF-8 bytes instead of defaulting to Latin-1 (ISO-8859-1).
const encodedValue = computed(() => {
  if (!props.value) return "";
  try {
    if (typeof TextEncoder !== "undefined") {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(props.value);
      let binary = "";
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return binary;
    }
    return unescape(encodeURIComponent(props.value));
  } catch (e) {
    console.error("UTF-8 encoding error in QRCodeModal:", e);
    return props.value;
  }
});

const emit = defineEmits(["close"]);

const close = () => {
  emit("close");
};

// Handle Escape key press to close modal
const handleKeyDown = (e) => {
  if (e.key === "Escape" && props.isOpen) {
    close();
  }
};

// Prevent body scroll when modal is open
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    }
  },
);

onMounted(() => {
  if (props.isOpen) {
    window.addEventListener("keydown", handleKeyDown);
  }
});

onUnmounted(() => {
  document.body.style.overflow = "";
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
/* Modal Backdrop Overlay */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(10, 15, 17, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* Modal Box */
.modal-content {
  position: relative;
  background: #1e2b2f;
  border: 1px solid rgba(56, 172, 231, 0.25);
  border-radius: 1.5rem;
  padding: 2.5rem 2rem 2rem 2rem;
  width: 90%;
  max-width: 420px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.6),
    0 0 25px rgba(56, 172, 231, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: modal-zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Close Button */
.close-btn {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  width: 2.25rem;
  height: 2.25rem;
  line-height: 2rem;
  border-radius: 50%;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(231, 76, 60, 0.2);
  color: #ff6b6b;
  transform: rotate(90deg);
}

/* Header styling */
.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;
  width: 100%;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: #38ace7;
  margin-top: 0.35rem;
  font-weight: 500;
}

/* QR Code Display Card */
.qr-container {
  background: #ffffff;
  padding: 1rem;
  border-radius: 1.25rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.25rem;
  transition: transform 0.3s ease;
}

.qr-container:hover {
  transform: scale(1.02);
}

.qrcode-component {
  display: block;
  max-width: 100%;
}

/* QR Text Representation */
.qr-value-display {
  background: rgba(0, 0, 0, 0.25);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 1.75rem;
  max-width: 100%;
  overflow-x: auto;
}

.qr-value-display code {
  font-family: monospace;
  font-size: 0.85rem;
  color: #a5d8ff;
  word-break: break-all;
}

/* Action button inside footer */
.modal-footer {
  width: 100%;
}

.btn-primary {
  width: 100%;
  background: linear-gradient(135deg, #38ace7 0%, #2087ba 100%);
  color: #fff;
  border: none;
  padding: 0.85rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(56, 172, 231, 0.3);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(56, 172, 231, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Fade animation for Backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Zoom animation for Modal Card */
@keyframes modal-zoom-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
