import React, { useMemo, useState } from "react";
import { LockKeyhole, CheckCircle2, AlertTriangle, RotateCcw, X } from "lucide-react";
import "./PilihLoker.css";

const STORAGE_KEY = "bagspace_locker_demo_v1";
const TOTAL = 75;
const zoneOf = (number) => number <= 28 ? "Kuning" : number <= 56 ? "Hijau" : "Merah";
const zoneColors = { Kuning: "#eab308", Hijau: "#22c55e", Merah: "#ef4444" };
const initialLockers = () => Array.from({ length: TOTAL }, (_, index) => ({ number: index + 1, status: "tersedia", borrower: "" }));

function loadLockers() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length === TOTAL && saved.every((x, i) => x.number === i + 1 && ["tersedia", "dipinjam", "rusak"].includes(x.status))) return saved;
  } catch { /* Invalid or unavailable storage */ }
  return initialLockers();
}

export default function PilihLoker({ userId = "admin" }) {
  const [lockers, setLockers] = useState(loadLockers);
  const [zone, setZone] = useState("Semua");
  const [selected, setSelected] = useState(null);
  const [borrower, setBorrower] = useState("");
  const [notice, setNotice] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const counts = useMemo(() => ({
    tersedia: lockers.filter((l) => l.status === "tersedia").length,
    dipinjam: lockers.filter((l) => l.status === "dipinjam").length,
    rusak: lockers.filter((l) => l.status === "rusak").length,
  }), [lockers]);

  const visible = lockers.filter((l) => (zone === "Semua" || zoneOf(l.number) === zone) && (statusFilter === "Semua" || l.status === statusFilter));
  const current = selected == null ? null : lockers.find((l) => l.number === selected);

  function updateLocker(number, status, name = "") {
    const next = lockers.map((l) => l.number === number ? { ...l, status, borrower: name } : l);
    setLockers(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { setNotice("Perubahan hanya tersimpan sementara karena penyimpanan browser tidak tersedia."); }
    setSelected(null);
    setBorrower("");
  }

  function borrow() {
    if (!current || current.status !== "tersedia") return;
    if (!borrower.trim()) { setNotice("Masukkan nama atau NIM/NIP peminjam terlebih dahulu."); return; }
    updateLocker(current.number, "dipinjam", borrower.trim());
    setNotice(`Loker ${current.number} berhasil dipinjam (data demo).`);
  }

  return (
    <div className="pl-page">
      <div className="pl-header">
        <div><h2>Pilih Loker</h2><p>Peminjaman loker Perpustakaan Politeknik APP Jakarta</p></div>
        <span className="pl-total"><LockKeyhole size={15} /> 75 Loker</span>
      </div>

      <div className="pl-stats">
        <div><span>Total Loker</span><strong>75</strong></div>
        <div><span>Tersedia</span><strong>{counts.tersedia}</strong></div>
        <div><span>Dipinjam</span><strong>{counts.dipinjam}</strong></div>
        <div><span>Rusak</span><strong>{counts.rusak}</strong></div>
      </div>

      <section className="pl-panel">
        <div className="pl-toolbar">
          <div className="pl-tabs" aria-label="Filter zona">
            {["Semua", "Kuning", "Hijau", "Merah"].map((z) => <button type="button" key={z} className={zone === z ? "selected" : ""} onClick={() => setZone(z)}>{z === "Semua" ? "Semua Zona" : `Zona ${z}`}</button>)}
          </div>
          <select aria-label="Filter status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="Semua">Semua Status</option><option value="tersedia">Tersedia</option><option value="dipinjam">Dipinjam</option><option value="rusak">Rusak</option>
          </select>
        </div>
        <div className="pl-legend"><span><i className="pl-dot available" /> Tersedia</span><span><i className="pl-dot occupied" /> Dipinjam</span><span><i className="pl-dot broken" /> Rusak</span></div>
        {notice && <div className="pl-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Tutup pemberitahuan"><X size={14} /></button></div>}
        <div className="pl-grid-scroll">
          {visible.length ? <div className="pl-grid">{visible.map((l) => <button type="button" key={l.number} onClick={() => { setSelected(l.number); setBorrower(userId === "admin" ? "" : userId); setNotice(""); }} className={`pl-locker ${l.status}`} style={{ "--zone-color": zoneColors[zoneOf(l.number)] }} title={`Loker ${l.number}: ${l.status}`}><span className="pl-locker-zone" /><LockKeyhole size={16} /><strong>{String(l.number).padStart(2, "0")}</strong></button>)}</div> : <div className="pl-empty">Tidak ada loker yang sesuai filter.</div>}
        </div>
        <div className="pl-footnote">Klik nomor loker untuk melihat detail atau melakukan peminjaman. Data saat ini hanya simulasi di browser.</div>
      </section>

      {current && <div className="pl-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
        <div className="pl-modal" role="dialog" aria-modal="true" aria-label={`Detail loker ${current.number}`}>
          <div className="pl-modal-heading"><div><h3>Loker {String(current.number).padStart(2, "0")}</h3><p>Zona {zoneOf(current.number)} · {current.status === "tersedia" ? "Tersedia" : current.status === "dipinjam" ? "Sedang dipinjam" : "Rusak"}</p></div><button type="button" onClick={() => setSelected(null)} aria-label="Tutup"><X size={18} /></button></div>
          {current.status === "tersedia" ? <><label className="pl-field">Nama / NIM / NIP peminjam<input value={borrower} onChange={(e) => setBorrower(e.target.value)} placeholder="Masukkan identitas peminjam" autoFocus /></label><button type="button" className="pl-primary" onClick={borrow}><CheckCircle2 size={16} /> Konfirmasi Peminjaman</button></> : current.status === "dipinjam" ? <><p className="pl-borrower">Peminjam: <strong>{current.borrower || "Tidak tercatat"}</strong></p><button type="button" className="pl-primary" onClick={() => { updateLocker(current.number, "tersedia"); setNotice(`Loker ${current.number} berhasil dikembalikan (data demo).`); }}><RotateCcw size={16} /> Kembalikan Loker</button></> : <p className="pl-borrower"><AlertTriangle size={16} /> Loker rusak dan tidak dapat dipinjam.</p>}
          <button type="button" className="pl-cancel" onClick={() => setSelected(null)}>Batal</button>
        </div>
      </div>}
    </div>
  );
}
