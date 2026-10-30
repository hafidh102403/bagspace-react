// ============================================
// BAGSPACE - STATISTIK PENGUNJUNG LOKAL
// Dihitung dari riwayat peminjaman loker
// ============================================

export const VISITOR_HISTORY_KEY =
  "bagspace_locker_history_v1";

export const VISITOR_UPDATE_EVENT =
  "bagspace-visitors-updated";

const PRODI_LIST = [
  "MLIE",
  "MPIE",
  "PIWAR",
  "Dosen/Tendik",
];

export function normalizeProdi(value) {
  const prodi = String(value || "").trim().toUpperCase();

  if (prodi === "MLIE") return "MLIE";
  if (prodi === "MPIE") return "MPIE";
  if (prodi === "PIWAR") return "PIWAR";

  if (
    prodi === "DOSEN" ||
    prodi === "TENDIK" ||
    prodi === "DOSEN/TENDIK"
  ) {
    return "Dosen/Tendik";
  }

  return "";
}

export function getJakartaDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function getVisitorHistory() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(VISITOR_HISTORY_KEY) || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error(
      "Gagal membaca riwayat pengunjung:",
      error
    );

    return [];
  }
}

export function calculateVisitorStats(
  month,
  year,
  dateFilter = "Semua"
) {
  const categories = {
    MLIE: 0,
    MPIE: 0,
    PIWAR: 0,
    "Dosen/Tendik": 0,
  };

  const history = getVisitorHistory();
  const today = getJakartaDate(new Date());

  const todayDate = new Date(
    `${today}T12:00:00+07:00`
  );

  const weekday = todayDate.getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;

  const mondayDate = new Date(todayDate);
  mondayDate.setUTCDate(
    mondayDate.getUTCDate() - daysSinceMonday
  );

  const monday = getJakartaDate(mondayDate);

  const counted = new Set();

  for (const item of history) {
    if (item.action !== "pinjam") continue;

    const timestamp =
      item.borrowedAt ||
      item.timestamp ||
      item.createdAt;

    if (!timestamp) continue;

    const visitDate = getJakartaDate(timestamp);

    if (!visitDate) continue;

    const [visitYear, visitMonth] = visitDate
      .split("-")
      .map(Number);

    if (visitMonth !== Number(month)) continue;
    if (visitYear !== Number(year)) continue;

    if (
      dateFilter === "Hari ini" &&
      visitDate !== today
    ) {
      continue;
    }

    if (
      dateFilter === "Minggu ini" &&
      (visitDate < monday || visitDate > today)
    ) {
      continue;
    }

    const prodi = normalizeProdi(
      item.prodi || item.borrowerProdi
    );

    if (!PRODI_LIST.includes(prodi)) continue;

    const nim = String(item.userId || "").trim();

    if (!nim) continue;

    // Mahasiswa yang sama dihitung sekali per hari
    const uniqueKey = `${nim}-${visitDate}`;

    if (counted.has(uniqueKey)) continue;

    counted.add(uniqueKey);
    categories[prodi] += 1;
  }

  return {
    total: Object.values(categories).reduce(
      (sum, value) => sum + value,
      0
    ),
    categories,
  };
}

export function notifyVisitorUpdate() {
  window.dispatchEvent(
    new Event(VISITOR_UPDATE_EVENT)
  );
}