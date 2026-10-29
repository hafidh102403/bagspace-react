import React, { useEffect, useMemo, useState } from "react";
import { History, Search, Download, RefreshCw, CalendarDays, LockKeyhole, RotateCcw } from "lucide-react";
import "./RiwayatLoker.css";

const HISTORY_KEY = "bagspace_locker_history_v1";
const pad = (n) => String(n).padStart(2, "0");
const zoneOf = (n) => n <= 28 ? "Kuning" : n <= 56 ? "Hijau" : "Merah";
const readHistory = () => {
  try {
    const rows = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(rows) ? rows.filter((r) => r && r.id && r.number && r.action && r.timestamp) : [];
  } catch { return []; }
};
const formatDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const escapeCsv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default function RiwayatLoker({ userId = "admin", isAdmin = userId === "admin" }) {
  const [rows, setRows] = useState(readHistory);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("Semua");
  const [zone, setZone] = useState("Semua");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const refresh = () => setRows(readHistory());

  useEffect(() => {
    const onStorage = (e) => { if (e.key === HISTORY_KEY || e.key === null) refresh(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("focus", refresh); };
  }, []);

  const scoped = useMemo(() => isAdmin ? rows : rows.filter((r) => r.userId === userId), [rows, isAdmin, userId]);
  const filtered = useMemo(() => scoped.filter((r) => {
    const q = search.trim().toLowerCase();
    const date = String(r.timestamp).slice(0, 10);
    return (!q || [pad(r.number), String(r.number), r.borrower, r.userId].some((v) => String(v || "").toLowerCase().includes(q)))
      && (action === "Semua" || r.action === action)
      && (zone === "Semua" || zoneOf(Number(r.number)) === zone)
      && (!from || date >= from) && (!to || date <= to);
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)), [scoped, search, action, zone, from, to]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const countBorrow = scoped.filter((r) => r.action === "pinjam").length;
  const countReturn = scoped.filter((r) => r.action === "kembali").length;

  function exportCsv() {
    const headers = ["Tanggal", "Nomor Loker", "Zona", "Aktivitas", "Peminjam", "User ID"];
    const lines = [headers, ...filtered.map((r) => [formatDate(r.timestamp), pad(r.number), zoneOf(Number(r.number)), r.action === "pinjam" ? "Peminjaman" : "Pengembalian", r.borrower || "", r.userId || ""])];
    const csv = "\uFEFF" + lines.map((line) => line.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "riwayat-loker.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const updateFilter = (setter) => (value) => { setter(value); setPage(1); };
  return (
    <div className="rl-page">
      <div className="rl-heading">
        <div><span className="rl-eyebrow">PENGELOLAAN LOKER</span><h2>Riwayat Loker</h2><p>Catatan aktivitas peminjaman dan pengembalian loker.</p></div>
        <div className="rl-actions"><button type="button" onClick={refresh}><RefreshCw size={14}/> Perbarui</button>{isAdmin && <button type="button" className="rl-export" onClick={exportCsv}><Download size={14}/> Export CSV</button>}</div>
      </div>
      <div className="rl-stats">
        <article><span><History size={14}/> Total Aktivitas</span><strong>{scoped.length}</strong><small>Semua riwayat tercatat</small></article>
        <article><span><LockKeyhole size={14}/> Peminjaman</span><strong>{countBorrow}</strong><small>Aktivitas pinjam</small></article>
        <article><span><RotateCcw size={14}/> Pengembalian</span><strong>{countReturn}</strong><small>Aktivitas kembali</small></article>
      </div>
      <section className="rl-panel">
        <div className="rl-panel-top"><div><h3>Daftar Riwayat</h3><p>Filter aktivitas sesuai kebutuhan</p></div><span>{filtered.length} data ditemukan</span></div>
        <div className="rl-filters">
          <label className="rl-search"><Search size={15}/><input value={search} onChange={(e) => updateFilter(setSearch)(e.target.value)} placeholder="Cari nomor / peminjam..." aria-label="Cari riwayat"/></label>
          <select value={action} onChange={(e) => updateFilter(setAction)(e.target.value)} aria-label="Filter aktivitas"><option value="Semua">Semua Aktivitas</option><option value="pinjam">Peminjaman</option><option value="kembali">Pengembalian</option></select>
          <select value={zone} onChange={(e) => updateFilter(setZone)(e.target.value)} aria-label="Filter zona"><option value="Semua">Semua Zona</option><option value="Kuning">Zona Kuning</option><option value="Hijau">Zona Hijau</option><option value="Merah">Zona Merah</option></select>
          <label className="rl-date"><CalendarDays size={14}/><input type="date" value={from} onChange={(e) => updateFilter(setFrom)(e.target.value)} aria-label="Dari tanggal"/></label>
          <label className="rl-date"><CalendarDays size={14}/><input type="date" min={from || undefined} value={to} onChange={(e) => updateFilter(setTo)(e.target.value)} aria-label="Sampai tanggal"/></label>
          <button type="button" className="rl-reset" onClick={() => { setSearch(""); setAction("Semua"); setZone("Semua"); setFrom(""); setTo(""); setPage(1); }}>Reset</button>
        </div>
        <div className="rl-table-wrap"><table className="rl-table"><thead><tr><th>No.</th><th>Tanggal & Waktu</th><th>Loker</th><th>Zona</th><th>Aktivitas</th><th>Peminjam</th>{isAdmin && <th>User ID</th>}</tr></thead><tbody>
          {visible.length ? visible.map((r, i) => <tr key={r.id}><td>{(currentPage - 1) * pageSize + i + 1}</td><td>{formatDate(r.timestamp)}</td><td><strong>#{pad(r.number)}</strong></td><td><span className={`rl-zone ${zoneOf(Number(r.number)).toLowerCase()}`}>{zoneOf(Number(r.number))}</span></td><td><span className={`rl-action ${r.action}`}>{r.action === "pinjam" ? "Peminjaman" : "Pengembalian"}</span></td><td>{r.borrower || "-"}</td>{isAdmin && <td>{r.userId || "-"}</td>}</tr>) : <tr><td colSpan={isAdmin ? 7 : 6} className="rl-empty">Belum ada riwayat yang sesuai. Coba pinjam atau kembalikan loker dari halaman Pilih Loker.</td></tr>}
        </tbody></table></div>
        <div className="rl-footer"><small>Menampilkan {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} dari {filtered.length} data</small><div><button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</button><span>{currentPage} / {pages}</span><button type="button" disabled={currentPage >= pages} onClick={() => setPage((p) => p + 1)}>Berikutnya</button></div></div>
      </section>
      <p className="rl-note">Data riwayat disimpan secara lokal di browser ini, belum terhubung ke database.</p>
    </div>
  );
}
