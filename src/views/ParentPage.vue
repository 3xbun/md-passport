<template>
  <div class="monitor-container">
    <!-- Header Block -->
    <div class="monitor-header">
      <div class="header-top-actions">
        <div class="header-badge">
          <i class="fa-solid fa-list-check"></i> MONITORING PORTAL
          <span
            class="live-pulse"
            :class="{ 'is-refreshing': silentLoading }"
            title="ระบบเชื่อมต่อแบบเรียลไทม์"
          ></span>
        </div>
        <button @click="goToScanner" class="scan-nav-btn">
          <i class="fa-solid fa-qrcode"></i> ไปหน้าสแกน QR
        </button>
      </div>
      <h1 class="monitor-title">ข้อมูลการเช็คอินผู้ปกครอง</h1>
      <p class="monitor-subtitle">
        แสดงข้อมูลการเช็คอินและสถานะของผู้ปกครองนักเรียนทั้งหมดแบบเรียลไทม์
      </p>
    </div>

    <!-- Live Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrap bg-primary-light">
          <i class="fa-solid fa-duotone fa-users"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ Parents.length }}</span>
          <span class="stat-label">ผู้ปกครองทั้งหมด</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap bg-success-light">
          <i class="fa-solid fa-duotone fa-circle-check text-success"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value text-success glow-success">{{
            checkedInCount
          }}</span>
          <span class="stat-label"
            >เช็คอินแล้ว ({{ checkedInPercentage }}%)</span
          >
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrap bg-warning-light">
          <i class="fa-solid fa-duotone fa-clock text-warning"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value text-warning glow-warning">{{
            pendingCount
          }}</span>
          <span class="stat-label">ยังไม่ได้เช็คอิน</span>
        </div>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="controls-row">
      <!-- Search Input -->
      <div class="search-wrap">
        <i class="fa-solid fa-duotone fa-magnifying-glass search-icon"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหาผู้ปกครอง, นักเรียน, ID..."
          class="search-input"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="clear-btn"
          aria-label="Clear Search"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Tab Filters -->
      <div class="filter-tabs">
        <button
          @click="statusFilter = 'all'"
          :class="['tab-btn', { active: statusFilter === 'all' }]"
        >
          ทั้งหมด
        </button>
        <button
          @click="statusFilter = 'checked'"
          :class="['tab-btn', { active: statusFilter === 'checked' }]"
        >
          เช็คอินแล้ว
        </button>
        <button
          @click="statusFilter = 'pending'"
          :class="['tab-btn', { active: statusFilter === 'pending' }]"
        >
          ยังไม่ได้เช็คอิน
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="list-state-card">
      <div class="spinner"></div>
      <p class="state-text">กำลังโหลดข้อมูลผู้ปกครอง...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredParents.length === 0"
      class="list-state-card empty-state"
    >
      <div class="empty-icon-wrap">
        <i class="fa-solid fa-duotone fa-folder-open"></i>
      </div>
      <p class="state-text">ไม่พบข้อมูลผู้ปกครอง</p>
      <span class="state-desc"
        >ไม่มีข้อมูลตรงกับคำค้นหาหรือตัวกรองที่เลือก</span
      >
      <button @click="clearFilters" class="btn-reset-filters">
        ล้างตัวกรองทั้งหมด
      </button>
    </div>

    <!-- Parents Grid List -->
    <div v-else class="parents-list">
      <div
        v-for="parent in paginatedParents"
        :key="parent.id"
        class="parent-row"
        :class="{ 'checked-border': parent.fields.Checked }"
      >
        <!-- Main Info -->
        <div class="parent-main-info">
          <div class="parent-title-line">
            <h3 class="parent-name">{{ parent.fields.FullName }}</h3>
            <span
              :class="[
                'relation-badge',
                getRelationClass(parent.fields.Relationship),
              ]"
            >
              {{ parent.fields.Relationship || "ผู้ปกครอง" }}
            </span>
          </div>

          <!-- Associated Student details if present -->
          <div class="student-info-tag" v-if="parent.fields.Students">
            <i class="fa-solid fa-user-graduate"></i>
            <span class="student-label">นักเรียน:</span>
            <span class="student-id">
              {{ parent.fields.studentFullName }}
            </span>
          </div>
          <div class="student-info-tag no-student" v-else>
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>ไม่พบข้อมูลนักเรียนผูกพัน</span>
          </div>
        </div>

        <!-- Interactive Check-In Toggle / Badge -->
        <div class="action-column">
          <button
            @click="toggleCheckIn(parent)"
            :disabled="parent.isUpdating"
            :class="[
              'status-badge-btn',
              { 'is-checked': parent.fields.Checked },
            ]"
            :title="
              parent.fields.Checked
                ? 'คลิกเพื่อยกเลิกการเช็คอิน'
                : 'คลิกเพื่อเช็คอินผู้ปกครอง'
            "
          >
            <span v-if="parent.isUpdating" class="inline-loader">
              <i class="fa-solid fa-circle-notch fa-spin"></i>
            </span>
            <span v-else class="badge-content">
              <i
                :class="
                  parent.fields.Checked
                    ? 'fa-solid fa-circle-check'
                    : 'fa-regular fa-circle'
                "
              ></i>
              {{ parent.fields.Checked ? "เช็คอินแล้ว" : "ยังไม่ได้เช็คอิน" }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination Footer -->
    <div v-if="filteredParents.length > 0" class="pagination-footer">
      <div class="pagination-info">
        แสดง {{ pageStartIndex }} - {{ pageEndIndex }} <br />
        จากทั้งหมด {{ filteredParents.length }} รายการ
      </div>

      <div class="pagination-controls">
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="page-btn nav-btn"
          aria-label="Previous Page"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>

        <span class="page-indicator">
          หน้า {{ currentPage }} / {{ totalPages }}
        </span>

        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="page-btn nav-btn"
          aria-label="Next Page"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <div class="page-size-selector">
        <span class="size-label">แสดงหน้าละ:</span>
        <select v-model="itemsPerPage" class="size-select">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { onMounted, onUnmounted, ref, computed, watch } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const Parents = ref([]);

const goToScanner = () => {
  router.push("/passport/scan");
};
const isLoading = ref(true);
const silentLoading = ref(false);
const searchQuery = ref("");
const statusFilter = ref("all");

// Pagination state
const itemsPerPage = ref(10);
const currentPage = ref(1);

// Reset page on filter or page-size changes
watch([searchQuery, statusFilter, itemsPerPage], () => {
  currentPage.value = 1;
});

const checkedInCount = computed(() => {
  return Parents.value.filter((p) => p.fields.Checked).length;
});

const pendingCount = computed(() => {
  return Parents.value.filter((p) => !p.fields.Checked).length;
});

const checkedInPercentage = computed(() => {
  if (Parents.value.length === 0) return 0;
  return Math.round((checkedInCount.value / Parents.value.length) * 100);
});

const filteredParents = computed(() => {
  return Parents.value
    .filter((p) => {
      // Status filter
      if (statusFilter.value === "checked" && !p.fields.Checked) return false;
      if (statusFilter.value === "pending" && p.fields.Checked) return false;

      // Search query filter
      if (!searchQuery.value) return true;
      const q = searchQuery.value.toLowerCase().trim();
      const parentName = p.fields.FullName?.toLowerCase() || "";
      const relationship = p.fields.Relationship?.toLowerCase() || "";
      const studentId =
        p.fields.Students?.fields?.StudentID?.toLowerCase() || "";
      const studentName = p.fields.studentFullName?.toLowerCase() || "";

      return (
        parentName.includes(q) ||
        relationship.includes(q) ||
        studentId.includes(q) ||
        studentName.includes(q)
      );
    })
    .sort((a, b) => {
      const nameA = a.fields?.FullName || "";
      const nameB = b.fields?.FullName || "";
      return nameA.localeCompare(nameB, "th");
    });
});

// Pagination computed properties and functions
const totalPages = computed(() => {
  return Math.ceil(filteredParents.value.length / itemsPerPage.value) || 1;
});

const paginatedParents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredParents.value.slice(start, end);
});

