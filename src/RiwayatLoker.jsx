import React, { useEffect, useMemo, useState } from "react";
import {
  History, Search, Download, RefreshCw, CalendarDays,
  LockKeyhole, RotateCcw, ChevronLeft, ChevronRight
} from "lucide-react";
import "./RiwayatLoker.css";

const HISTORY_KEY = "bagspace_locker_history_v1";
const pad = (n) => String(n).padStart(2, "0");
const zoneOf = (n) => n <= 28 ? "Kuning" : n <= 56 ? "Hijau" : "Merah";
const readHistory = () => {
  try {
    const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(data) ? data.filter(r => r && r.id && r.number && r.action && r.timestamp) : [];
  } catch { return []; }
};
const formatDate = (iso) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};
const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function RiwayatLoker({ userId = "admin", isAdmin = userId === "admin" }) {
  const [rows, setRows] = useState(readHistory);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("Semua");
  const [zone, setZone] = useState("Semua");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const refresh = () => setRows(readHistory());
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === HISTORY_KEY || event.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const scoped = useMemo(() => isAdmin ? rows : rows.filter(r => String(r.userId) === String(userId)), [rows, isAdmin, userId]);
  const filtered = useMemo(() => scoped.filter(r => {
    const keyword = search.trim().toLowerCase();
    const date = String(r.timestamp).slice(0, 10);
    return (!keyword || [pad(r.number), String(r.number), r.borrower, r.userId].some(v => String(v ?? "").toLowerCase().includes(keyword)))
      && (action === "Semua" || r.action === action)
      && (zone === "Semua" || zoneOf(Number(r.number)) === zone)
      && (!from || date >= from)
      && (!to || date <= to);
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)), [scoped, search, action, zone, from, to]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const countBorrow = filtered.filter(r => r.action === "pinjam").length;
  const countReturn = filtered.filter(r => r.action === "kembali").length;
  const updateFilter = setter => value => { setter(value); setPage(1); };

  const resetFilter = () => {
    setSearch(""); setAction("Semua"); setZone("Semua");
    setFrom(""); setTo(""); setPage(1);
  };

  const exportCsv = () => {
    if (!isAdmin) return;
    const headers = ["Tanggal", "Nomor Loker", "Zona", "Aktivitas", "Peminjam", "User ID"];
    const data = filtered.map(r => [formatDate(r.timestamp), pad(r.number), zoneOf(Number(r.number)), r.action === "pinjam" ? "Peminjaman" : "Pengembalian", r.borrower || "", r.userId || ""]);
    const csv = "\uFEFF" + [headers, ...data].map(line => line.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
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
          <p>Monitoring dan pengelolaan aktivitas peminjaman loker perpustakaan</p>
        </div>
        <div className="rl-top-actions">
          <button type="button" className="rl-btn-refresh" onClick={refresh}><RefreshCw size={15} /> Perbarui</button>
          {isAdmin && <button type="button" className="rl-btn-export" onClick={exportCsv}><Download size={15} /> Export CSV</button>}
        </div>
      </div>

      <div className="rl-stats">
        <div className="rl-stat-card"><div className="rl-stat-info"><span>Total Aktivitas</span><strong>{filtered.length}</strong><small>Seluruh data sesuai filter</small></div><div className="rl-stat-icon blue"><History size={20} /></div></div>
        <div className="rl-stat-card"><div className="rl-stat-info"><span>Peminjaman</span><strong>{countBorrow}</strong><small>Aktivitas peminjaman loker</small></div><div className="rl-stat-icon green"><LockKeyhole size={20} /></div></div>
        <div className="rl-stat-card"><div className="rl-stat-info"><span>Pengembalian</span><strong>{countReturn}</strong><small>Aktivitas pengembalian loker</small></div><div className="rl-stat-icon orange"><RotateCcw size={20} /></div></div>
      </div>

      <section className="rl-main-card">
        <div className="rl-card-header"><div><h3>Daftar Riwayat Loker</h3><p>Informasi aktivitas peminjaman dan pengembalian loker</p></div><span className="rl-count">{filtered.length} Data</span></div>
        <div className="rl-filter-section">
          <label className="rl-search-box"><Search size={15} /><input type="text" placeholder="Cari nomor / peminjam..." value={search} onChange={e => updateFilter(setSearch)(e.target.value)} /></label>
          <label className="rl-date-box"><CalendarDays size={14} /><input aria-label="Tanggal awal" type="date" value={from} max={to || undefined} onChange={e => updateFilter(setFrom)(e.target.value)} /></label>
          <label className="rl-date-box"><CalendarDays size={14} /><input aria-label="Tanggal akhir" type="date" value={to} min={from || undefined} onChange={e => updateFilter(setTo)(e.target.value)} /></label>
          <select aria-label="Filter aktivitas" value={action} onChange={e => updateFilter(setAction)(e.target.value)}><option value="Semua">Semua Aktivitas</option><option value="pinjam">Peminjaman</option><option value="kembali">Pengembalian</option></select>
          <select aria-label="Filter zona" value={zone} onChange={e => updateFilter(setZone)(e.target.value)}><option value="Semua">Semua Zona</option><option value="Kuning">Zona Kuning</option><option value="Hijau">Zona Hijau</option><option value="Merah">Zona Merah</option></select>
          <button type="button" className="rl-reset" onClick={resetFilter}><RotateCcw size={14} /> Reset</button>
        </div>

        <div className="rl-table-wrapper">
          <table className="rl-table">
            <thead><tr><th>No</th><th>Tanggal & Waktu</th><th>Loker</th><th>Zona</th><th>Aktivitas</th><th>Peminjam</th>{isAdmin && <th>User ID</th>}</tr></thead>
            <tbody>
              {visible.length ? visible.map((r, i) => (
                <tr key={r.id}>
                  <td>{(currentPage - 1) * pageSize + i + 1}</td>
                  <td>{formatDate(r.timestamp)}</td>
                  <td className="rl-locker-name">#{pad(r.number)}</td>
                  <td><span className={`rl-zone ${zoneOf(Number(r.number)).toLowerCase()}`}>{zoneOf(Number(r.number))}</span></td>
                  <td><span className={`rl-action ${r.action}`}>{r.action === "pinjam" ? "Peminjaman" : "Pengembalian"}</span></td>
                  <td>{r.borrower || "-"}</td>
                  {isAdmin && <td>{r.userId || "-"}</td>}
                </tr>
              )) : <tr><td colSpan={isAdmin ? 7 : 6} className="rl-empty"><History size={27} /><p>Belum ada data riwayat loker</p><small>Data aktivitas loker tidak ditemukan.</small></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="rl-footer"><span>Menampilkan {visible.length} dari {filtered.length} data</span><div className="rl-pagination"><button type="button" aria-label="Halaman sebelumnya" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button><span>{currentPage} / {pages}</span><button type="button" aria-label="Halaman berikutnya" disabled={currentPage >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button></div></div>
      </section>
    </div>
  );
}