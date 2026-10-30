import PilihLoker from "./PilihLoker";
import MonitoringLoker from "./MonitoringLoker";
import RiwayatLoker from "./RiwayatLoker";
import SetupUser from "./SetupUser";
import SetupLoker from "./SetupLoker";
import { getVisitorStats } from "./services/api";
import React, { useEffect, useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  History,
  LockKeyhole,
  Settings,
  Users,
  UserRound,
  UserRoundPen,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ChartNoAxesCombined,
  Clock3,
  ArrowLeftRight,
  RotateCcw,
  Grid2X2,
} from "lucide-react";
import "./App.css";
import "./ProfileEdit.css";
import RiwayatKunjungan from "./RiwayatKunjungan";

const CATEGORY_COLORS = {
  MLIE: "#3987ff",
  MPIE: "#16c79a",
  PIWAR: "#ffab19",
  "Dosen/Tendik": "#ff4e55",
};

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();

    if (!userId.trim() || !password.trim()) {
      setError("Masukkan NIM / ID Admin dan password terlebih dahulu.");
      return;
    }

    const success = onLogin(userId.trim(), password, remember);

    if (!success) {
      setError("NIM / ID Admin atau password salah. Silakan coba lagi.");
      return;
    }

    setError("");
  }

  return (
    <main className="login-page">
      <div className="login-overlay" />

      <section className="login-card">
        <div className="login-logo">
          <BookOpen size={34} />
          <strong>BagSpace</strong>
        </div>

        <div className="login-heading">
          <span>SISTEM PENGELOLAAN LOKER</span>
        </div>

        <form onSubmit={submit}>
          <label htmlFor="userId">NIM / ID Admin</label>
          <div className="login-input">
            <UserRound size={17} />
            <input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Masukkan NIM atau ID Admin"
              autoComplete="username"
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="login-input">
            <LockKeyhole size={17} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Tampilkan atau sembunyikan password"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <label className="remember-row">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Ingat saya
          </label>

          {error && <p className="login-error">{error}</p>}

          <button className="login-button" type="submit">
            MASUK
          </button>
        </form>

        <p className="login-security">
          <LockKeyhole size={12} />
          Akses Admin dan Mahasiswa Perpustakaan
        </p>
      </section>

      <p className="login-copyright">
        © 2026 BagSpace · Perpustakaan Politeknik APP Jakarta
      </p>
    </main>
  );
}

