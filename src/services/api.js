const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://bagspace-api.test"
).replace(/\/+$/, "");

async function requestAPI(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Respons server bukan JSON yang valid.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || "Terjadi kesalahan saat menghubungi server."
    );
  }

  return result;
}

export async function login(data) {
  return requestAPI("/login.php", {
    method: "POST",
    body: JSON.stringify({
      identifier: data?.identifier || "",
      password: data?.password || "",
    }),
  });
}

export async function recordVisitor(data) {
  const nimNip = data?.nim_nip || data?.nim || "";
  const email = data?.email || "";

  if (!nimNip && !email) {
    throw new Error("NIM/NIP atau email pengguna tidak tersedia.");
  }

  return requestAPI("/record_visitor.php", {
    method: "POST",
    body: JSON.stringify({
      nim_nip: nimNip,
      email,
    }),
  });
}

export async function getVisitorStats(month, year, date = "Semua") {
  const params = new URLSearchParams();

  if (month) params.append("month", month);
  if (year) params.append("year", year);
  if (date && date !== "Semua") params.append("date", date);

  return requestAPI(`/visitor_stats.php?${params.toString()}`);
}

export function getApiUrl() {
  return API_URL;
}
// =====================================================
// PROFILE API
// =====================================================

export async function getProfile(token) {
  return requestAPI("/profile.php", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateProfile(token, data) {
  return requestAPI("/profile.php", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: data?.name || "",
      oldPassword: data?.oldPassword || "",
      newPassword: data?.newPassword || "",
    }),
  });
}

// =====================================================
// LOCKER API
// =====================================================

export async function getLockers(token) {
  if (!token) throw new Error("Token login tidak tersedia.");

  const result = await requestAPI("/lockers.php", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return result.data || [];
}

export async function borrowLockerAPI(token, number) {
  if (!token) throw new Error("Token login tidak tersedia.");

  return requestAPI("/borrow_locker.php", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ number }),
  });
}

export async function returnLockerAPI(token, number) {
  if (!token) throw new Error("Token login tidak tersedia.");

  return requestAPI("/return_locker.php", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ number }),
  });
}
