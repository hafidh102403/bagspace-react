const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost/bagspace-api";

export async function getLockers() {
  try {
    const response = await fetch(`${API_URL}/lockers.php`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Gagal mengambil data");
    }

    return result.data;
  } catch (error) {
    console.error("BagSpace API Error:", error);
    throw error;
  }
}