const pageStartIndex = computed(() => {
  if (filteredParents.value.length === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});

const pageEndIndex = computed(() => {
  const end = currentPage.value * itemsPerPage.value;
  return end > filteredParents.value.length
    ? filteredParents.value.length
    : end;
});

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const getRelationIcon = (rel) => {
  const r = rel?.toLowerCase() || "";
  if (r.includes("พ่อ") || r.includes("father") || r.includes("dad")) {
    return "fa-solid fa-user-tie";
  }
  if (r.includes("แม่") || r.includes("mother") || r.includes("mom")) {
    return "fa-solid fa-user-dress";
  }
  return "fa-solid fa-user-shield"; // Guardian / Other
};

const getRelationClass = (rel) => {
  const r = rel?.toLowerCase() || "";
  if (r.includes("พ่อ") || r.includes("father") || r.includes("dad")) {
    return "relation-father";
  }
  if (r.includes("แม่") || r.includes("mother") || r.includes("mom")) {
    return "relation-mother";
  }
  return "relation-guardian";
};

const clearFilters = () => {
  searchQuery.value = "";
  statusFilter.value = "all";
};

const toggleCheckIn = (parentRecord) => {
  const newStatus = !parentRecord.fields.Checked;
  parentRecord.isUpdating = true;

  axios
    .patch(
      "https://ndb.3xbun.com/api/v3/data/pynnt7fm0gsgwlq/mtlg3m3ctl8sx6l/records",
      {
        id: parentRecord.id,
        fields: {
          Checked: newStatus,
        },
      },
      {
        headers: { "xc-token": "wU0uyFeODMGzOqqkIUethPYhnZn_FqXXgifuiXWu" },
      },
    )
    .then(() => {
      parentRecord.fields.Checked = newStatus;
      parentRecord.isUpdating = false;
    })
    .catch((err) => {
      console.error(err);
      parentRecord.isUpdating = false;
    });
};

const isFetching = ref(false);

const fetchParentsData = async (silent = false) => {
  if (isFetching.value) return;
  isFetching.value = true;

  if (!silent) {
    isLoading.value = true;
  } else {
    silentLoading.value = true;
  }

  let allRecords = [];
  // Align with NocoDB's default page limit (25) to avoid offset mismatches on next pages
  let nextUrl =
    "https://ndb.3xbun.com/api/v3/data/pynnt7fm0gsgwlq/mtlg3m3ctl8sx6l/records";

  try {
    while (nextUrl) {
      const res = await axios.get(nextUrl, {
        headers: {
          "xc-token": "wU0uyFeODMGzOqqkIUethPYhnZn_FqXXgifuiXWu",
        },
      });
      if (res.data && res.data.records) {
        allRecords = [...allRecords, ...res.data.records];
      }
      nextUrl = res.data.next;
    }

    // Deduplicate records by unique record id to be 100% robust
    const uniqueRecordsMap = new Map();
    allRecords.forEach((record) => {
      if (record && record.id) {
        uniqueRecordsMap.set(record.id, record);
      }
    });
    const uniqueRecords = Array.from(uniqueRecordsMap.values());

    // Merge new records safely to avoid disrupting inline updating state
    const mergedParents = uniqueRecords.map((record) => {
      const existingParent = Parents.value.find((p) => p.id === record.id);
      return {
        ...record,
        isUpdating: existingParent ? existingParent.isUpdating : false,
        fields: {
          ...record.fields,
          Checked:
            existingParent && existingParent.isUpdating
              ? existingParent.fields.Checked
              : record.fields.Checked,
        },
      };
    });

    Parents.value = mergedParents;
  } catch (err) {
    console.error("Error fetching parents:", err);
  } finally {
    isFetching.value = false;
    if (!silent) {
      isLoading.value = false;
    } else {
      silentLoading.value = false;
    }
  }
};

let pollInterval = null;

onMounted(async () => {
  await fetchParentsData(false);

  // Poll in the background silently every 5 seconds for almost real-time updates
  pollInterval = setInterval(() => {
    fetchParentsData(true);
  }, 5000);
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
</script>

<style lang="css" scoped>
.monitor-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem 0 3rem 0;
}

/* Header style */
.monitor-header {
  margin-bottom: 0.5rem;
}

.header-top-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  width: 100%;
}

.scan-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, var(--primary) 0%, #1d88c4 100%);
  border: none;
  padding: 0.45rem 1rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #192427;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(56, 172, 231, 0.25);
  transition: all 0.2s ease;
}

