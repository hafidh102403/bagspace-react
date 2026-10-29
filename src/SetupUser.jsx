import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Download, Plus, Search, Pencil, Trash2, X, Users } from "lucide-react";
import "./SetupUser.css";

const KEY = "bagspace_setup_users_v1";
const HEADERS = ["nama_lengkap", "email", "nim_nip", "role", "prodi"];
const EMPTY = { nama_lengkap: "", email: "", nim_nip: "", role: "mahasiswa", prodi: "MLIE" };
const ROLES = ["mahasiswa", "dosen", "admin_perpus", "admin_sistem"];
const PRODIS = ["MLIE", "MPIE", "PIWAR", "Dosen/Tendik", "UMUM"];

function loadUsers() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function normalizeRole(value) {
  const role = String(value || "mahasiswa").trim().toLowerCase().replaceAll(" ", "_");
  return role === "dosen/tendik" ? "dosen" : role;
}

function normalizeUser(raw) {
  const row = {};
  HEADERS.forEach((field) => {
    row[field] = String(raw[field] ?? "").trim();
  });
  row.role = normalizeRole(row.role);
  row.prodi = row.prodi || (row.role === "mahasiswa" ? "MLIE" : "Dosen/Tendik");
  return row;
}

function validateUser(user) {
  if (!user.nama_lengkap || !user.email || !user.nim_nip) return "Nama, email, dan NIM/NIP wajib diisi.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) return "Format email tidak valid.";
  if (!ROLES.includes(user.role)) return `Role tidak valid: ${user.role}`;
  return "";
}

