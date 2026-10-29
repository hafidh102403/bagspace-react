import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, LockKeyhole, AlertTriangle, RefreshCw,
  Layers3, Search, X, Eye,
} from "lucide-react";
import "./MonitoringLoker.css";

const STORAGE_KEY = "bagspace_locker_demo_v1";
const TOTAL = 75;
const ZONES = [
  { name: "Kuning", start: 1, end: 28, color: "#eab308" },
  { name: "Hijau", start: 29, end: 56, color: "#22c55e" },
  { name: "Merah", start: 57, end: 75, color: "#ef4444" },
];
const pad = (number) => String(number).padStart(2, "0");
const zoneOf = (number) => ZONES.find((z) => number >= z.start && number <= z.end);
const statusLabels = { tersedia: "Tersedia", dipinjam: "Dipinjam", rusak: "Rusak" };

function loadLockers() {
  const defaults = Array.from({ length: TOTAL }, (_, index) => ({
    number: index + 1, status: "tersedia", borrower: "",
  }));
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length === TOTAL && saved.every((item, i) =>
      item?.number === i + 1 && Object.hasOwn(statusLabels, item.status)
    )) return saved;
  } catch {
    // Gunakan data awal jika penyimpanan browser tidak tersedia.
  }
  return defaults;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function MonitoringLoker() {
  const [lockers, setLockers] = useState(loadLockers);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const refresh = () => setLockers(loadLockers());

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const stats = useMemo(() => ({
    tersedia: lockers.filter((l) => l.status === "tersedia").length,
    dipinjam: lockers.filter((l) => l.status === "dipinjam").length,
    rusak: lockers.filter((l) => l.status === "rusak").length,
  }), [lockers]);

  const filtered = useMemo(() => lockers.filter((locker) => {
    const q = search.trim().toLowerCase();
    const zone = zoneOf(locker.number);
    const matchSearch = !q || [pad(locker.number), String(locker.number), locker.borrower, locker.userId]
      .some((value) => String(value || "").toLowerCase().includes(q));
    return matchSearch && (zoneFilter === "Semua" || zone?.name === zoneFilter)
      && (statusFilter === "Semua" || locker.status === statusFilter);
  }), [lockers, search, zoneFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedLocker = selected == null ? null : lockers.find((l) => l.number === selected);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const reset = () => {
    setSearch("");
    setZoneFilter("Semua");
    setStatusFilter("Semua");
    setPage(1);
  };

  return (
    <div className="ml-page">
      <div className="ml-heading">
        <div>
          <span className="ml-eyebrow">PENGELOLAAN LOKER</span>
          <h2>Monitoring Loker</h2>
          <p>Pantau penggunaan dan kondisi seluruh loker perpustakaan.</p>
        </div>
        <button type="button" className="ml-refresh" onClick={refresh}>
          <RefreshCw size={14} /> Perbarui
        </button>
      </div>

      <div className="ml-stats">
        <article><span><Layers3 size={14} /> Total Loker</span><strong>{TOTAL}</strong><small>3 zona loker</small></article>
        <article><span><CheckCircle2 size={14} /> Tersedia</span><strong>{stats.tersedia}</strong><small>Siap digunakan</small></article>
        <article><span><LockKeyhole size={14} /> Dipinjam</span><strong>{stats.dipinjam}</strong><small>Sedang digunakan</small></article>
        <article><span><AlertTriangle size={14} /> Rusak</span><strong>{stats.rusak}</strong><small>Tidak aktif</small></article>
      </div>

      <section className="ml-panel">
        <div className="ml-panel-top">
          <div><h3>Daftar Monitoring Loker</h3><p>Daftar status loker berdasarkan nomor dan zona</p></div>
          <span>{filtered.length} loker ditemukan</span>
        </div>

        <div className="ml-filters">
          <label className="ml-search">
            <Search size={15} />
            <input aria-label="Cari nomor atau peminjam" value={search}
              onChange={(e) => changeFilter(setSearch)(e.target.value)}
              placeholder="Cari nomor loker / peminjam..." />
          </label>
          <select aria-label="Filter zona" value={zoneFilter} onChange={(e) => changeFilter(setZoneFilter)(e.target.value)}>
            <option value="Semua">Semua Zona</option>
            {ZONES.map((zone) => <option value={zone.name} key={zone.name}>Zona {zone.name}</option>)}
          </select>
          <select aria-label="Filter status" value={statusFilter} onChange={(e) => changeFilter(setStatusFilter)(e.target.value)}>
            <option value="Semua">Semua Status</option>
            <option value="tersedia">Tersedia</option>
            <option value="dipinjam">Dipinjam</option>
            <option value="rusak">Rusak</option>
          </select>
          <button type="button" className="ml-reset" onClick={reset}>Reset</button>
        </div>

        <div className="ml-table-wrap">
          <table className="ml-table">
            <thead>
              <tr><th>No.</th><th>Nomor Loker</th><th>Zona</th><th>Status</th><th>Nama Peminjam</th><th>Mulai Pinjam</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {visible.length > 0 ? visible.map((locker, index) => {
                const zone = zoneOf(locker.number);
                return (
                  <tr key={locker.number}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td><strong>#{pad(locker.number)}</strong></td>
                    <td><span className={`ml-zone-badge ${zone?.name.toLowerCase()}`}>Zona {zone?.name}</span></td>
                    <td><span className={`ml-status-badge ${locker.status}`}>{statusLabels[locker.status]}</span></td>
                    <td>{locker.status === "dipinjam" ? locker.borrower || "Tidak tercatat" : "-"}</td>
                    <td>{locker.status === "dipinjam" ? formatDate(locker.borrowedAt || locker.borrowed_at || locker.startTime) : "-"}</td>
                    <td><button type="button" className="ml-detail-button" onClick={() => setSelected(locker.number)} title="Lihat detail loker"><Eye size={14} /> Detail</button></td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="ml-empty">Tidak ada loker yang sesuai dengan filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ml-footer">
          <small>Menampilkan {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} dari {filtered.length} loker</small>
          <div>
            <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</button>
            <span>{currentPage} / {totalPages}</span>
            <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>Berikutnya</button>
          </div>
        </div>
      </section>
      <p className="ml-note">Data monitoring mengikuti penyimpanan lokal dari halaman Pilih Loker.</p>

      {selectedLocker && (
        <div className="ml-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="ml-modal" role="dialog" aria-modal="true" aria-label={`Detail loker ${pad(selectedLocker.number)}`}>
            <div className="ml-modal-top">
              <h3>Detail Loker {pad(selectedLocker.number)}</h3>
              <button type="button" onClick={() => setSelected(null)} aria-label="Tutup detail"><X size={18} /></button>
            </div>
            <p>Zona: <strong>{zoneOf(selectedLocker.number)?.name}</strong></p>
            <p>Status: <strong>{statusLabels[selectedLocker.status]}</strong></p>
            {selectedLocker.status === "dipinjam" && (
              <>
                <p>Peminjam: <strong>{selectedLocker.borrower || "Tidak tercatat"}</strong></p>
                <p>Mulai pinjam: <strong>{formatDate(selectedLocker.borrowedAt || selectedLocker.borrowed_at || selectedLocker.startTime)}</strong></p>
              </>
            )}
            <button type="button" className="ml-modal-close" onClick={() => setSelected(null)}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