function Sidebar({ activeMenu, setActiveMenu, onLogout, open, close, isAdmin }) {
  const [lokerOpen, setLokerOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  const menus = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Riwayat Kunjungan", icon: Users },
    { label: "Riwayat Loker", icon: History },
  ];
  function navigate(label) {
    setActiveMenu(label);
    close();
  }

  return (
    <>
      {open && (
        <button className="sidebar-backdrop" onClick={close} aria-label="Tutup sidebar" />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo"><BookOpen size={19} /></div>
          <strong>BAGSPACE</strong>
        </div>
        <nav className="sidebar-menu">
          {(isAdmin ? menus.slice(0, 2) : menus.slice(0, 1)).map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label}
                className={`sidebar-link ${activeMenu === item.label ? "active" : ""}`}
                onClick={() => navigate(item.label)}>
                <Icon size={16} /><span>{item.label}</span>
              </button>
            );
          })}

          <div className="sidebar-dropdown">
            <button type="button" aria-expanded={lokerOpen}
              className={`sidebar-link ${["Pilih Loker", "Monitoring Loker"].includes(activeMenu) ? "active" : ""}`}
              onClick={() => setLokerOpen((value) => !value)}>
              <LockKeyhole size={16} />
              <span>Peminjaman Loker</span>
              <ChevronDown size={13} className={`menu-chevron ${lokerOpen ? "rotated" : ""}`} />
            </button>
            {lokerOpen && (
              <div className="sidebar-submenu">
                <button type="button"
                  className={`sidebar-submenu-link ${activeMenu === "Pilih Loker" ? "active" : ""}`}
                  onClick={() => navigate("Pilih Loker")}>
                  <Grid2X2 size={15} /><span>Pilih Loker</span>
                </button>
                {isAdmin && <button type="button"
                  className={`sidebar-submenu-link ${activeMenu === "Monitoring Loker" ? "active" : ""}`}
                  onClick={() => navigate("Monitoring Loker")}>
                  <ChartNoAxesCombined size={15} /><span>Monitoring Loker</span>
                </button>}
              </div>
            )}
          </div>

          {menus.slice(2).map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label}
                className={`sidebar-link ${activeMenu === item.label ? "active" : ""}`}
                onClick={() => navigate(item.label)}>
                <Icon size={16} /><span>{item.label}</span>
                {item.expandable && <ChevronDown size={13} className="menu-chevron" />}
              </button>
            );
          })}

          {isAdmin && <div className="sidebar-dropdown">
            <button
              type="button"
              aria-expanded={setupOpen}
              className={`sidebar-link ${["Setup User", "Setup Loker"].includes(activeMenu) ? "active" : ""}`}
              onClick={() => setSetupOpen((value) => !value)}
            >
              <Settings size={16} />
              <span>Setup</span>
              <ChevronDown size={13} className={`menu-chevron ${setupOpen ? "rotated" : ""}`} />
            </button>
            {setupOpen && (
              <div className="sidebar-submenu">
                <button
                  type="button"
                  className={`sidebar-submenu-link ${activeMenu === "Setup User" ? "active" : ""}`}
                  onClick={() => navigate("Setup User")}
                >
                  <Users size={15} /><span>Setup User</span>
                </button>
                <button
                  type="button"
                  className={`sidebar-submenu-link ${activeMenu === "Setup Loker" ? "active" : ""}`}
                  onClick={() => navigate("Setup Loker")}
                >
                  <LockKeyhole size={15} /><span>Setup Loker</span>
                </button>
              </div>
            )}
          </div>}
        </nav>
        <div className="sidebar-bottom">
          <span>By.Hafid24</span>
          <button onClick={onLogout}><LogOut size={15} /> Keluar</button>
        </div>
      </aside>
    </>
  );
}

