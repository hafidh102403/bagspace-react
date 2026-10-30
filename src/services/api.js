const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost/bagspace-api"
).replace(/\/+$/, "");

// Membaca respons API dan memastikan format JSON valid
async function requestAPI(endpoint) {
  const url = `${API_URL}${endpoint}`;

  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    console.error("BagSpace Connection Error:", error);

    throw new Error(
      "Tidak dapat terhubung ke server. Pastikan Laragon dan Apache aktif."
    );
  }

  const rawText = await response.text();

  let result;

  try {
    result = JSON.parse(rawText);
  } catch {
    console.error("BagSpace API URL:", url);
    console.error("HTTP Status:", response.status);
    console.error("Respons server:", rawText.slice(0, 500));

    throw new Error(
      `Server mengembalikan respons bukan JSON (HTTP ${response.status}). Periksa URL API dan PHP.`
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || `Gagal mengambil data (HTTP ${response.status})`
    );
  }

  return result;
}

// ======================================
// API DATA LOKER
// ======================================

export async function getLockers() {
  const result = await requestAPI("/lockers.php");

  if (!Array.isArray(result.data)) {
    throw new Error("Format data loker tidak valid.");
  }

  return result.data;
}

// ======================================
// API STATISTIK PENGUNJUNG
// ======================================

export async function getVisitorStats(
  month,
  year,
  date = "Semua"
) {
  const params = new URLSearchParams({
    month: String(month),
    year: String(year),
    date: String(date),
  });

  const result = await requestAPI(
    `/visitor_stats.php?${params.toString()}`
  );

  return {
    total: Number(result.total || 0),
    categories: result.categories || {},
  };
}
// ======================================
// API CATAT KUNJUNGAN MAHASISWA
// ======================================

export async function recordVisitor(data) {
  const url = `${API_URL}/record_visitor.php`;

  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        nim: data.nim,
        nama: data.nama,
        prodi: data.prodi,
      }),
    });
  } catch (error) {
    console.error("BagSpace Visitor Error:", error);
    throw new Error("Gagal terhubung ke server kunjungan.");
  }

  const rawText = await response.text();

  let result;

  try {
    result = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Respons pencatatan kunjungan tidak valid (HTTP ${response.status}).`
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Gagal mencatat kunjungan."
    );
  }

  return result;
}