.scan-nav-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(56, 172, 231, 0.4);
}

.scan-nav-btn:active {
  transform: translateY(0);
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
}

.monitor-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--white);
  letter-spacing: 0.5px;
  text-align: center;
}

.monitor-subtitle {
  font-size: 0.9rem;
  color: #a5a5a5;
  margin-top: 0.35rem;
  text-align: center;
}

/* Stats Row */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(
    135deg,
    rgba(65, 76, 80, 0.15) 0%,
    rgba(25, 36, 39, 0.35) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 1.25rem;
  border-radius: 1.25rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.bg-primary-light {
  background: rgba(56, 172, 231, 0.12);
  color: var(--primary);
  border: 1px solid rgba(56, 172, 231, 0.2);
}

.bg-success-light {
  background: rgba(46, 204, 113, 0.12);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.2);
}

.bg-warning-light {
  background: rgba(230, 126, 34, 0.12);
  color: #e67e22;
  border: 1px solid rgba(230, 126, 34, 0.2);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--white);
  line-height: 1;
}

.text-success {
  color: #2ecc71;
}
.text-warning {
  color: #e67e22;
}

.glow-success {
  text-shadow: 0 0 10px rgba(46, 204, 113, 0.3);
}
.glow-warning {
  text-shadow: 0 0 10px rgba(230, 126, 34, 0.3);
}

