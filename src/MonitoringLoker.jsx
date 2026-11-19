
import React, { useEffect, useMemo, useState } from "react";
import {
  Layers3,
  CheckCircle2,
  LockKeyhole,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  RotateCcw,
  X,
} from "lucide-react";
import "./MonitoringLoker.css";
import { getLockers, returnLockerAPI } from "./services/api";

const LOCKER_EVENT = "bagspace-lockers-updated";
const TOTAL = 75;

const ZONES = [
  { name: "Kuning", start: 1, end: 28 },
  { name: "Hijau", start: 29, end: 56 },
  { name: "Merah", start: 57, end: 75 },
];

const pad = (n) => String(n).padStart(2, "0");

const zoneOf = (number) =>
  ZONES.find((z) => number >= z.start && number <= z.end);

const statusLabels = {
  tersedia: "Tersedia",
  dipinjam: "Dipinjam",
  rusak: "Rusak",
};

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MonitoringLoker({ user = null }) {
  const [lockers, setLockers] = useState([]);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [confirmReturn, setConfirmReturn] = useState(false);

  const pageSize = 10;

  async function refresh() {
    if (!user?.token) {
      setLockers([]);
      return;
    }

    try {
      const data = await getLockers(user.token);
      setLockers(data);
    } catch (error) {
      console.error("Gagal mengambil data monitoring:", error);
      setNotice(error.message || "Gagal mengambil data loker.");
    }
  }

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user?.token) {
        if (active) setLockers([]);
        return;
      }

      try {
        const data = await getLockers(user.token);

        if (active) {
          setLockers(data);
        }
      } catch (error) {
        console.error("Gagal mengambil data monitoring:", error);

        if (active) {
          setNotice(error.message || "Gagal mengambil data loker.");
        }
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };

    load();

    window.addEventListener(LOCKER_EVENT, load);
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      window.removeEventListener(LOCKER_EVENT, load);
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.token]);

  const stats = useMemo(
    () => ({
      tersedia: lockers.filter((l) => l.status === "tersedia").length,
      dipinjam: lockers.filter((l) => l.status === "dipinjam").length,
      rusak: lockers.filter((l) => l.status === "rusak").length,
    }),
    [lockers]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return lockers.filter((locker) => {
      const zone = zoneOf(locker.number);

      const matchSearch =
        !q ||
        [
          pad(locker.number),
          String(locker.number),
          locker.borrower,
          locker.userId,
        ].some((value) =>
          String(value || "").toLowerCase().includes(q)
        );

      return (
        matchSearch &&
        (zoneFilter === "Semua" ||
          zone?.name === zoneFilter) &&
        (statusFilter === "Semua" ||
          locker.status === statusFilter)
      );
    });
  }, [lockers, search, zoneFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selectedLocker =
    selected === null
      ? null
      : lockers.find((l) => l.number === selected);

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setZoneFilter("Semua");
    setStatusFilter("Semua");
    setPage(1);
  }

  function openDetail(number) {
    refresh();
    setSelected(number);
    setConfirmReturn(false);
  }

  function closeDetail() {
    setSelected(null);
    setConfirmReturn(false);
  }

  async function handleReturn() {
    if (!selectedLocker) return;

    if (!user?.token) {
      setNotice("Sesi login tidak tersedia. Silakan login kembali.");
      return;
    }

    const number = selectedLocker.number;

    try {
      const result = await returnLockerAPI(user.token, number);

      await refresh();

      window.dispatchEvent(new Event(LOCKER_EVENT));

      setNotice(
        result.message ||
        `Loker ${pad(number)} berhasil dikembalikan dan sekarang tersedia.`
      );

      closeDetail();
    } catch (error) {
      console.error("Gagal mengembalikan loker:", error);

      setNotice(
        error.message || "Pengembalian gagal diproses."
      );

      try {
        await refresh();
      } catch (refreshError) {
        console.error("Gagal memperbarui data loker:", refreshError);
      }
    }
  }
  return (
    <div className="ml-page">
      <div className="ml-heading">
        <div>
          <span className="ml-eyebrow">
            PENGELOLAAN LOKER
          </span>
          <h2>Monitoring Loker</h2>
          <p>
            Pantau peminjaman dan pengembalian loker
            perpustakaan.
          </p>
        </div>

        <button
          type="button"
          className="ml-refresh"
          onClick={refresh}
        >
          <RefreshCw size={14} />
          Perbarui
        </button>
      </div>

      <div className="ml-stats">
        <article className="ml-stat">
          <span>
            <Layers3 size={14} />
            Total Loker
          </span>
          <strong>{TOTAL}</strong>
          <small>3 zona loker</small>
        </article>

        <article className="ml-stat">
          <span>
            <CheckCircle2 size={14} />
            Tersedia
          </span>
          <strong>{stats.tersedia}</strong>
          <small>Siap digunakan</small>
        </article>

        <article className="ml-stat">
          <span>
            <LockKeyhole size={14} />
            Dipinjam
          </span>
          <strong>{stats.dipinjam}</strong>
          <small>Sedang digunakan</small>
        </article>

        <article className="ml-stat">
          <span>
            <AlertTriangle size={14} />
            Rusak
          </span>
          <strong>{stats.rusak}</strong>
          <small>Tidak aktif</small>
        </article>
      </div>

      <section className="ml-panel">
        <div className="ml-panel-top">
          <div>
            <h3>Daftar Monitoring Loker</h3>
            <p>
              Pantau nomor, zona, status, dan peminjam loker.
            </p>
          </div>
          <span>{filtered.length} loker ditemukan</span>
        </div>

        {notice && (
          <div className="ml-notice" role="status">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Tutup pemberitahuan"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="ml-filters">
          <label className="ml-search">
            <Search size={15} />
            <input
              aria-label="Cari loker atau peminjam"
              value={search}
              onChange={(e) =>
                changeFilter(setSearch, e.target.value)
              }
              placeholder="Cari nomor loker / peminjam..."
            />
          </label>

          <select
            aria-label="Filter zona"
            value={zoneFilter}
            onChange={(e) =>
              changeFilter(setZoneFilter, e.target.value)
            }
          >
            <option value="Semua">Semua Zona</option>
            {ZONES.map((zone) => (
              <option key={zone.name} value={zone.name}>
                Zona {zone.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter status"
            value={statusFilter}
            onChange={(e) =>
              changeFilter(setStatusFilter, e.target.value)
            }
          >
            <option value="Semua">Semua Status</option>
            <option value="tersedia">Tersedia</option>
            <option value="dipinjam">Dipinjam</option>
            <option value="rusak">Rusak</option>
          </select>

          <button
            type="button"
            className="ml-reset"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>

        <div className="ml-table-wrap">
          <table className="ml-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nomor Loker</th>
                <th>Zona</th>
                <th>Status</th>
                <th>Nama Peminjam</th>
                <th>Mulai Pinjam</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {visible.length > 0 ? (
                visible.map((locker, index) => {
                  const zone = zoneOf(locker.number);

                  return (
                    <tr key={locker.number}>
                      <td>
                        {(currentPage - 1) * pageSize +
                          index +
                          1}
                      </td>

                      <td>
                        <strong>
                          #{pad(locker.number)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`ml-zone-badge ${zone?.name.toLowerCase()}`}
                        >
                          Zona {zone?.name}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`ml-status-badge ${locker.status}`}
                        >
                          {statusLabels[locker.status]}
                        </span>
                      </td>

                      <td>
                        {locker.status === "dipinjam"
                          ? locker.borrower ||
                            "Tidak tercatat"
                          : "-"}
                      </td>

                      <td>
                        {locker.status === "dipinjam"
                          ? formatDate(
                              locker.borrowedAt ||
                                locker.borrowed_at ||
                                locker.startTime
                            )
                          : "-"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="ml-detail-button"
                          onClick={() =>
                            openDetail(locker.number)
                          }
                        >
                          <Eye size={14} />
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="ml-empty">
                    Tidak ada loker yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ml-footer">
          <small>
            Menampilkan{" "}
            {filtered.length
              ? (currentPage - 1) * pageSize + 1
              : 0}
            â€“
            {Math.min(
              currentPage * pageSize,
              filtered.length
            )}{" "}
            dari {filtered.length} loker
          </small>

          <div>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() =>
                setPage((p) => Math.max(1, p - 1))
              }
            >
              Sebelumnya
            </button>

            <span>
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPage((p) =>
                  Math.min(totalPages, p + 1)
                )
              }
            >
              Berikutnya
            </button>
          </div>
        </div>
      </section>

      <p className="ml-note">
        Data monitoring mengikuti aktivitas dari halaman
        Pilih Loker.
      </p>

      {selectedLocker && (
        <div
          className="ml-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeDetail();
            }
          }}
        >
          <div
            className="ml-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Detail Loker ${pad(selectedLocker.number)}`}
          >
            <div className="ml-modal-top">
              <h3>
                Detail Loker {pad(selectedLocker.number)}
              </h3>

              <button
                type="button"
                onClick={closeDetail}
                aria-label="Tutup detail"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ml-modal-info">
              <p>
                Zona:
                <strong>
                  {zoneOf(selectedLocker.number)?.name}
                </strong>
              </p>

              <p>
                Status:
                <strong>
                  {statusLabels[selectedLocker.status]}
                </strong>
              </p>

              {selectedLocker.status === "dipinjam" && (
                <>
                  <p>
                    Peminjam:
                    <strong>
                      {selectedLocker.borrower ||
                        "Tidak tercatat"}
                    </strong>
                  </p>

                  <p>
                    Mulai Pinjam:
                    <strong>
                      {formatDate(
                        selectedLocker.borrowedAt ||
                          selectedLocker.borrowed_at ||
                          selectedLocker.startTime
                      )}
                    </strong>
                  </p>
                </>
              )}
            </div>

            {selectedLocker.status === "dipinjam" && (
              <>
                {!confirmReturn ? (
                  <button
                    type="button"
                    className="ml-return-button"
                    onClick={() =>
                      setConfirmReturn(true)
                    }
                  >
                    <RotateCcw size={15} />
                    Kembalikan Loker
                  </button>
                ) : (
                  <div className="ml-confirm">
                    <p>
                      Yakin ingin mengembalikan Loker{" "}
                      <strong>
                        {pad(selectedLocker.number)}
                      </strong>
                      ?
                    </p>

                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmReturn(false)
                        }
                      >
                        Batal
                      </button>

                      <button
                        type="button"
                        className="ml-confirm-yes"
                        onClick={handleReturn}
                      >
                        Ya, Kembalikan
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              className="ml-modal-close"
              onClick={closeDetail}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

