import React, { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Users, X } from "lucide-react";
import "./SetupUser.css";

const KEY = 'bagspace_users_demo_v1';
const ROLES = ['admin_sistem', 'admin_perpus', 'mahasiswa', 'dosen'];
const PRODI = ['MLIE', 'MPIE', 'PIWAR', 'Dosen/Tendik', '-'];
const starter = [{ id: 1, name: 'Administrator', email: 'admin@bagspace.local', identity: 'admin', role: 'admin_sistem', prodi: '-' }];
function readUsers() {
  try { const data = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(data) ? data : starter; }
  catch { return starter; }
}
const blank = { name: '', email: '', identity: '', role: 'mahasiswa', prodi: 'MLIE' };
export default function SetupUser() {
  const [users, setUsers] = useState(readUsers);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const saveUsers = (next) => { setUsers(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const visible = useMemo(() => users.filter(u => [u.name,u.email,u.identity,u.role,u.prodi].some(v => String(v || '').toLowerCase().includes(query.toLowerCase()))), [users, query]);
  const openNew = () => { setEditing(null); setForm({ ...blank }); setError(''); };
  const openEdit = (u) => { setEditing(u.id); setForm({ name:u.name,email:u.email,identity:u.identity,role:u.role,prodi:u.prodi }); setError(''); };
  const submit = (e) => {
    e.preventDefault();
    const cleaned = { ...form, name:form.name.trim(), email:form.email.trim(), identity:form.identity.trim(), prodi: ['admin_sistem','admin_perpus'].includes(form.role) ? '-' : form.role === 'dosen' ? 'Dosen/Tendik' : form.prodi };
    if (!cleaned.name || !cleaned.email || !cleaned.identity) return setError('Nama, email, dan NIM/NIP wajib diisi.');
    if (users.some(u => u.id !== editing && (u.email.toLowerCase() === cleaned.email.toLowerCase() || u.identity === cleaned.identity))) return setError('Email atau NIM/NIP sudah terdaftar.');
    saveUsers(editing === null ? [...users, { ...cleaned, id: Date.now() }] : users.map(u => u.id === editing ? { ...u, ...cleaned } : u));
    setForm(null);
  };
  const remove = (u) => { if (window.confirm(`Hapus pengguna ${u.name}?`)) saveUsers(users.filter(item => item.id !== u.id)); };
  return <div className="su-page">
    <div className="su-header"><div><span className="su-kicker">PENGATURAN SISTEM</span><h2>Setup User</h2><p>Kelola akun pengguna BagSpace.</p></div><button className="su-primary" onClick={openNew}><Plus size={15}/> Tambah User</button></div>
    <div className="su-stats"><div><span>Total User</span><strong>{users.length}</strong></div><div><span>Mahasiswa</span><strong>{users.filter(u => u.role === 'mahasiswa').length}</strong></div><div><span>Dosen/Tendik</span><strong>{users.filter(u => u.role === 'dosen').length}</strong></div><div><span>Admin</span><strong>{users.filter(u => u.role.startsWith('admin')).length}</strong></div></div>
    <section className="su-panel"><div className="su-panel-head"><div><h3><Users size={16}/> Daftar Pengguna</h3><p>{visible.length} pengguna ditemukan</p></div><label className="su-search"><Search size={15}/><input placeholder="Cari nama, email, NIM/NIP..." value={query} onChange={e => setQuery(e.target.value)}/></label></div>
    <div className="su-table-wrap"><table className="su-table"><thead><tr><th>No</th><th>Nama</th><th>Email</th><th>NIM/NIP</th><th>Role</th><th>Prodi</th><th>Aksi</th></tr></thead><tbody>{visible.map((u,i) => <tr key={u.id}><td>{i+1}</td><td>{u.name}</td><td>{u.email}</td><td>{u.identity}</td><td><span className="su-pill">{u.role.replaceAll('_',' ')}</span></td><td>{u.prodi}</td><td><div className="su-actions"><button title="Edit" onClick={() => openEdit(u)}><Pencil size={14}/></button><button title="Hapus" onClick={() => remove(u)}><Trash2 size={14}/></button></div></td></tr>)}{visible.length === 0 && <tr><td colSpan="7" className="su-empty">Tidak ada pengguna ditemukan.</td></tr>}</tbody></table></div></section>
    {form && <div className="su-overlay" onMouseDown={e => { if(e.target===e.currentTarget) setForm(null); }}><form className="su-modal" onSubmit={submit}><div className="su-modal-head"><h3>{editing === null ? 'Tambah Pengguna' : 'Edit Pengguna'}</h3><button type="button" onClick={() => setForm(null)}><X size={18}/></button></div><div className="su-form-grid"><label>Nama Lengkap<input value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></label><label>Email<input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></label><label>NIM / NIP<input value={form.identity} onChange={e => setForm({...form,identity:e.target.value})}/></label><label>Role<select value={form.role} onChange={e => setForm({...form,role:e.target.value})}>{ROLES.map(r => <option key={r} value={r}>{r.replaceAll('_',' ')}</option>)}</select></label><label>Program Studi<select value={form.prodi} onChange={e => setForm({...form,prodi:e.target.value})}>{PRODI.map(p => <option key={p}>{p}</option>)}</select></label></div>{error && <p className="su-error">{error}</p>}<div className="su-modal-footer"><button type="button" onClick={() => setForm(null)}>Batal</button><button type="submit" className="su-primary">Simpan</button></div></form></div>}
  </div>;
}