.stat-label {
  font-size: 0.75rem;
  color: #8a999d;
  font-weight: 600;
}

/* Search and Filters Controls */
.controls-row {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 1.1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #617378;
  font-size: 0.9rem;
}

.search-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0.75rem 2.5rem 0.75rem 2.6rem;
  border-radius: 1rem;
  color: var(--white);
  font-size: 0.9rem;
  font-family: inherit;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  background: rgba(0, 0, 0, 0.35);
  box-shadow: 0 0 12px rgba(56, 172, 231, 0.15);
}

.clear-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #617378;
  cursor: pointer;
  font-size: 0.95rem;
}

.clear-btn:hover {
  color: var(--white);
}

.filter-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.3rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.tab-btn {
  background: none;
  border: none;
  color: #8a999d;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.tab-btn:hover {
  color: var(--white);
}

.tab-btn.active {
  background: rgba(56, 172, 231, 0.12);
  color: var(--primary);
  border: 1px solid rgba(56, 172, 231, 0.1);
}

/* Loading and Empty Card styling */
.list-state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(65, 76, 80, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 4rem 2rem;
  border-radius: 1.5rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-height: 250px;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(56, 172, 231, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.25rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.state-text {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--white);
  margin-bottom: 0.25rem;
}

.empty-state {
  gap: 0.5rem;
}

.empty-icon-wrap {
  font-size: 2.5rem;
  color: #617378;
  margin-bottom: 0.5rem;
}

.state-desc {
  font-size: 0.8rem;
  color: #8a999d;
  max-width: 80%;
  margin-bottom: 1.25rem;
}

.btn-reset-filters {
  background: rgba(56, 172, 231, 0.1);
  border: 1px solid rgba(56, 172, 231, 0.2);
  color: var(--primary);
  padding: 0.5rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-reset-filters:hover {
  background: var(--primary);
  color: #192427;
}

/* Parent Grid List styling */
.parents-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.parent-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: linear-gradient(
    135deg,
    rgba(65, 76, 80, 0.12) 0%,
    rgba(25, 36, 39, 0.3) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 1.1rem 1.5rem;
  border-radius: 1.25rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.parent-row:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    135deg,
    rgba(65, 76, 80, 0.18) 0%,
    rgba(25, 36, 39, 0.45) 100%
  );
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.checked-border {
  border-color: rgba(46, 204, 113, 0.2) !important;
  background: linear-gradient(
    135deg,
    rgba(46, 204, 113, 0.02) 0%,
    rgba(25, 36, 39, 0.3) 100%
  ) !important;
}

.checked-border:hover {
  border-color: rgba(46, 204, 113, 0.35) !important;
}

/* Relation specific avatars */
.parent-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.relation-father {
  background: rgba(56, 172, 231, 0.1);
  color: #38ace7;
  border: 1px solid rgba(56, 172, 231, 0.15);
}

.relation-mother {
  background: rgba(233, 30, 99, 0.08);
  color: #ff4081;
  border: 1px solid rgba(233, 30, 99, 0.12);
}

.relation-guardian {
  background: rgba(155, 89, 182, 0.08);
  color: #9b59b6;
  border: 1px solid rgba(155, 89, 182, 0.12);
}

/* Info texts */
.parent-main-info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.parent-title-line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.parent-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--white);
  letter-spacing: 0.25px;
}

.relation-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;
}

