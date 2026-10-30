import React, { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { Download, Upload, Plus, Search, Trash2, Users, X } from "lucide-react";
import "./SetupUser.css";

const STORAGE_KEY = "bagspace_users";
const PRODI_OPTIONS = ["MLIE", "MPIE", "PIWAR", "Dosen/Tendik"];
const ROLE_OPTIONS = ["Mahasiswa", "Dosen/Tendik"];
const emptyForm = { nama: "", nim: "", prodi: "MLIE", role: "Mahasiswa" };

function normalizeRole(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "mahasiswa") return "Mahasiswa";
  if (["dosen/tendik", "dosen", "tendik"].includes(v)) return "Dosen/Tendik";
  return null;
}
function normalizeProdi(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return PRODI_OPTIONS.find((item) => item.toLowerCase() === v) ?? null;
}
function readUsers() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}
function excelText(cell) {
  const value = cell?.value;
  if (value == null) return "";
  if (typeof value === "object") {
    if ("text" in value) return String(value.text ?? "").trim();
    if ("result" in value) return String(value.result ?? "").trim();
    if ("richText" in value) return value.richText.map((x) => x.text).join("").trim();
  }
  return String(value).trim();
}

export default function SetupUser() {
  const [users, setUsers] = useState(readUsers);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const filtered = useMemo(() => users.filter((user) =>
    [user.nama, user.nim, user.prodi, user.role].some((v) =>
      String(v ?? "").toLowerCase().includes(search.toLowerCase())
    )
  ), [users, search]);

  async function downloadTemplate() {
    setNotice("");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "BagSpace";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Template Import User", {
      views: [{ state: "frozen", ySplit: 5 }],
      pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
    });
    sheet.columns = [
      { key: "nama", width: 32 },
      { key: "nim", width: 24 },
      { key: "prodi", width: 22 },
      { key: "role", width: 22 },
    ];
    sheet.mergeCells("A1:D2");
    const title = sheet.getCell("A1");
    title.value = "TEMPLATE IMPORT USER BAGSPACE";
    title.font = { name: "Aptos Display", size: 18, bold: true, color: { argb: "FFFFFFFF" } };
    title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    title.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 26;
    sheet.getRow(2).height = 18;
    sheet.mergeCells("A3:D3");
    const subtitle = sheet.getCell("A3");
    subtitle.value = "Isi data mulai baris 6. Pilih Prodi dan Role melalui dropdown. Jangan mengubah nama kolom.";
    subtitle.font = { name: "Aptos", size: 10, italic: true, color: { argb: "FF475569" } };
    subtitle.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(3).height = 26;
    sheet.getRow(4).height = 9;
    const headers = ["Nama Lengkap", "NIM/NIP", "Prodi", "Role"];
    const headerRow = sheet.getRow(5);
    headerRow.values = headers;
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Aptos", bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { bottom: { style: "medium", color: { argb: "FF1D4ED8" } } };
    });
    // Sumber dropdown pada sheet tersembunyi agar pilihan Excel stabil.
    const pilihan = workbook.addWorksheet("Pilihan", { state: "veryHidden" });
    PRODI_OPTIONS.forEach((value, index) => { pilihan.getCell(index + 1, 1).value = value; });
    ROLE_OPTIONS.forEach((value, index) => { pilihan.getCell(index + 1, 2).value = value; });

    // Baris input kosong, tidak menggunakan data pengguna fiktif.
    for (let rowNo = 6; rowNo <= 105; rowNo++) {
      const row = sheet.getRow(rowNo);
      row.height = 22;
      for (let col = 1; col <= 4; col++) {
        const cell = row.getCell(col);
        cell.font = { name: "Aptos", size: 10, color: { argb: "FF0F172A" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowNo % 2 === 0 ? "FFF1F5F9" : "FFFFFFFF" } };
        cell.border = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } };
        cell.alignment = { vertical: "middle" };
      }
      row.getCell(2).numFmt = "@"; // Pertahankan NIM/NIP sebagai teks
      row.getCell(3).dataValidation = {
        type: "list", allowBlank: true,
        formulae: [`'Pilihan'!$A$1:$A$${PRODI_OPTIONS.length}`],
        showDropDown: false,
        showErrorMessage: true, errorTitle: "Prodi tidak valid", error: "Pilih Prodi dari dropdown.",
      };
      row.getCell(4).dataValidation = {
        type: "list", allowBlank: true,
        formulae: [`'Pilihan'!$B$1:$B$${ROLE_OPTIONS.length}`],
        showDropDown: false,
        showErrorMessage: true, errorTitle: "Role tidak valid", error: "Pilih Role dari dropdown.",
      };
    }
    sheet.autoFilter = { from: "A5", to: "D105" };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Template_Import_User_BagSpace.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importExcel(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) {
      setNotice("Gunakan file Excel .xlsx sesuai template BagSpace.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("Worksheet Excel tidak ditemukan.");
      const expected = ["Nama Lengkap", "NIM/NIP", "Prodi", "Role"];
      const actual = expected.map((_, index) => excelText(sheet.getRow(5).getCell(index + 1)));
      if (actual.some((value, index) => value !== expected[index])) {
        throw new Error("Header template tidak sesuai. Unduh template BagSpace terbaru.");
      }
      const next = [...users];
      const knownNim = new Set(users.map((u) => String(u.nim).toLowerCase()));
      let imported = 0;
      let duplicates = 0;
      const errors = [];
      for (let rowNo = 6; rowNo <= sheet.rowCount; rowNo++) {
        const row = sheet.getRow(rowNo);
        const nama = excelText(row.getCell(1));
        const nim = excelText(row.getCell(2));
        const prodiRaw = excelText(row.getCell(3));
        const roleRaw = excelText(row.getCell(4));
        if (![nama, nim, prodiRaw, roleRaw].some(Boolean)) continue;
        const prodi = normalizeProdi(prodiRaw);
        const role = normalizeRole(roleRaw);
        if (!nama || !nim || !prodi || !role) {
          errors.push(`Baris ${rowNo}: Nama, NIM/NIP, Prodi, atau Role tidak valid.`);
          continue;
        }
        if (knownNim.has(nim.toLowerCase())) { duplicates++; continue; }
        knownNim.add(nim.toLowerCase());
        next.push({ id: crypto.randomUUID(), nama, nim, prodi, role });
        imported++;
      }
      if (imported) setUsers(next);
      setNotice(`${imported} user berhasil diimpor. ${duplicates} duplikat dilewati.${errors.length ? ` ${errors.length} baris tidak valid: ${errors.slice(0, 3).join(" ")}` : ""}`);
    } catch (error) {
      setNotice(`Import gagal: ${error.message}`);
    } finally { setBusy(false); }
  }

  function addUser(event) {
    event.preventDefault();
    const nama = form.nama.trim();
    const nim = form.nim.trim();
    if (!nama || !nim) return setNotice("Nama dan NIM/NIP wajib diisi.");
    if (users.some((u) => String(u.nim).toLowerCase() === nim.toLowerCase())) {
      return setNotice("NIM/NIP sudah terdaftar.");
    }
    setUsers((prev) => [...prev, { ...form, nama, nim, id: crypto.randomUUID() }]);
    setForm(emptyForm);
    setShowForm(false);
    setNotice("User berhasil ditambahkan.");
  }

  function deleteUser(id) {
    if (!window.confirm("Hapus user ini?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setNotice("User berhasil dihapus.");
  }

  return (
    <div className="su-page">
      <div className="su-header">
        <div><h2>Setup User</h2><p>Kelola data pengguna BagSpace</p></div>
        <div className="su-actions">
          <button className="su-btn su-btn-outline" onClick={downloadTemplate}><Download size={15} /> Download Template</button>
          <label className={`su-btn su-btn-outline ${busy ? "su-disabled" : ""}`}>
            <Upload size={15} /> {busy ? "Mengimpor..." : "Import Excel"}
            <input type="file" accept=".xlsx" onChange={importExcel} disabled={busy} hidden />
          </label>
          <button className="su-btn su-btn-primary" onClick={() => setShowForm(true)}><Plus size={15} /> Tambah User</button>
        </div>
      </div>
      {notice && <div className="su-notice" role="status">{notice}</div>}
      <div className="su-summary"><Users size={18} /> Total Pengguna <strong>{users.length}</strong></div>
      <div className="su-card">
        <div className="su-toolbar"><h3>Daftar Pengguna</h3><div className="su-search"><Search size={15} /><input placeholder="Cari nama, NIM/NIP, prodi, atau role..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
        <div className="su-table-scroll"><table className="su-table"><thead><tr><th>No</th><th>Nama Lengkap</th><th>NIM/NIP</th><th>Prodi</th><th>Role</th><th>Aksi</th></tr></thead><tbody>
          {filtered.length ? filtered.map((user, index) => <tr key={user.id ?? `${user.nim}-${index}`}><td>{index + 1}</td><td>{user.nama}</td><td>{user.nim}</td><td>{user.prodi}</td><td>{user.role}</td><td><button className="su-delete" title="Hapus user" onClick={() => deleteUser(user.id)}><Trash2 size={15} /></button></td></tr>) : <tr><td colSpan={6} className="su-empty">Belum ada data pengguna</td></tr>}
        </tbody></table></div>
      </div>
      {showForm && <div className="su-modal-backdrop"><form className="su-modal" onSubmit={addUser}><div className="su-modal-head"><h3>Tambah User</h3><button type="button" onClick={() => setShowForm(false)}><X size={18}/></button></div>
        <label>Nama Lengkap<input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></label>
        <label>NIM/NIP<input required value={form.nim} onChange={(e) => setForm({ ...form, nim: e.target.value })} /></label>
        <label>Prodi<select value={form.prodi} onChange={(e) => setForm({ ...form, prodi: e.target.value })}>{PRODI_OPTIONS.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}</select></label>
        <div className="su-modal-actions"><button type="button" className="su-btn su-btn-outline" onClick={() => setShowForm(false)}>Batal</button><button className="su-btn su-btn-primary" type="submit">Simpan User</button></div>
      </form></div>}
    </div>
  );
}
