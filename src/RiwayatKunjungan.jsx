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

  async function exportExcel() {
    if (!isAdmin) return;

    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "BagSpace";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Riwayat Kunjungan", {
        views: [{ state: "frozen", ySplit: 6 }],
        pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
      });

      const widths = [8, 28, 20, 19, 20, 18, 15, 15];
      widths.forEach((width, index) => {
        sheet.getColumn(index + 1).width = width;
      });

      sheet.mergeCells("A1:H2");
      const titleCell = sheet.getCell("A1");
      titleCell.value = "LAPORAN RIWAYAT KUNJUNGAN";
      titleCell.font = { name: "Calibri", size: 17, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(1).height = 25;
      sheet.getRow(2).height = 18;

      sheet.mergeCells("A3:H3");
      const subtitle = sheet.getCell("A3");
      subtitle.value = "PERPUSTAKAAN POLITEKNIK APP JAKARTA • BAGSPACE";
      subtitle.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF1E40AF" } };
      subtitle.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(3).height = 24;

      sheet.mergeCells("A4:H4");
      const filterInfo = sheet.getCell("A4");
      filterInfo.value = `Filter: ${search || "Semua nama"} | ${tanggalAwal || "Awal"} s.d. ${tanggalAkhir || "Akhir"} | ${role || "Semua role"} | ${prodi || "Semua prodi"}`;
      filterInfo.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF475569" } };
      filterInfo.alignment = { vertical: "middle" };
      sheet.getRow(4).height = 22;

      sheet.mergeCells("A5:H5");
      const countInfo = sheet.getCell("A5");
      countInfo.value = `Total data: ${dataFiltered.length} kunjungan`;
      countInfo.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF0F172A" } };
      sheet.getRow(5).height = 22;

      const headers = ["No", "Nama Pengunjung", "NIM / NIP", "Role", "Prodi", "Tanggal", "Jam Masuk", "Jam Keluar"];
      const headerRow = sheet.getRow(6);
      headerRow.values = headers;
      headerRow.height = 27;
      headerRow.eachCell((cell) => {
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { bottom: { style: "thin", color: { argb: "FF93C5FD" } } };
      });

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
          cell.font = { name: "Calibri", size: 10, color: { argb: "FF0F172A" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: index % 2 === 0 ? "FFF1F5F9" : "FFFFFFFF" },
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: [1, 6, 7, 8].includes(colNumber) ? "center" : "left",
          };
          cell.border = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } };
        });
        row.getCell(3).numFmt = "@";
      });

      sheet.autoFilter = { from: "A6", to: `H${Math.max(6, 6 + dataFiltered.length)}` };
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Riwayat_Kunjungan_BagSpace_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Export Excel gagal:", error);
      alert("Gagal export Excel. Pastikan paket exceljs sudah terpasang.");
    }
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