.student-info-tag {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #8a999d;
  background: rgba(0, 0, 0, 0.18);
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, 0.01);
}

.student-info-tag i {
  font-size: 0.8rem;
  color: var(--primary);
}

.student-label {
  font-weight: 600;
  color: #617378;
}

.student-id {
  font-family: monospace;
  font-weight: 700;
  color: var(--primary);
}

.student-divider {
  color: #414c50;
  font-size: 0.7rem;
}

.student-name-val {
  font-weight: 600;
}

.no-student {
  background: rgba(230, 126, 34, 0.05);
  border-color: rgba(230, 126, 34, 0.1);
  color: #e67e22;
}

.no-student i {
  color: #e67e22;
}

/* Status Button Badge */
.action-column {
  display: flex;
  align-items: center;
}

.status-badge-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0.45rem 0.9rem;
  border-radius: 2rem;
  color: #8a999d;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 125px;
}

.status-badge-btn:hover {
  background: rgba(56, 172, 231, 0.05);
  border-color: rgba(56, 172, 231, 0.25);
  color: var(--primary);
  transform: scale(1.02);
}

.status-badge-btn.is-checked {
  background: rgba(46, 204, 113, 0.08);
  border-color: rgba(46, 204, 113, 0.25);
  color: #2ecc71;
  box-shadow: 0 0 10px rgba(46, 204, 113, 0.05);
}

.status-badge-btn.is-checked:hover {
  background: rgba(231, 76, 60, 0.08);
  border-color: rgba(231, 76, 60, 0.25);
  color: #e74c3c;
}

.status-badge-btn.is-checked:hover .badge-content i::before {
  content: "\f057"; /* Change check icon to circle-xmark on hover */
  font-family: "Font Awesome 6 Free";
}

.status-badge-btn.is-checked:hover .badge-content {
  color: #e74c3c;
}

.badge-content {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.badge-content i {
  font-size: 0.85rem;
}

.inline-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .header-top-actions {
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .parent-row {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1.25rem;
  }

  .parent-avatar {
    align-self: flex-start;
  }

  .action-column {
    justify-content: flex-end;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    padding-top: 0.75rem;
    margin-top: 0.25rem;
  }

  .status-badge-btn {
    width: 100%;
    min-width: 0;
  }

  .controls-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrap {
    min-width: 0;
  }

  .filter-tabs {
    justify-content: center;
  }

  .tab-btn {
    flex: 1;
    text-align: center;
    padding: 0.5rem 0;
  }
}

/* Pagination Styling */
.pagination-footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  background: linear-gradient(
    135deg,
    rgba(65, 76, 80, 0.12) 0%,
    rgba(25, 36, 39, 0.3) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 1rem 1.5rem;
  border-radius: 1.25rem;
  margin-top: 0.5rem;
}

.pagination-info {
  font-size: 0.85rem;
  color: #8a999d;
  font-weight: 500;
  text-align: left;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.page-btn {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #8a999d;
  width: 36px;
  height: 36px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(56, 172, 231, 0.05);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--white);
  width: 110px; /* Locked width to prevent layout shifting when page digits increase (e.g., 1 to 10 or 100) */
  text-align: center;
  display: inline-block;
  user-select: none;
}

.page-size-selector {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.size-label {
  font-size: 0.82rem;
  color: #8a999d;
}

.size-select {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--white);
  padding: 0.35rem 1.5rem 0.35rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.82rem;
  font-weight: 600;
  width: 75px; /* Locked width to prevent layout shifting on selection */
  cursor: pointer;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a999d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 0.85rem;
}

.size-select:focus {
  border-color: var(--primary);
}

@media (max-width: 600px) {
  .pagination-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.25rem 1rem;
    gap: 0.85rem;
  }
}

/* Real-time Indicator Pulse Styling */
.live-pulse {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #2ecc71;
  margin-left: 0.5rem;
  position: relative;
  box-shadow: 0 0 8px #2ecc71;
  transition: all 0.3s ease;
}

.live-pulse::after {
  content: "";
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 2px solid rgba(46, 204, 113, 0.4);
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  opacity: 1;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  80%,
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

.live-pulse.is-refreshing {
  background-color: var(--primary);
  box-shadow: 0 0 8px var(--primary);
}

.live-pulse.is-refreshing::after {
  border-color: rgba(56, 172, 231, 0.4);
}
</style>