export default function SetupUser() {
  const [users, setUsers] = useState(loadUsers);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileRef = useRef(null);

  function saveUsers(next) {
    setUsers(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) =>
      [user.nama_lengkap, user.email, user.nim_nip, user.role, user.prodi]
        .some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [users, search]);

  const stats = useMemo(() => ({
    total: users.length,
    mahasiswa: users.filter((u) => u.role === "mahasiswa").length,
    dosen: users.filter((u) => u.role === "dosen").length,
    admin: users.filter((u) => u.role.startsWith("admin_")).length,
  }), [users]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setError("");
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditingId(user.nim_nip);
    setForm({ ...user });
    setError("");
    setModalOpen(true);
  }

  function submit(event) {
    event.preventDefault();
    const user = normalizeUser(form);
    const validation = validateUser(user);
    if (validation) return setError(validation);
    const duplicate = users.some((u) => u.nim_nip === user.nim_nip && u.nim_nip !== editingId);
    if (duplicate) return setError("NIM/NIP sudah terdaftar.");
    const duplicateEmail = users.some((u) => u.email.toLowerCase() === user.email.toLowerCase() && u.nim_nip !== editingId);
    if (duplicateEmail) return setError("Email sudah terdaftar.");
    const next = editingId
      ? users.map((u) => u.nim_nip === editingId ? user : u)
      : [...users, user];
    try {
      saveUsers(next);
      setNotice(editingId ? "Data pengguna berhasil diperbarui." : "Pengguna berhasil ditambahkan.");
      setModalOpen(false);
    } catch {
      setError("Gagal menyimpan data ke penyimpanan browser.");
    }
  }

  function removeUser(user) {
    if (!window.confirm(`Hapus pengguna ${user.nama_lengkap}?`)) return;
    try {
      saveUsers(users.filter((u) => u.nim_nip !== user.nim_nip));
      setNotice("Pengguna berhasil dihapus.");
    } catch {
      setNotice("Gagal menghapus pengguna dari penyimpanan browser.");
    }
  }

  async function importExcel(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setNotice("");
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
      if (!rows.length) throw new Error("File Excel tidak memiliki data.");
      const actualHeaders = Object.keys(rows[0]);
      const missing = HEADERS.filter((h) => !actualHeaders.includes(h));
      if (missing.length) throw new Error(`Kolom Excel belum lengkap: ${missing.join(", ")}`);
      const imported = rows.map(normalizeUser);
      const seenNim = new Set(users.map((u) => u.nim_nip));
      const seenEmail = new Set(users.map((u) => u.email.toLowerCase()));
      for (let i = 0; i < imported.length; i++) {
        const row = imported[i];
        const validation = validateUser(row);
        if (validation) throw new Error(`Baris ${i + 2}: ${validation}`);
        if (seenNim.has(row.nim_nip)) throw new Error(`Baris ${i + 2}: NIM/NIP ${row.nim_nip} duplikat.`);
        if (seenEmail.has(row.email.toLowerCase())) throw new Error(`Baris ${i + 2}: email ${row.email} duplikat.`);
        seenNim.add(row.nim_nip);
        seenEmail.add(row.email.toLowerCase());
      }
      saveUsers([...users, ...imported]);
      setNotice(`${imported.length} pengguna berhasil diimpor dari Excel.`);
    } catch (err) {
      setNotice(`Import gagal: ${err.message || "File tidak dapat dibaca."}`);
    } finally {
      event.target.value = "";
    }
  }

  function exportExcel() {
    const rows = filtered.map((u) => Object.fromEntries(HEADERS.map((h) => [h, u[h] || ""])));
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
    worksheet["!cols"] = [{ wch: 27 }, { wch: 32 }, { wch: 19 }, { wch: 18 }, { wch: 18 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar User");
    XLSX.writeFile(workbook, "BagSpace_Daftar_User.xlsx");
    setNotice("Export Excel berhasil diproses.");
  }

  return (
    <section className="su-page">
      <div className="su-header">
        <div>
          <span className="su-kicker">MANAJEMEN PENGGUNA</span>
          <h2>Setup User</h2>
          <p>Kelola akun mahasiswa, dosen, dan admin perpustakaan.</p>
        </div>
        <div className="su-header-actions">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={importExcel} />
          <button type="button" className="su-secondary" onClick={() => fileRef.current?.click()}><Upload size={15} /> Import Excel</button>
          <button type="button" className="su-secondary" onClick={exportExcel}><Download size={15} /> Export Excel</button>
          <button type="button" className="su-primary" onClick={openAdd}><Plus size={15} /> Tambah User</button>
        </div>
      </div>

      <div className="su-stats">
        <div><span>Total Pengguna</span><strong>{stats.total}</strong></div>
        <div><span>Mahasiswa</span><strong>{stats.mahasiswa}</strong></div>
        <div><span>Dosen/Tendik</span><strong>{stats.dosen}</strong></div>
        <div><span>Admin</span><strong>{stats.admin}</strong></div>
      </div>

      <div className="su-panel">
        <div className="su-panel-head">
          <div><h3><Users size={16} /> Daftar Pengguna</h3><p>{filtered.length} pengguna ditampilkan</p></div>
          <label className="su-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, NIM/NIP, email..." /></label>
        </div>
        {notice && <div className="su-notice" role="status">{notice}</div>}
        <div className="su-table-wrap">
          <table className="su-table">
            <thead><tr><th>No</th><th>Nama Lengkap</th><th>Email</th><th>NIM/NIP</th><th>Role</th><th>Prodi</th><th>Aksi</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="su-empty">Belum ada pengguna. Tambahkan secara manual atau Import Excel.</td></tr>
              ) : filtered.map((u, index) => (
                <tr key={u.nim_nip}>
                  <td>{index + 1}</td><td>{u.nama_lengkap}</td><td>{u.email}</td><td>{u.nim_nip}</td>
                  <td><span className="su-pill">{u.role.replaceAll("_", " ")}</span></td><td>{u.prodi}</td>
                  <td><div className="su-actions">
                    <button type="button" aria-label={`Edit ${u.nama_lengkap}`} title="Edit" onClick={() => openEdit(u)}><Pencil size={14} /></button>
                    <button type="button" aria-label={`Hapus ${u.nama_lengkap}`} title="Hapus" onClick={() => removeUser(u)}><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <div className="su-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <div className="su-modal" role="dialog" aria-modal="true" aria-label={editingId ? "Edit User" : "Tambah User"}>
          <div className="su-modal-head"><h3>{editingId ? "Edit User" : "Tambah User"}</h3><button type="button" onClick={() => setModalOpen(false)} aria-label="Tutup"><X size={18} /></button></div>
          <form onSubmit={submit}>
            <div className="su-form-grid">
              <label>Nama Lengkap<input required value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} /></label>
              <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label>NIM/NIP<input required value={form.nim_nip} onChange={(e) => setForm({ ...form, nim_nip: e.target.value })} /></label>
              <label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((r) => <option key={r} value={r}>{r.replaceAll("_", " ")}</option>)}</select></label>
              <label>Prodi<select value={form.prodi} onChange={(e) => setForm({ ...form, prodi: e.target.value })}>{PRODIS.map((p) => <option key={p} value={p}>{p}</option>)}</select></label>
            </div>
            {error && <p className="su-error">{error}</p>}
            <div className="su-modal-footer"><button type="button" onClick={() => setModalOpen(false)}>Batal</button><button type="submit" className="su-primary">{editingId ? "Simpan Perubahan" : "Tambah User"}</button></div>
          </form>
        </div>
      </div>}
    </section>
  );
}
