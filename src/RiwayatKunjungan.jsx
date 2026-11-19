
import React, { useEffect, useMemo, useState } from "react";
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

// =====================================================
// KONFIGURASI API
// =====================================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost/bagspace-api"
).replace(/\/+$/, "");

const HISTORY_API = `${API_URL}/visitor_history.php`;

// =====================================================
// FORMAT DATA DARI DATABASE
// =====================================================

function normalizeRole(role) {
  const value = String(role || "").toLowerCase().trim();

  if (value === "mahasiswa") {
    return "Mahasiswa";
  }

  if (
    value === "dosen" ||
    value === "dosen_tendik" ||
    value === "dosen/tendik" ||
    value === "tendik"
  ) {
    return "Dosen/Tendik";
  }

  return role || "-";
}

function normalizeVisit(item) {
  return {
    id: item.id,
    nama: item.nama || "-",
    nim: String(item.nim || ""),
    role: normalizeRole(item.role),
    prodi: item.prodi || "-",
    tanggal: item.tanggal
      ? String(item.tanggal).slice(0, 10)
      : "",
    masuk: item.masuk || "-",
    keluar: item.keluar || "-",
  };
}

function formatTanggal(tanggal) {
  if (!tanggal) return "-";

  const date = new Date(`${tanggal}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =====================================================
// KOMPONEN RIWAYAT KUNJUNGAN
// =====================================================

export default function RiwayatKunjungan({
  userId = "",
  isAdmin = false,
}) {
  // Data dari database
  const [dataKunjungan, setDataKunjungan] = useState([]);

  // Status API
  const [loading, setLoading] = useState(true);
  const [errorAPI, setErrorAPI] = useState("");

  // Filter
  const [search, setSearch] = useState("");
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [role, setRole] = useState("");
  const [prodi, setProdi] = useState("");
  const [page, setPage] = useState(1);

  const perPage = 7;

  // =====================================================
  // MENGAMBIL DATA DARI DATABASE
  // =====================================================

  async function loadRiwayatKunjungan() {
    try {
      setLoading(true);
      setErrorAPI("");

      const response = await fetch(HISTORY_API, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Gagal mengambil data kunjungan."
        );
      }

      if (!Array.isArray(result.data)) {
        throw new Error(
          "Format data riwayat kunjungan tidak sesuai."
        );
      }

      const formattedData = result.data.map(normalizeVisit);

      setDataKunjungan(formattedData);
    } catch (error) {
      console.error("Gagal mengambil riwayat kunjungan:", error);

      setErrorAPI(
        error.message ||
          "Tidak dapat terhubung ke server BagSpace."
      );

      setDataKunjungan([]);
    } finally {
      setLoading(false);
    }
  }

  // Ambil data saat halaman dibuka
  useEffect(() => {
    loadRiwayatKunjungan();
  }, []);

  // =====================================================
  // FILTER DATA
  // =====================================================

  const dataFiltered = useMemo(() => {
    return dataKunjungan
      .filter((item) => {
        // Pengguna biasa hanya melihat riwayat miliknya
        if (!isAdmin && String(item.nim) !== String(userId)) {
          return false;
        }

        const keyword = search.toLowerCase().trim();

        const cocokPencarian =
          item.nama.toLowerCase().includes(keyword) ||
          item.nim.toLowerCase().includes(keyword);

        const cocokTanggalAwal =
          !tanggalAwal || item.tanggal >= tanggalAwal;

        const cocokTanggalAkhir =
          !tanggalAkhir || item.tanggal <= tanggalAkhir;

        const cocokRole =
          !role || item.role === role;

        const cocokProdi =
          !prodi || item.prodi === prodi;

        return (
          cocokPencarian &&
          cocokTanggalAwal &&
          cocokTanggalAkhir &&
          cocokRole &&
          cocokProdi
        );
      })
      .sort((a, b) => {
        return (
          b.tanggal.localeCompare(a.tanggal) ||
          b.masuk.localeCompare(a.masuk)
        );
      });
  }, [
    dataKunjungan,
    search,
    tanggalAwal,
    tanggalAkhir,
    role,
    prodi,
    userId,
    isAdmin,
  ]);

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages = Math.max(
    1,
    Math.ceil(dataFiltered.length / perPage)
  );

  const currentPage = Math.min(page, totalPages);

  const currentData = dataFiltered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // =====================================================
  // STATISTIK
  // =====================================================

  const totalMahasiswa = dataFiltered.filter(
    (item) => item.role === "Mahasiswa"
  ).length;

  const totalDosen = dataFiltered.filter(
    (item) => item.role === "Dosen/Tendik"
  ).length;

  // =====================================================
  // RESET FILTER
  // =====================================================

  function resetFilter() {
    setSearch("");
    setTanggalAwal("");
    setTanggalAkhir("");
    setRole("");
    setProdi("");
    setPage(1);
  }

  // =====================================================
  // EXPORT EXCEL
  // =====================================================

  async function exportExcel() {
    if (!isAdmin) return;

    if (dataFiltered.length === 0) {
      alert("Tidak ada data kunjungan untuk diekspor.");
      return;
    }

    try {
      const ExcelJS = (await import("exceljs")).default;

      const workbook = new ExcelJS.Workbook();

      workbook.creator = "BagSpace";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet(
        "Riwayat Kunjungan",
        {
          views: [{ state: "frozen", ySplit: 6 }],
          pageSetup: {
            paperSize: 9,
            orientation: "landscape",
            fitToPage: true,
            fitToWidth: 1,
          },
        }
      );

      const widths = [8, 28, 20, 19, 20, 18, 15, 15];

      widths.forEach((width, index) => {
        sheet.getColumn(index + 1).width = width;
      });

      // Judul
      sheet.mergeCells("A1:H2");

      const titleCell = sheet.getCell("A1");

      titleCell.value = "LAPORAN RIWAYAT KUNJUNGAN";

      titleCell.font = {
        name: "Calibri",
        size: 17,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };

      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A8A" },
      };

      titleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      sheet.getRow(1).height = 25;
      sheet.getRow(2).height = 18;

      // Subjudul
      sheet.mergeCells("A3:H3");

      const subtitle = sheet.getCell("A3");

      subtitle.value =
        "PERPUSTAKAAN POLITEKNIK APP JAKARTA • BAGSPACE";

      subtitle.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FF1E40AF" },
      };

      subtitle.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      sheet.getRow(3).height = 24;

      // Informasi filter
      sheet.mergeCells("A4:H4");

      const filterInfo = sheet.getCell("A4");

      filterInfo.value =
        `Filter: ${search || "Semua nama"} | ` +
        `${tanggalAwal || "Awal"} s.d. ${tanggalAkhir || "Akhir"} | ` +
        `${role || "Semua role"} | ${prodi || "Semua prodi"}`;

      filterInfo.font = {
        name: "Calibri",
        size: 10,
        italic: true,
        color: { argb: "FF475569" },
      };

      sheet.getRow(4).height = 22;

      // Total data
      sheet.mergeCells("A5:H5");

      const countInfo = sheet.getCell("A5");

      countInfo.value =
        `Total data: ${dataFiltered.length} kunjungan`;

      countInfo.font = {
        name: "Calibri",
        size: 10,
        bold: true,
        color: { argb: "FF0F172A" },
      };

      sheet.getRow(5).height = 22;

      // Header tabel
      const headers = [
        "No",
        "Nama Pengunjung",
        "NIM / NIP",
        "Role",
        "Prodi",
        "Tanggal",
        "Jam Masuk",
        "Jam Keluar",
      ];

      const headerRow = sheet.getRow(6);

      headerRow.values = headers;
      headerRow.height = 27;

      headerRow.eachCell((cell) => {
        cell.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2563EB" },
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };

        cell.border = {
          bottom: {
            style: "thin",
            color: { argb: "FF93C5FD" },
          },
        };
      });

      // Isi data
      dataFiltered.forEach((item, index) => {
        const row = sheet.addRow([
          index + 1,
          item.nama,
          String(item.nim),
          item.role,
          item.prodi,
          item.tanggal,
          item.masuk || "-",
          item.keluar || "-",
        ]);

        row.height = 23;

        row.eachCell((cell, colNumber) => {
          cell.font = {
            name: "Calibri",
            size: 10,
            color: { argb: "FF0F172A" },
          };

          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb:
                index % 2 === 0
                  ? "FFF1F5F9"
                  : "FFFFFFFF",
            },
          };

          cell.alignment = {
            vertical: "middle",
            horizontal: [1, 6, 7, 8].includes(colNumber)
              ? "center"
              : "left",
          };

          cell.border = {
            bottom: {
              style: "hair",
              color: { argb: "FFE2E8F0" },
            },
          };
        });

        row.getCell(3).numFmt = "@";
      });

      sheet.autoFilter = {
        from: "A6",
        to: `H${Math.max(6, 6 + dataFiltered.length)}`,
      };

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        `Riwayat_Kunjungan_BagSpace_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Export Excel gagal:", error);

      alert(
        "Gagal export Excel. Pastikan paket exceljs sudah terpasang."
      );
    }
  }

  // =====================================================
  // TAMPILAN
  // =====================================================

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
          <button
            className="rk-btn-export"
            onClick={exportExcel}
            disabled={loading || dataFiltered.length === 0}
          >
            <Download size={15} />
            Export Excel
          </button>
        )}
      </div>

      {/* STATISTIK */}

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

      {/* KARTU UTAMA */}

      <div className="rk-main-card">
        <div className="rk-card-header">
          <div>
            <h3>Daftar Riwayat Kunjungan</h3>
            <p>
              Informasi aktivitas pengunjung perpustakaan
            </p>
          </div>

          <span className="rk-count">
            {dataFiltered.length} Data
          </span>
        </div>

        {/* FILTER */}

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

          <button
            className="rk-reset"
            onClick={resetFilter}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        {/* STATUS API */}

        {errorAPI && (
          <div
            style={{
              margin: "12px 0",
              padding: "12px 15px",
              borderRadius: "8px",
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: "13px",
            }}
          >
            Gagal mengambil data kunjungan: {errorAPI}

            <button
              onClick={loadRiwayatKunjungan}
              style={{
                marginLeft: "12px",
                border: "none",
                background: "transparent",
                color: "#991b1b",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* TABEL */}

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
              {loading ? (
                <tr>
                  <td colSpan="8" className="rk-empty">
                    <p>Memuat data kunjungan...</p>
                  </td>
                </tr>
              ) : currentData.length > 0 ? (
                currentData.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      {(currentPage - 1) * perPage + index + 1}
                    </td>

                    <td className="rk-name">
                      {item.nama}
                    </td>

                    <td>{item.nim || "-"}</td>

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

                    <p>
                      {errorAPI
                        ? "Data kunjungan belum dapat dimuat"
                        : "Belum ada data kunjungan"}
                    </p>

                    <small>
                      {errorAPI
                        ? "Periksa koneksi API BagSpace."
                        : "Data kunjungan tidak ditemukan."}
                    </small>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER DAN PAGINATION */}

        <div className="rk-footer">
          <span>
            Menampilkan {currentData.length} dari{" "}
            {dataFiltered.length} data
          </span>

          <div className="rk-pagination">
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={16} />
            </button>

            <span>
              {currentPage} / {totalPages}
            </span>

            <button
              disabled={
                currentPage === totalPages || loading
              }
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
