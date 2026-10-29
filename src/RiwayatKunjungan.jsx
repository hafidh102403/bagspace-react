
import React, { useMemo, useState } from "react";
import {
  Search,
  RotateCcw,
  Download,
  CalendarDays,
  Users,
  GraduationCap,
  UserRound,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./RiwayatKunjungan.css";

const dataKunjungan = [
  { id: 1, nama: "Ahmad Fauzi", nim: "202301001", role: "Mahasiswa", prodi: "MLIE", tanggal: "2026-10-29", masuk: "08:15", keluar: "10:30" },
  { id: 2, nama: "Siti Nurhaliza", nim: "202302002", role: "Mahasiswa", prodi: "MPIE", tanggal: "2026-10-29", masuk: "09:00", keluar: "11:20" },
  { id: 3, nama: "Rizky Pratama", nim: "202303003", role: "Mahasiswa", prodi: "PIWAR", tanggal: "2026-10-28", masuk: "10:10", keluar: "12:00" },
  { id: 4, nama: "Budi Santoso", nim: "198501001", role: "Dosen/Tendik", prodi: "Dosen/Tendik", tanggal: "2026-10-28", masuk: "08:30", keluar: "09:45" },
  { id: 5, nama: "Dina Maharani", nim: "202301005", role: "Mahasiswa", prodi: "MLIE", tanggal: "2026-10-27", masuk: "11:00", keluar: "13:20" },
  { id: 6, nama: "Fajar Ramadhan", nim: "202302006", role: "Mahasiswa", prodi: "MPIE", tanggal: "2026-10-27", masuk: "09:15", keluar: "11:00" },
  { id: 7, nama: "Putri Amelia", nim: "202303007", role: "Mahasiswa", prodi: "PIWAR", tanggal: "2026-10-26", masuk: "08:45", keluar: "10:15" },
  { id: 8, nama: "Andi Wijaya", nim: "198602008", role: "Dosen/Tendik", prodi: "Dosen/Tendik", tanggal: "2026-10-26", masuk: "13:00", keluar: "14:30" },
  { id: 9, nama: "Nadia Safitri", nim: "202301009", role: "Mahasiswa", prodi: "MLIE", tanggal: "2026-10-25", masuk: "10:00", keluar: "12:00" },
  { id: 10, nama: "Reza Pratama", nim: "202302010", role: "Mahasiswa", prodi: "MPIE", tanggal: "2026-10-25", masuk: "09:30", keluar: "11:45" },
];

function formatTanggal(tanggal) {
  if (!tanggal) return "-";
  return new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RiwayatKunjungan({
  userId = "",
  isAdmin = false,
}) {
  const [search, setSearch] = useState("");
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [role, setRole] = useState("");
  const [prodi, setProdi] = useState("");
  const [page, setPage] = useState(1);

  const perPage = 7;

  const dataFiltered = useMemo(() => {
    return dataKunjungan
      .filter((item) => {
        if (!isAdmin && item.nim !== userId) return false;

        const keyword = search.toLowerCase();

        return (
          (item.nama.toLowerCase().includes(keyword) ||
            item.nim.toLowerCase().includes(keyword)) &&
          (!tanggalAwal || item.tanggal >= tanggalAwal) &&
          (!tanggalAkhir || item.tanggal <= tanggalAkhir) &&
          (!role || item.role === role) &&
          (!prodi || item.prodi === prodi)
        );
      })
      .sort((a, b) =>
        b.tanggal.localeCompare(a.tanggal) ||
        b.masuk.localeCompare(a.masuk)
      );
  }, [search, tanggalAwal, tanggalAkhir, role, prodi, userId, isAdmin]);

  const totalPages = Math.max(
    1,
    Math.ceil(dataFiltered.length / perPage)
  );

  const currentPage = Math.min(page, totalPages);

  const currentData = dataFiltered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const totalMahasiswa = dataFiltered.filter(
    (item) => item.role === "Mahasiswa"
  ).length;

  const totalDosen = dataFiltered.filter(
    (item) => item.role === "Dosen/Tendik"
  ).length;

  function resetFilter() {
    setSearch("");
    setTanggalAwal("");
    setTanggalAkhir("");
    setRole("");
    setProdi("");
    setPage(1);
  }

  function exportExcel() {
    if (!isAdmin) return;

    const headers = [
      "No",
      "Nama",
      "NIM/NIP",
      "Role",
      "Prodi",
      "Tanggal",
      "Jam Masuk",
      "Jam Keluar",
    ];

    const rows = dataFiltered.map((item, index) => [
      index + 1,
      item.nama,
      item.nim,
      item.role,
      item.prodi,
      item.tanggal,
      item.masuk,
      item.keluar,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Riwayat_Kunjungan_BagSpace.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rk-container">
      <div className="rk-top">
        <div>
          <h2>Riwayat Kunjungan</h2>
          <p>
            Monitoring dan pengelolaan data kunjungan
            perpustakaan
          </p>
        </div>

        {isAdmin && (
          <button className="rk-btn-export" onClick={exportExcel}>
            <Download size={15} />
            Export Excel
          </button>
        )}
      </div>

      <div className="rk-stats">
        <div className="rk-stat-card">
          <div className="rk-stat-info">
            <span>Total Kunjungan</span>
            <strong>{dataFiltered.length}</strong>
            <small>Seluruh data sesuai filter</small>
          </div>
          <div className="rk-stat-icon blue">
            <Users size={20} />
          </div>
        </div>

        <div className="rk-stat-card">
          <div className="rk-stat-info">
            <span>Mahasiswa</span>
            <strong>{totalMahasiswa}</strong>
            <small>Kunjungan mahasiswa</small>
          </div>
          <div className="rk-stat-icon green">
            <GraduationCap size={20} />
          </div>
        </div>

        <div className="rk-stat-card">
          <div className="rk-stat-info">
            <span>Dosen / Tendik</span>
            <strong>{totalDosen}</strong>
            <small>Kunjungan dosen dan tendik</small>
          </div>
          <div className="rk-stat-icon orange">
            <UserRound size={20} />
          </div>
        </div>
      </div>

      <div className="rk-main-card">
        <div className="rk-card-header">
          <div>
            <h3>Daftar Riwayat Kunjungan</h3>
            <p>Informasi aktivitas pengunjung perpustakaan</p>
          </div>
          <span className="rk-count">
            {dataFiltered.length} Data
          </span>
        </div>

        <div className="rk-filter-section">
          <div className="rk-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Cari nama atau NIM/NIP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="rk-date-box">
            <CalendarDays size={14} />
            <input
              type="date"
              value={tanggalAwal}
              max={tanggalAkhir || undefined}
              onChange={(e) => {
                setTanggalAwal(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="rk-date-box">
            <CalendarDays size={14} />
            <input
              type="date"
              value={tanggalAkhir}
              min={tanggalAwal || undefined}
              onChange={(e) => {
                setTanggalAkhir(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua Role</option>
            <option value="Mahasiswa">Mahasiswa</option>
            <option value="Dosen/Tendik">Dosen/Tendik</option>
          </select>

          <select
            value={prodi}
            onChange={(e) => {
              setProdi(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Semua Prodi</option>
            <option value="MLIE">MLIE</option>
            <option value="MPIE">MPIE</option>
            <option value="PIWAR">PIWAR</option>
            <option value="Dosen/Tendik">Dosen/Tendik</option>
          </select>

          <button className="rk-reset" onClick={resetFilter}>
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        <div className="rk-table-wrapper">
          <table className="rk-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Pengunjung</th>
                <th>NIM / NIP</th>
                <th>Role</th>
                <th>Prodi</th>
                <th>Tanggal</th>
                <th>Jam Masuk</th>
                <th>Jam Keluar</th>
              </tr>
            </thead>

            <tbody>
              {currentData.length > 0 ? (
                currentData.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      {(currentPage - 1) * perPage + index + 1}
                    </td>
                    <td className="rk-name">{item.nama}</td>
                    <td>{item.nim}</td>
                    <td>
                      <span
                        className={`rk-role ${
                          item.role === "Mahasiswa"
                            ? "mahasiswa"
                            : "dosen"
                        }`}
                      >
                        {item.role}
                      </span>
                    </td>
                    <td>{item.prodi}</td>
                    <td>{formatTanggal(item.tanggal)}</td>
                    <td>{item.masuk}</td>
                    <td>{item.keluar || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="rk-empty">
                    <Users size={27} />
                    <p>Belum ada data kunjungan</p>
                    <small>
                      Data kunjungan tidak ditemukan.
                    </small>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rk-footer">
          <span>
            Menampilkan {currentData.length} dari{" "}
            {dataFiltered.length} data
          </span>

          <div className="rk-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={16} />
            </button>

            <span>
              {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
