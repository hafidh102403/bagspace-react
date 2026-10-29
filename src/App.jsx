import PilihLoker from "./PilihLoker";
import MonitoringLoker from "./MonitoringLoker";
import RiwayatLoker from "./RiwayatLoker";
import SetupUser from "./SetupUser";
import SetupLoker from "./SetupLoker";
import React, { useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  History,
  LockKeyhole,
  Settings,
  Users,
  UserRound,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Sun,
  ChartNoAxesCombined,
  Clock3,
  ArrowLeftRight,
  RotateCcw,
  Grid2X2,
} from "lucide-react";
import "./App.css";
import RiwayatKunjungan from "./RiwayatKunjungan";

const categories = [
  { name: "MLIE", value: 0, color: "#3987ff" },
  { name: "MPIE", value: 0, color: "#16c79a" },
  { name: "PIWAR", value: 0, color: "#ffab19" },
  { name: "Dosen/Tendik", value: 8, color: "#ff4e55" },
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
      setError("Masukkan User ID dan password terlebih dahulu.");
      return;
    }

    const success = onLogin(userId.trim(), password, remember);

    if (!success) {
      setError("User ID atau password salah. Silakan coba lagi.");
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
          <label htmlFor="userId">User ID</label>
          <div className="login-input">
            <UserRound size={17} />
            <input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Masukkan User ID"
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
          Akses khusus petugas perpustakaan
        </p>
      </section>

      <p className="login-copyright">
        © 2026 BagSpace · Perpustakaan Politeknik APP Jakarta
      </p>
    </main>
  );
}

