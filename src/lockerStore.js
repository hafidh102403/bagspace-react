
export const LOCKER_EVENT = "bagspace-lockers-updated";
export const HISTORY_EVENT = "bagspace-locker-history-updated";

const STORAGE_KEY = "bagspace_locker_demo_v1";
const HISTORY_KEY = "bagspace_locker_history_v1";

export const ZONES = [
  { name: "Kuning", start: 1, end: 28, color: "#eab308" },
  { name: "Hijau", start: 29, end: 56, color: "#22c55e" },
  { name: "Merah", start: 57, end: 75, color: "#ef4444" },
];

export function zoneOfLocker(number) {
  const num = Number(number);
  return ZONES.find((zone) => num >= zone.start && num <= zone.end)?.name || null;
}

function createDefaultLockers() {
  return Array.from({ length: 75 }, (_, index) => {
    const number = index + 1;

    return {
      id: number,
      number,
      zone: zoneOfLocker(number),
      status: "tersedia",
      borrower: "",
      userId: "",
      borrowedAt: null,
      returnedAt: null,
    };
  });
}

export function readLockers() {
  const defaults = createDefaultLockers();

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

    if (!Array.isArray(saved)) return defaults;

    const byNumber = new Map(
      saved
        .filter((item) => Number.isInteger(Number(item?.number)))
        .map((item) => [Number(item.number), item])
    );

    return defaults.map((locker) => {
      const savedLocker = byNumber.get(locker.number);

      if (!savedLocker) return locker;

      return {
        ...locker,
        ...savedLocker,
        id: locker.number,
        number: locker.number,
        zone: locker.zone,
        status: ["tersedia", "dipinjam", "rusak"].includes(savedLocker.status)
          ? savedLocker.status
          : "tersedia",
      };
    });
  } catch (error) {
    console.error("Gagal membaca data loker:", error);
    return defaults;
  }
}

export function saveLockers(lockers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lockers));

    window.dispatchEvent(new Event(LOCKER_EVENT));

    return true;
  } catch (error) {
    console.error("Gagal menyimpan data loker:", error);
    return false;
  }
}

export function readLockerHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error("Gagal membaca riwayat loker:", error);
    return [];
  }
}

export function addLockerHistory(entry) {
  try {
    const history = readLockerHistory();

    const newEntry = {
      id: globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...entry,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([newEntry, ...history])
    );

    window.dispatchEvent(new Event(HISTORY_EVENT));

    return newEntry;
  } catch (error) {
    console.error("Gagal menyimpan riwayat loker:", error);
    return null;
  }
}

export function borrowLocker(number, borrower, userId = "") {
  const lockerNumber = Number(number);
  const name = String(borrower || "").trim();

  if (!name) {
    return { success: false, message: "Nama peminjam wajib diisi." };
  }

  const lockers = readLockers();
  const target = lockers.find((locker) => locker.number === lockerNumber);

  if (!target) {
    return { success: false, message: "Loker tidak ditemukan." };
  }

  if (target.status !== "tersedia") {
    return { success: false, message: "Loker tidak tersedia." };
  }

  const now = new Date().toISOString();

  const updated = lockers.map((locker) =>
    locker.number === lockerNumber
      ? {
        ...locker,
        status: "dipinjam",
        borrower: name,
        userId: String(userId || ""),
        borrowedAt: now,
        returnedAt: null,
      }
      : locker
  );

  if (!saveLockers(updated)) {
    return { success: false, message: "Gagal menyimpan peminjaman." };
  }

  addLockerHistory({
    number: lockerNumber,
    lockerNumber,
    zone: zoneOfLocker(lockerNumber),
    action: "pinjam",
    status: "dipinjam",
    borrower: name,
    userId: String(userId || ""),
    borrowedAt: now,
    timestamp: now,
  });

  return {
    success: true,
    message: `Loker ${lockerNumber} berhasil dipinjam.`,
  };
}

export function returnLocker(number, userId = "") {
  const lockerNumber = Number(number);
  const lockers = readLockers();
  const target = lockers.find((locker) => locker.number === lockerNumber);

  if (!target) {
    return { success: false, message: "Loker tidak ditemukan." };
  }

  if (target.status !== "dipinjam") {
    return { success: false, message: "Loker tidak sedang dipinjam." };
  }

  const now = new Date().toISOString();

  const updated = lockers.map((locker) =>
    locker.number === lockerNumber
      ? {
        ...locker,
        status: "tersedia",
        borrower: "",
        userId: "",
        borrowedAt: null,
        returnedAt: now,
      }
      : locker
  );

  if (!saveLockers(updated)) {
    return { success: false, message: "Gagal menyimpan pengembalian." };
  }

  addLockerHistory({
    number: lockerNumber,
    lockerNumber,
    zone: zoneOfLocker(lockerNumber),
    action: "kembali",
    status: "tersedia",
    borrower: target.borrower || "",
    userId: target.userId || String(userId || ""),
    borrowedAt: target.borrowedAt || null,
    returnedAt: now,
    timestamp: now,
  });

  return {
    success: true,
    message: `Loker ${lockerNumber} berhasil dikembalikan.`,
  };
}
