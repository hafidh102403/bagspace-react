
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  LockKeyhole,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { readLockers, saveLockers } from "./lockerStore";
import "./SetupLoker.css";

const PAGE_SIZE = 15;

const ZONES = [
  { name: "Kuning", start: 1, end: 28 },
  { name: "Hijau", start: 29, end: 56 },
  { name: "Merah", start: 57, end: 75 },
];

const getNumber = (locker) =>
  Number(locker.number ?? locker.nomor ?? locker.no ?? locker.id);

const getZone = (number) => {
  if (number >= 1 && number <= 28) return "Kuning";
  if (number >= 29 && number <= 56) return "Hijau";
  if (number >= 57 && number <= 75) return "Merah";
  return "Lainnya";
};

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase();

  if (["dipinjam", "terisi", "occupied"].includes(value)) {
    return "dipinjam";
  }

  if (["rusak", "non_aktif", "nonaktif", "inactive"].includes(value)) {
    return "rusak";
  }

  return "tersedia";
};

const getBorrower = (locker) =>
  locker.borrower ??
  locker.peminjam ??
  locker.borrower_name ??
  "";

const normalizeLockers = (items) => {
  const source = Array.isArray(items) ? items : [];

  return source
    .map((locker) => {
      const number = getNumber(locker);

      return {
        ...locker,
        number,
        zone: getZone(number),
        status: normalizeStatus(locker.status),
        borrower: getBorrower(locker),
      };
    })
    .filter((locker) => Number.isFinite(locker.number))
    .sort((a, b) => a.number - b.number);
};

const emptyForm = {
  number: "",
  status: "tersedia",
  borrower: "",
};