function Sidebar({ activeMenu, setActiveMenu, onLogout, open, close }) {
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
          {menus.slice(0, 2).map((item) => {
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
                <button type="button"
                  className={`sidebar-submenu-link ${activeMenu === "Monitoring Loker" ? "active" : ""}`}
                  onClick={() => navigate("Monitoring Loker")}>
                  <ChartNoAxesCombined size={15} /><span>Monitoring Loker</span>
                </button>
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

          <div className="sidebar-dropdown">
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
          </div>
        </nav>
        <div className="sidebar-bottom">
          <span>By.Hafid24</span>
          <button onClick={onLogout}><LogOut size={15} /> Keluar</button>
        </div>
      </aside>
    </>
  );
}

function VisitorChart() {
  const chartHeight = 180;
  const chartWidth = 460;
  const left = 30;
  const right = 15;
  const top = 15;
  const bottom = 25;
  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;
  const max = 8;

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
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((value) => {
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
                {value}
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
  const [month, setMonth] = useState("October");
  const [year, setYear] = useState("2026");
  const [dateFilter, setDateFilter] = useState("Semua");
  const [appliedFilter, setAppliedFilter] = useState({
    month: "October",
    year: "2026",
    date: "Semua",
  });

  return (
    <div className="dashboard-grid">
      <section className="guide-panel">
        <h2>
          PANDUAN PENGGUNAAN LOKER BARANG PERPUSTAKAAN POLITEKNIK APP JAKARTA
        </h2>

        <h3>PENDAHULUAN</h3>
        <p>
          Selamat datang di <strong>Layanan Loker Barang Perpustakaan Politeknik APP Jakarta</strong>.
          Sebagai bentuk dukungan terhadap keamanan dan kenyamanan, Perpustakaan
          Politeknik APP Jakarta menyediakan fasilitas loker yang dapat digunakan
          oleh pengunjung untuk menyimpan barang bawaan selama berada di lingkungan
          perpustakaan. Pengguna diharapkan mengikuti panduan penggunaan loker
          dengan baik agar fasilitas ini dapat dimanfaatkan secara aman, tertib,
          dan bertanggung jawab.
        </p>

        <h3>LANGKAH PENGGUNAAN</h3>
        <ol>
          <li>Pengguna memulai proses penggunaan loker sesuai dengan ketentuan yang berlaku.</li>
          <li>Pengguna wajib mematuhi Standar Operasional Prosedur (SOP) perpustakaan.</li>
          <li>Pengguna memilih loker yang tersedia untuk digunakan.</li>
          <li>Pengguna mengambil kunci sesuai dengan nomor loker yang telah dipilih.</li>
          <li>Pengguna menyimpan barang ke dalam loker dengan tertib dan aman.</li>
          <li>Pengguna memastikan loker telah dikunci dengan benar setelah digunakan.</li>
          <li>Pengguna mengembalikan kunci loker ke tempat yang telah disediakan.</li>
        </ol>
      </section>

      <section className="statistics-column">
        <div className="filter-panel">
          <h3>
            <ChartNoAxesCombined size={14} /> STATISTIK PENGUNJUNG
          </h3>

          <div className="filter-fields">
            <label>
              TANGGAL
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                <option>Semua</option>
                <option>Hari ini</option>
                <option>Minggu ini</option>
              </select>
            </label>

            <label>
              BULAN
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {[
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>

            <label>
              TAHUN
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option>2025</option>
                <option>2026</option>
                <option>2027</option>
              </select>
            </label>
          </div>

          <button
            className="filter-button"
            onClick={() => setAppliedFilter({ month, year, date: dateFilter })}
          >
            Terapkan Filter
          </button>
        </div>

        <div className="total-card">
          <div>
            <h3>TOTAL PENGUNJUNG</h3>
            <strong>8</strong>
            <p>Semua kategori pengunjung</p>
          </div>
          <Users size={23} />
        </div>

        <VisitorChart />

        <div className="category-grid">
          {categories.map((category) => (
            <article
              className="category-card"
              key={category.name}
              style={{ "--category-color": category.color }}
            >
              <div className="category-heading">
                <strong>{category.name}</strong>
                <Users size={15} />
              </div>
              <b>{category.value}</b>
              <span>Pengunjung</span>
            </article>
          ))}
        </div>

        <p className="statistics-footnote">
          Statistik periode {appliedFilter.date.toLowerCase()}, {appliedFilter.month} {appliedFilter.year}.
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

function Dashboard({ userId, onLogout }) {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
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

          <button className="theme-button" aria-label="Tema">
            <Sun size={17} />
          </button>

          <button
            className="profile-button"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <span className="profile-copy">
              <strong>{userId || "Admin Perpus"}</strong>
              <small>PERPUS@GMAIL.COM</small>
            </span>
            <span className="profile-avatar">A</span>
            <ChevronDown size={13} />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <button onClick={() => { setActiveMenu("Setup User"); setProfileOpen(false); }}>
                <UserRound size={14} /> Profil & Password
              </button>
              <button className="dropdown-logout" onClick={onLogout}>
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </header>

        {activeMenu === "Dashboard" ? (
          <DashboardHome />
        ) : activeMenu === "Riwayat Kunjungan" ? (
          <RiwayatKunjungan userId={userId} isAdmin={userId === "admin"} />
        ) : activeMenu === "Pilih Loker" ? (
          <PilihLoker userId={userId} />
        ) : activeMenu === "Monitoring Loker" ? (
          <MonitoringLoker />
        ) : activeMenu === "Riwayat Loker" ? (
          <RiwayatLoker userId={userId} isAdmin={userId === "admin"} />
        ) : activeMenu === "Setup User" ? (
          <SetupUser />
        ) : activeMenu === "Setup Loker" ? (
          <SetupLoker />
        ) : (
          <OtherPage title={activeMenu} setActiveMenu={setActiveMenu} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState(
    () => localStorage.getItem("bagspace_user") || ""
  );

  function handleLogin(id, password, remember) {
    const validUserId = "admin";
    const validPassword = "BagSpace@2026";

    if (
      id.trim().toLowerCase() !== validUserId ||
      password !== validPassword
    ) {
      return false;
    }

    setUserId(validUserId);
    setLoggedIn(true);

    if (remember) {
      localStorage.setItem("bagspace_user", validUserId);
    } else {
      localStorage.removeItem("bagspace_user");
    }

    return true;
  }

  function handleLogout() {
    setLoggedIn(false);
    setUserId("");
    localStorage.removeItem("bagspace_user");
  }

  return loggedIn ? (
    <Dashboard userId={userId} onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}
