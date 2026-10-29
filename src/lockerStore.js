const STORAGE_KEY = "bagspace_locker_demo_v1";

export const ZONES = [
  { name: "Kuning", start: 1, end: 28, color: "#eab308" },
  { name: "Hijau", start: 29, end: 56, color: "#22c55e" },
  { name: "Merah", start: 57, end: 75, color: "#ef4444" },
];

export function zoneOfLocker(number) {
  const num = Number(number);

  const zone = ZONES.find(
    (item) => num >= item.start && num <= item.end
  );

  return zone ? zone.name : null;
}

function createDefaultLockers() {
  return Array.from({ length: 75 }, (_, index) => {
    const number = index + 1;

    return {
      id: number,
      number,
      zone: zoneOfLocker(number),
      status: "tersedia",
    };
  });
}

export function readLockers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved !== null) {
      const lockers = JSON.parse(saved);

      if (Array.isArray(lockers)) {
        return lockers;
      }
    }
  } catch (error) {
    console.error("Gagal membaca data loker:", error);
  }

  return createDefaultLockers();
}

export function saveLockers(lockers) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(lockers)
    );

    window.dispatchEvent(
      new Event("bagspace-lockers-updated")
    );

    return true;
  } catch (error) {
    console.error("Gagal menyimpan data loker:", error);
    return false;
  }
}