export default function SetupLoker() {
  const [lockers, setLockers] = useState(() =>
    normalizeLockers(readLockers())
  );

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState(null);
  const [editingNumber, setEditingNumber] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const persist = (next) => {
    const normalized = normalizeLockers(next);
    setLockers(normalized);
    saveLockers(normalized);
  };

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return lockers.filter((locker) => {
      const matchesSearch =
        String(locker.number).includes(keyword) ||
        String(locker.borrower || "")
          .toLowerCase()
          .includes(keyword) ||
        locker.zone.toLowerCase().includes(keyword);

      const matchesZone =
        zoneFilter === "semua" || locker.zone === zoneFilter;

      const matchesStatus =
        statusFilter === "semua" ||
        locker.status === statusFilter;

      return matchesSearch && matchesZone && matchesStatus;
    });
  }, [lockers, search, zoneFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  useEffect(() => {
    setPage(1);
  }, [search, zoneFilter, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visible = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const openNew = () => {
    setEditingNumber(null);
    setForm({ ...emptyForm });
    setError("");
  };

  const openEdit = (locker) => {
    setEditingNumber(locker.number);
    setForm({
      number: String(locker.number),
      status: locker.status,
      borrower: locker.borrower || "",
    });
    setError("");
  };

  const submit = (event) => {
    event.preventDefault();

    const number = Number(form.number);

    if (!Number.isInteger(number) || number <= 0) {
      setError("Nomor loker harus berupa angka positif.");
      return;
    }

    if (
      lockers.some(
        (locker) =>
          locker.number === number &&
          locker.number !== editingNumber
      )
    ) {
      setError("Nomor loker sudah terdaftar.");
      return;
    }

    const status = normalizeStatus(form.status);

    const updated = {
      number,
      zone: getZone(number),
      status,
      borrower:
        status === "dipinjam" ? form.borrower.trim() : "",
    };

    if (editingNumber === null) {
      persist([...lockers, updated]);
      setNotice(`Loker ${number} berhasil ditambahkan.`);
    } else {
      persist(
        lockers.map((locker) =>
          locker.number === editingNumber
            ? { ...locker, ...updated }
            : locker
        )
      );

      setNotice(`Loker ${number} berhasil diperbarui.`);
    }

    setForm(null);
    setEditingNumber(null);
  };

  const remove = (locker) => {
    if (
      !window.confirm(
        `Yakin ingin menghapus Loker ${locker.number}?`
      )
    ) {
      return;
    }

    persist(
      lockers.filter((item) => item.number !== locker.number)
    );

    setNotice(`Loker ${locker.number} berhasil dihapus.`);
  };

  const formatStatus = (status) => {
    if (status === "dipinjam") return "Dipinjam";
    if (status === "rusak") return "Rusak";
    return "Tersedia";
  };

  return (
    <div className="sl-page">
      {/* HEADER */}
      <div className="sl-header">
        <div>
          <span className="sl-kicker">
            PENGATURAN SISTEM
          </span>

          <h2>Setup Loker</h2>

          <p>Kelola seluruh data loker BagSpace.</p>
        </div>

        <button
          className="sl-primary"
          onClick={openNew}
        >
          <Plus size={15} />
          Tambah Loker
        </button>
      </div>

      {/* TABLE PANEL */}
      <section className="sl-panel">
        <div className="sl-panel-head">
          <div>
            <h3>
              <LockKeyhole size={16} />
              Daftar Loker
            </h3>

            <p>
              {filtered.length} dari {lockers.length} loker
              ditampilkan
            </p>
          </div>

          <div className="sl-toolbar">
            <label className="sl-search">
              <Search size={15} />

              <input
                type="text"
                placeholder="Cari nomor atau peminjam..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <select
              value={zoneFilter}
              onChange={(e) =>
                setZoneFilter(e.target.value)
              }
            >
              <option value="semua">Semua Zona</option>

              {ZONES.map((zone) => (
                <option
                  key={zone.name}
                  value={zone.name}
                >
                  {zone.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="semua">Semua Status</option>
              <option value="tersedia">Tersedia</option>
              <option value="dipinjam">Dipinjam</option>
              <option value="rusak">Rusak</option>
            </select>
          </div>
        </div>

        {notice && (
          <div className="sl-notice">
            <span>{notice}</span>

            <button
              onClick={() => setNotice("")}
              aria-label="Tutup notifikasi"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="sl-table-wrap">
          <table className="sl-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nomor Loker</th>
                <th>Zona</th>
                <th>Status</th>
                <th>Peminjam</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {visible.map((locker, index) => (
                <tr key={locker.number}>
                  <td>
                    {(page - 1) * PAGE_SIZE +
                      index +
                      1}
                  </td>

                  <td className="sl-locker-name">
                    Loker {locker.number}
                  </td>

                  <td>
                    <span className="sl-zone">
                      <i
                        className={`sl-zone-dot ${locker.zone.toLowerCase()}`}
                      />
                      {locker.zone}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`sl-status ${locker.status}`}
                    >
                      <i />
                      {formatStatus(locker.status)}
                    </span>
                  </td>

                  <td className="sl-borrower">
                    {locker.borrower || "-"}
                  </td>

                  <td>
                    <div className="sl-actions">
                      <button
                        title="Edit Loker"
                        onClick={() => openEdit(locker)}
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        className="delete"
                        title="Hapus Loker"
                        onClick={() => remove(locker)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="sl-empty"
                  >
                    Tidak ada loker ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="sl-footer">
          <span>
            {filtered.length === 0
              ? "Menampilkan 0 loker"
              : `Menampilkan ${
                  (page - 1) * PAGE_SIZE + 1
                }–${Math.min(
                  page * PAGE_SIZE,
                  filtered.length
                )} dari ${filtered.length} loker`}
          </span>

          <div className="sl-pagination">
            <button
              disabled={page === 1}
              onClick={() =>
                setPage((current) => current - 1)
              }
              title="Halaman sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            <span>
              {page} / {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() =>
                setPage((current) => current + 1)
              }
              title="Halaman berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* MODAL */}
      {form && (
        <div
          className="sl-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setForm(null);
            }
          }}
        >
          <form
            className="sl-modal"
            onSubmit={submit}
          >
            <div className="sl-modal-head">
              <h3>
                {editingNumber === null
                  ? "Tambah Loker"
                  : "Edit Loker"}
              </h3>

              <button
                type="button"
                onClick={() => setForm(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="sl-form-grid">
              <label>
                Nomor Loker

                <input
                  type="number"
                  min="1"
                  required
                  value={form.number}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      number: event.target.value,
                    })
                  }
                  placeholder="Contoh: 76"
                />
              </label>

              <label>
                Zona

                <input
                  readOnly
                  value={
                    form.number &&
                    Number(form.number) > 0
                      ? getZone(Number(form.number))
                      : "-"
                  }
                />
              </label>

              <label>
                Status Loker

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value,
                    })
                  }
                >
                  <option value="tersedia">
                    Tersedia
                  </option>
                  <option value="dipinjam">
                    Dipinjam
                  </option>
                  <option value="rusak">
                    Rusak
                  </option>
                </select>
              </label>

              {form.status === "dipinjam" && (
                <label>
                  Nama Peminjam

                  <input
                    value={form.borrower}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        borrower: event.target.value,
                      })
                    }
                    placeholder="Nama peminjam"
                  />
                </label>
              )}
            </div>

            {error && (
              <p className="sl-error">{error}</p>
            )}

            <div className="sl-modal-footer">
              <button
                type="button"
                onClick={() => setForm(null)}
              >
                Batal
              </button>

              <button
                type="submit"
                className="sl-primary"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
