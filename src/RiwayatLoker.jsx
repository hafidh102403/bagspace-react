
import React, { useEffect, useMemo, useState } from "react";
import {
  History, Search, Download, RefreshCw, CalendarDays,
  LockKeyhole, RotateCcw, ChevronLeft, ChevronRight
} from "lucide-react";
import { getLockerHistory } from "./services/api";
import "./RiwayatLoker.css";

const pad = (n) => String(n ?? "").padStart(2, "0");

const zoneOf = (n) =>
  n <= 28 ? "Kuning" : n <= 56 ? "Hijau" : "Merah";

// Database menyimpan DATETIME dalam format WIB.
// Jangan gunakan new Date("YYYY-MM-DD HH:mm:ss") karena
// browser dapat menafsirkannya berbeda antar perangkat.
const parseDate = (value) => {
  if (!value) return null;

  const normalized = String(value).replace(" ", "T");
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)
      ? `${normalized}+07:00`
      : normalized
  );

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = parseDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(date);
};

const dateOnly = (value) => {
  if (!value) return "";

  // Ambil tanggal kalender dari DATETIME WIB di database.
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
};

const escapeCsv = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function RiwayatLoker({
  userId = "admin",
  isAdmin = userId === "admin",
  currentUser
}) {
  const token = currentUser?.token;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("Semua");
  const [zone, setZone] = useState("Semua");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 7;

  const refresh = async () => {
    if (!token) {
      setRows([]);
      setError("Token login tidak tersedia. Silakan login kembali.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getLockerHistory(token);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Gagal mengambil riwayat loker.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [token]);

  // Filter transaksi berdasarkan data peminjaman dan pengembalian.
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const keyword = search.trim().toLowerCase();
      const lockerZone = r.zone || zoneOf(Number(r.number));
      const borrowDate = dateOnly(r.borrowedAt);

      const isReturned = Boolean(r.returnedAt);

      const matchesAction =
        action === "Semua" ||
        (action === "pinjam" && true) ||
        (action === "kembali" && isReturned);

      const matchesSearch =
        !keyword ||
        [
          pad(r.number),
          String(r.number ?? ""),
          r.borrower,
          r.userId
        ].some((v) =>
          String(v ?? "").toLowerCase().includes(keyword)
        );

      return (
        matchesSearch &&
        matchesAction &&
        (zone === "Semua" || lockerZone === zone) &&
        (!from || borrowDate >= from) &&
        (!to || borrowDate <= to)
      );
    }).sort((a, b) => {
      const dateA = parseDate(a.borrowedAt)?.getTime() || 0;
      const dateB = parseDate(b.borrowedAt)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [rows, search, action, zone, from, to]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);

  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const countBorrow = filtered.length;

  const countReturn = filtered.filter(
    (r) => Boolean(r.returnedAt)
  ).length;

  const countActive = countBorrow - countReturn;

  const updateFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const resetFilter = () => {
    setSearch("");
    setAction("Semua");
    setZone("Semua");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const exportCsv = () => {
    if (!isAdmin) return;

    const headers = [
      "Tanggal Pinjam",
      "Tanggal Pengembalian",
      "Nomor Loker",
      "Zona",
      "Status",
      "Peminjam",
      "User ID"
    ];

    const data = filtered.map((r) => [
      formatDate(r.borrowedAt),
      r.returnedAt ? formatDate(r.returnedAt) : "Belum dikembalikan",
      pad(r.number),
      r.zone || zoneOf(Number(r.number)),
      r.returnedAt ? "Sudah dikembalikan" : "Sedang dipinjam",
      r.borrower || "",
      r.userId || ""
    ]);

    const csv = "\uFEFF" +
      [headers, ...data]
        .map((line) => line.map(escapeCsv).join(","))
        .join("\r\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "Riwayat_Loker_BagSpace.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="rl-container">
      <div className="rl-top">
        <div>
          <h2>Riwayat Loker</h2>
          <p>
            Monitoring dan pengelolaan aktivitas peminjaman
            dan pengembalian loker perpustakaan
          </p>
        </div>

        <div className="rl-top-actions">
          <button
            type="button"
            className="rl-btn-refresh"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw size={15} />
            {loading ? "Memuat..." : "Perbarui"}
          </button>

          {isAdmin && (
            <button
              type="button"
              className="rl-btn-export"
              onClick={exportCsv}
            >
              <Download size={15} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" style={{ color: "#dc2626", marginBottom: 12 }}>
          {error}
        </p>
      )}

      <div className="rl-stats">
        <div className="rl-stat-card">
          <div className="rl-stat-info">
            <span>Total Transaksi</span>
            <strong>{filtered.length}</strong>
            <small>Seluruh transaksi sesuai filter</small>
          </div>
          <div className="rl-stat-icon blue">
            <History size={20} />
          </div>
        </div>

        <div className="rl-stat-card">
          <div className="rl-stat-info">
            <span>Sudah Dikembalikan</span>
            <strong>{countReturn}</strong>
            <small>Transaksi selesai</small>
          </div>
          <div className="rl-stat-icon green">
            <RotateCcw size={20} />
          </div>
        </div>

        <div className="rl-stat-card">
          <div className="rl-stat-info">
            <span>Belum Dikembalikan</span>
            <strong>{countActive}</strong>
            <small>Loker masih dipinjam</small>
          </div>
          <div className="rl-stat-icon orange">
            <LockKeyhole size={20} />
          </div>
        </div>
      </div>

      <section className="rl-main-card">
        <div className="rl-card-header">
          <div>
            <h3>Daftar Riwayat Loker</h3>
            <p>
              Waktu peminjaman dan pengembalian setiap transaksi
            </p>
          </div>

          <span className="rl-count">
            {filtered.length} Transaksi
          </span>
        </div>

        <div className="rl-filter-section">
          <label className="rl-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Cari nomor / peminjam..."
              value={search}
              onChange={(e) =>
                updateFilter(setSearch)(e.target.value)
              }
            />
          </label>

          <label className="rl-date-box">
            <CalendarDays size={14} />
            <input
              aria-label="Tanggal awal"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) =>
                updateFilter(setFrom)(e.target.value)
              }
            />
          </label>

          <label className="rl-date-box">
            <CalendarDays size={14} />
            <input
              aria-label="Tanggal akhir"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) =>
                updateFilter(setTo)(e.target.value)
              }
            />
          </label>

          <select
            aria-label="Filter aktivitas"
            value={action}
            onChange={(e) =>
              updateFilter(setAction)(e.target.value)
            }
          >
            <option value="Semua">Semua Transaksi</option>
            <option value="pinjam">Peminjaman</option>
            <option value="kembali">Sudah Dikembalikan</option>
          </select>

          <select
            aria-label="Filter zona"
            value={zone}
            onChange={(e) =>
              updateFilter(setZone)(e.target.value)
            }
          >
            <option value="Semua">Semua Zona</option>
            <option value="Kuning">Zona Kuning</option>
            <option value="Hijau">Zona Hijau</option>
            <option value="Merah">Zona Merah</option>
          </select>

          <button
            type="button"
            className="rl-reset"
            onClick={resetFilter}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <div className="rl-table-wrapper">
          <table className="rl-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Loker</th>
                <th>Zona</th>
                <th>Peminjam</th>
                <th>Waktu Pinjam</th>
                <th>Waktu Pengembalian</th>
                <th>Status</th>
                {isAdmin && <th>User ID</th>}
              </tr>
            </thead>

            <tbody>
              {visible.length ? (
                visible.map((r, i) => {
                  const lockerZone =
                    r.zone || zoneOf(Number(r.number));

                  const isReturned = Boolean(r.returnedAt);

                  return (
                    <tr key={r.id}>
                      <td>
                        {(currentPage - 1) * pageSize + i + 1}
                      </td>

                      <td className="rl-locker-name">
                        #{pad(r.number)}
                      </td>

                      <td>
                        <span
                          className={`rl-zone ${lockerZone.toLowerCase()}`}
                        >
                          {lockerZone}
                        </span>
                      </td>

                      <td>{r.borrower || "-"}</td>

                      <td>{formatDate(r.borrowedAt)}</td>

                      <td>
                        {isReturned ? (
                          formatDate(r.returnedAt)
                        ) : (
                          <span style={{ color: "#d97706" }}>
                            Belum dikembalikan
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`rl-action ${
                            isReturned ? "kembali" : "pinjam"
                          }`}
                        >
                          {isReturned
                            ? "Sudah dikembalikan"
                            : "Sedang dipinjam"}
                        </span>
                      </td>

                      {isAdmin && (
                        <td>{r.userId || "-"}</td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={isAdmin ? 8 : 7}
                    className="rl-empty"
                  >
                    <History size={27} />

                    <p>
                      {loading
                        ? "Memuat riwayat loker..."
                        : "Belum ada data riwayat loker"}
                    </p>

                    <small>
                      {loading
                        ? "Sedang mengambil data dari database."
                        : "Data transaksi tidak ditemukan."}
                    </small>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rl-footer">
          <span>
            Menampilkan {visible.length} dari {filtered.length} transaksi
          </span>

          <div className="rl-pagination">
            <button
              type="button"
              aria-label="Halaman sebelumnya"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>

            <span>{currentPage} / {pages}</span>

            <button
              type="button"
              aria-label="Halaman berikutnya"
              disabled={currentPage >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