function VisitorChart({ categories }) {
  const chartHeight = 180;
  const chartWidth = 460;
  const left = 30;
  const right = 15;
  const top = 15;
  const bottom = 25;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;
  const max = Math.max(1, ...categories.map((item) => item.value));

  const points = categories.map((item, index) => ({
    ...item,
    x: left + (plotWidth / (categories.length - 1)) * index,
    y: top + plotHeight - (item.value / max) * plotHeight,
  }));

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath =
    path +
    ` L ${points[points.length - 1].x} ${top + plotHeight}` +
    ` L ${points[0].x} ${top + plotHeight} Z`;

  return (
    <div className="chart-container">
      <div className="chart-heading">
        <span>
          <ChartNoAxesCombined size={14} /> JUMLAH PENGUNJUNG
        </span>
        <small>Berdasarkan kategori</small>
      </div>

      <svg
        className="visitor-chart"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Grafik jumlah pengunjung berdasarkan kategori"
      >
        {Array.from({ length: 5 }, (_, i) => (max / 4) * i).map((value) => {
          const y = top + plotHeight - (value / max) * plotHeight;

          return (
            <g key={value}>
              <line
                x1={left}
                y1={y}
                x2={chartWidth - right}
                y2={y}
                stroke="#344154"
                strokeWidth="1"
              />
              <text x="17" y={y + 4} fill="#91a0b8" fontSize="10" textAnchor="middle">
                {Number.isInteger(value) ? value : value.toFixed(1)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="#3478ed" opacity=".12" />
        <path
          d={path}
          fill="none"
          stroke="#3987ff"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point) => (
          <g key={point.name}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill={point.color}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text
              x={point.x}
              y={chartHeight - 4}
              fill="#a6b3c8"
              fontSize="10"
              fontWeight="600"
              textAnchor="middle"
            >
              {point.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function DashboardHome() {
  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December",
  ];

  const now = new Date();

  const [month, setMonth] = useState(months[now.getMonth()]);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [dateFilter, setDateFilter] = useState("Semua");

  const [appliedFilter, setAppliedFilter] = useState({
    month: months[now.getMonth()],
    year: String(now.getFullYear()),
    date: "Semua",
  });

  const [stats, setStats] = useState({
    total: 0,
    categories: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadStatistics() {
      setLoading(true);
      setError("");

      try {
        const monthNumber = months.indexOf(appliedFilter.month) + 1;

        const result = await getVisitorStats(
          monthNumber,
          Number(appliedFilter.year),
          appliedFilter.date
        );

        if (!cancelled) {
          setStats({
            total: Number(result.total || 0),
            categories: result.categories || {},
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Gagal mengambil statistik");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStatistics();

    return () => {
      cancelled = true;
    };
  }, [appliedFilter, refreshCount]);

  const categories = [
    {
      name: "MLIE",
      value: Number(stats.categories["MLIE"] || 0),
      color: "#3987ff",
    },
    {
      name: "MPIE",
      value: Number(stats.categories["MPIE"] || 0),
      color: "#16c79a",
    },
    {
      name: "PIWAR",
      value: Number(stats.categories["PIWAR"] || 0),
      color: "#ffab19",
    },
    {
      name: "Dosen/Tendik",
      value: Number(stats.categories["Dosen/Tendik"] || 0),
      color: "#ff4e55",
    },
  ];

  return (
    <div className="dashboard-grid">
      <section className="guide-panel">
        <h2>
          PANDUAN PENGGUNAAN LOKER BARANG PERPUSTAKAAN POLITEKNIK APP JAKARTA
        </h2>

        <h3>PENDAHULUAN</h3>

        <p>
          Selamat datang di{" "}
          <strong>
            Layanan Loker Barang Perpustakaan Politeknik APP Jakarta
          </strong>.
          Sebagai bentuk dukungan terhadap keamanan dan kenyamanan,
          Perpustakaan Politeknik APP Jakarta menyediakan fasilitas loker
          yang dapat digunakan oleh pengunjung untuk menyimpan barang
          bawaan selama berada di lingkungan perpustakaan. Pengguna
          diharapkan mengikuti panduan penggunaan loker dengan baik agar
          fasilitas ini dapat dimanfaatkan secara aman, tertib, dan
          bertanggung jawab.
        </p>

        <h3>LANGKAH PENGGUNAAN</h3>

        <ol>
          <li>
            Pengguna memulai proses penggunaan loker sesuai dengan
            ketentuan yang berlaku.
          </li>
          <li>
            Pengguna wajib mematuhi Standar Operasional Prosedur (SOP)
            perpustakaan.
          </li>
          <li>
            Pengguna memilih loker yang tersedia untuk digunakan.
          </li>
          <li>
            Pengguna mengambil kunci sesuai dengan nomor loker yang
            telah dipilih.
          </li>
          <li>
            Pengguna menyimpan barang ke dalam loker dengan tertib
            dan aman.
          </li>
          <li>
            Pengguna memastikan loker telah dikunci dengan benar
            setelah digunakan.
          </li>
          <li>
            Pengguna mengembalikan kunci loker ke tempat yang
            telah disediakan.
          </li>
        </ol>
      </section>

      <section className="statistics-column">
        <div className="filter-panel">
          <h3>
            <ChartNoAxesCombined size={14} />
            STATISTIK PENGUNJUNG
          </h3>

          <div className="filter-fields">
            <label>
              TANGGAL
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option>Semua</option>
                <option>Hari ini</option>
                <option>Minggu ini</option>
              </select>
            </label>

            <label>
              BULAN
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {months.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              TAHUN
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {Array.from({ length: 7 }, (_, index) => now.getFullYear() - 4 + index).map((value) => (
                  <option key={value} value={String(value)}>{value}</option>
                ))}
              </select>
            </label>
          </div>

          <button
            className="filter-button"
            onClick={() =>
              setAppliedFilter({
                month,
                year,
                date: dateFilter,
              })
            }
          >
            Terapkan Filter
          </button>

          <button
            type="button"
            className="filter-button"
            onClick={() => setRefreshCount((count) => count + 1)}
            disabled={loading}
            title="Muat ulang statistik dari database"
          >
            <RotateCcw size={13} /> {loading ? "Memuat..." : "Refresh Data"}
          </button>

          {error && (
            <p role="alert" style={{ color: "#ff4e55", fontSize: 12 }}>
              Gagal memuat statistik: {error}. Pastikan API visitor_stats.php aktif.
            </p>
          )}
        </div>

        <div className="total-card">
          <div>
            <h3>TOTAL PENGUNJUNG</h3>

            <strong>
              {loading ? "..." : stats.total.toLocaleString("id-ID")}
            </strong>

            <p>Semua kategori pengunjung</p>
          </div>

          <Users size={23} />
        </div>

        <VisitorChart categories={categories} />

        <div className="category-grid">
          {categories.map((category) => (
            <article
              className="category-card"
              key={category.name}
              style={{
                "--category-color": category.color,
              }}
            >
              <div className="category-heading">
                <strong>{category.name}</strong>
                <Users size={15} />
              </div>

              <b>
                {loading ? "..." : category.value.toLocaleString("id-ID")}
              </b>

              <span>Pengunjung</span>
            </article>
          ))}
        </div>

        <p className="statistics-footnote">
          Statistik periode{" "}
          {appliedFilter.date.toLowerCase()},{" "}
          {appliedFilter.month} {appliedFilter.year}.
        </p>
      </section>
    </div>
  );
}

function OtherPage({ title, setActiveMenu }) {
  const Icon =
    title === "Peminjaman Loker"
      ? ArrowLeftRight
      : title === "Riwayat Loker"
        ? History
        : title === "Riwayat Kunjungan"
          ? Users
          : title === "Setup"
            ? Settings
            : Grid2X2;

  return (
    <div className="other-page">
      <div className="other-page-icon"><Icon size={30} /></div>
      <h2>{title}</h2>
      <p>Halaman ini akan dibuat pada tahap pengembangan berikutnya.</p>
      <button onClick={() => setActiveMenu("Dashboard")}>Kembali ke Dashboard</button>
    </div>
  );
}

// DEMO LOKAL: data akun disimpan di browser, bukan sistem autentikasi produksi.
const ACCOUNTS_KEY = "bagspace_demo_accounts_v1";
const SESSION_KEY = "bagspace_demo_session_v1";
const DEFAULT_ADMIN_ACCOUNT = { id: "admin", name: "Admin Perpus", role: "admin", prodi: "-", password: "123456" };
const ADMIN_PROFILE_KEY = "bagspace_demo_admin_profile_v1";
function loadAdminAccount() {
  try {
    const stored = JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY) || "null");
    return stored && typeof stored.name === "string" && typeof stored.password === "string"
      ? { ...DEFAULT_ADMIN_ACCOUNT, name: stored.name, password: stored.password }
      : DEFAULT_ADMIN_ACCOUNT;
  } catch { return DEFAULT_ADMIN_ACCOUNT; }
}
const ADMIN_MENUS = ["Dashboard", "Pilih Loker", "Monitoring Loker", "Riwayat Loker", "Riwayat Kunjungan", "Setup User", "Setup Loker"];
const USER_MENUS = ["Dashboard", "Pilih Loker", "Riwayat Loker"];

function loadAccounts() {
  try {
    const setupUsers = JSON.parse(localStorage.getItem("bagspace_users") || "[]");
    const savedAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
    const profiles = Array.isArray(savedAccounts) ? savedAccounts : [];
    const users = Array.isArray(setupUsers) ? setupUsers : [];
    const byId = new Map();

    for (const item of profiles) {
      const id = String(item?.id || "").trim();
      if (id && id.toLowerCase() !== "admin") byId.set(id, { ...item, id, role: "user" });
    }

    for (const user of users) {
      const id = String(user?.nim_nip ?? user?.nimNip ?? user?.nim ?? user?.id ?? "").trim();
      if (!id || id.toLowerCase() === "admin") continue;
      const previous = byId.get(id) || {};
      byId.set(id, {
        ...previous,
        id,
        name: previous.profileEdited
          ? previous.name
          : String(user?.nama_lengkap ?? user?.namaLengkap ?? user?.name ?? user?.nama ?? previous.name ?? "Mahasiswa"),
        prodi: user?.prodi ?? previous.prodi ?? "-",
        role: "user",
        password: previous.passwordChanged ? previous.password : "123456",
        passwordChanged: Boolean(previous.passwordChanged),
      });
    }

    return [...byId.values()];
  } catch (error) {
    console.error("Gagal membaca akun BagSpace:", error);
    return [];
  }
}

function EditProfileModal({ account, onClose, onSave }) {
  const [name, setName] = useState(account.name || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    setError("");
    if (!name.trim()) return setError("Nama lengkap wajib diisi.");
    const wantsPassword = Boolean(oldPassword || newPassword || confirmPassword);
    if (wantsPassword) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        return setError("Lengkapi semua kolom password untuk mengganti password.");
      }
      if (newPassword.length < 8) return setError("Password baru minimal 8 karakter.");
      if (newPassword !== confirmPassword) return setError("Konfirmasi password baru tidak cocok.");
    }
    const result = onSave({ name: name.trim(), oldPassword, newPassword });
    if (!result.ok) return setError(result.message);
    onClose();
  }

  return (
    <div className="profile-edit-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="profile-edit-modal" onSubmit={submit}>
        <div className="profile-edit-heading">
          <div><h2>Edit Profil</h2><p>Perbarui informasi akun dan password</p></div>
          <button type="button" onClick={onClose} aria-label="Tutup">×</button>
        </div>
        <label>Nama Lengkap
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
        </label>
        <label>NIM / ID Pengguna
          <input value={account.id} readOnly title="ID login tidak dapat diubah di sini" />
        </label>
        <div className="profile-edit-section-title">Ganti Password <span>(opsional)</span></div>
        <p className="profile-edit-hint">Kosongkan ketiga kolom jika tidak ingin mengganti password.</p>
        <label>Password Lama
          <input type={showPasswords ? "text" : "password"} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} autoComplete="current-password" />
        </label>
        <label>Password Baru
          <input type={showPasswords ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
        </label>
        <label>Konfirmasi Password Baru
          <input type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
        </label>
        <label className="profile-edit-show"><input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} /> Tampilkan password</label>
        {error && <div className="profile-edit-error" role="alert">{error}</div>}
        <div className="profile-edit-actions">
          <button type="button" onClick={onClose}>Batal</button>
          <button type="submit">Simpan Perubahan</button>
        </div>
      </form>
    </div>
  );
}

function Dashboard({ account, onLogout, onSaveProfile }) {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const userId = account.id;
  const isAdmin = account.role === "admin";
  const allowedMenus = isAdmin ? ADMIN_MENUS : USER_MENUS;
  const currentMenu = allowedMenus.includes(activeMenu) ? activeMenu : "Dashboard";
  const navigate = (menu) => { if (allowedMenus.includes(menu)) setActiveMenu(menu); };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("bagspace_theme") === "light" ? "light" : "dark"; }
    catch { return "dark"; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.classList.toggle("light-mode", theme === "light");
    try { localStorage.setItem("bagspace_theme", theme); } catch { /* Storage disabled */ }
  }, [theme]);

  const toggleTheme = () => setTheme((previous) => previous === "dark" ? "light" : "dark");


  return (
    <div className="dashboard-shell">
      <Sidebar
        activeMenu={currentMenu}
        setActiveMenu={navigate}
        isAdmin={isAdmin}
        onLogout={onLogout}
        open={sidebarOpen}
        close={() => setSidebarOpen(false)}
      />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <button
            className="mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={20} />
          </button>

          <button className="header-menu-button" aria-label="Menu">
            <Menu size={18} />
          </button>

          <div className="header-spacer" />

          <button
            type="button"
            className="theme-button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Aktifkan Light Mode" : "Aktifkan Dark Mode"}
            title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            aria-pressed={theme === "light"}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            className="profile-button"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <span className="profile-copy">
              <strong>{account.name}</strong>
              <small>{isAdmin ? "ADMIN" : `${account.id} · ${account.prodi || "Mahasiswa"}`}</small>
            </span>
            <span className="profile-avatar">{account.name.charAt(0).toUpperCase()}</span>
            <ChevronDown size={13} />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <button onClick={() => { setEditingProfile(true); setProfileOpen(false); }}>
                <UserRoundPen size={14} /> Edit Profil
              </button>
              <button className="dropdown-logout" onClick={onLogout}>
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </header>
        {editingProfile && (
          <EditProfileModal account={account} onClose={() => setEditingProfile(false)} onSave={onSaveProfile} />
        )}

        {currentMenu === "Dashboard" ? (
          <DashboardHome />
        ) : currentMenu === "Riwayat Kunjungan" ? (
          <RiwayatKunjungan userId={userId} isAdmin={isAdmin} />
        ) : currentMenu === "Pilih Loker" ? (
          <PilihLoker user={account} />
        ) : currentMenu === "Monitoring Loker" ? (
          <MonitoringLoker />
        ) : currentMenu === "Riwayat Loker" ? (
          <RiwayatLoker userId={userId} isAdmin={isAdmin} currentUser={account} />
        ) : currentMenu === "Setup User" ? (
          <SetupUser />
        ) : currentMenu === "Setup Loker" ? (
          <SetupLoker />
        ) : (
          <OtherPage title={currentMenu} setActiveMenu={navigate} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [account, setAccount] = useState(() => {
    try {
      const id = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (!id) return null;
      const found = id === "admin"
        ? loadAdminAccount()
        : loadAccounts().find((item) => item.id === id);
      if (!found) return null;
      const { password: _hidden, ...safeAccount } = found;
      return safeAccount;
    } catch {
      return null;
    }
  });

  function handleLogin(id, password, remember) {
    const key = String(id).trim();
    const found = key.toLowerCase() === "admin"
      ? loadAdminAccount()
      : loadAccounts().find((item) => item.id === key);

    if (!found) return false;
    // Login admin tetap menggunakan password yang sebelumnya tersimpan.
    const expectedPassword = found.role === "admin"
      ? found.password
      : found.passwordChanged ? found.password : "123456";
    if (password !== expectedPassword) return false;

    const { password: _hidden, ...safeAccount } = found;
    setAccount(safeAccount);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, found.id);
    return true;
  }

  function handleSaveProfile({ name, oldPassword, newPassword }) {
    const current = account?.id === "admin"
      ? loadAdminAccount()
      : loadAccounts().find((item) => item.id === account?.id);
    if (!current) return { ok: false, message: "Akun tidak ditemukan." };

    const expectedPassword = current.role === "admin"
      ? current.password
      : current.passwordChanged ? current.password : "123456";
    if (newPassword && oldPassword !== expectedPassword) {
      return { ok: false, message: "Password lama salah." };
    }

    const updated = {
      ...current,
      name,
      ...(current.role !== "admin" ? { profileEdited: true } : {}),
      ...(newPassword ? { password: newPassword, ...(current.role !== "admin" ? { passwordChanged: true } : {}) } : {}),
    };

    try {
      if (updated.role === "admin") {
        localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify({ name: updated.name, password: updated.password }));
      } else {
        const existing = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
        const saved = Array.isArray(existing) ? existing : [];
        const next = saved.filter((item) => String(item.id) !== updated.id);
        next.push(updated);
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
      }
      const { password: _hidden, ...safeAccount } = updated;
      setAccount(safeAccount);
      return { ok: true };
    } catch {
      return { ok: false, message: "Gagal menyimpan perubahan di browser." };
    }
  }

  function handleLogout() {
    setAccount(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("bagspace_user");
  }

  return account ? (
    <Dashboard
      account={account}
      onLogout={handleLogout}
      onSaveProfile={handleSaveProfile}
    />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}
