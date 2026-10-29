
import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  LockKeyhole,
  AlertTriangle,
  RefreshCw,
  Layers3,
} from "lucide-react";
import "./MonitoringLoker.css";

const STORAGE_KEY = "bagspace_locker_demo_v1";

const ZONES = [
  { name: "Kuning", start: 1, end: 28, color: "#eab308" },
  { name: "Hijau", start: 29, end: 56, color: "#22c55e" },
  { name: "Merah", start: 57, end: 75, color: "#ef4444" },
];

const initialLockers = () =>
  Array.from({ length: 75 }, (_, i) => ({
    number: i + 1,
    status: "tersedia",
    borrower: "",
  }));

function loadLockers() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null"
    );

    if (
      Array.isArray(data) &&
      data.length === 75 &&
      data.every(
        (l, i) =>
          l.number === i + 1 &&
          ["tersedia", "dipinjam", "rusak"].includes(l.status)
      )
    ) {
      return data;
    }
  } catch {
    // Gunakan data awal jika penyimpanan tidak valid.
  }

  return initialLockers();
}

const formatNumber = (n) => String(n).padStart(2, "0");

const statusLabel = {
  tersedia: "Tersedia",
  dipinjam: "Dipinjam",
  rusak: "Rusak",
};

export default function MonitoringLoker() {
  const [lockers, setLockers] = useState(loadLockers);
  const [zoneFilter, setZoneFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [selected, setSelected] = useState(null);

  const refresh = () => {
    setLockers(loadLockers());
  };

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        refresh();
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const stats = useMemo(() => {
    const available = lockers.filter(
      (l) => l.status === "tersedia"
    ).length;

    const occupied = lockers.filter(
      (l) => l.status === "dipinjam"
    ).length;

    const broken = lockers.filter(
      (l) => l.status === "rusak"
    ).length;

    return { available, occupied, broken };
  }, [lockers]);

  const groups = useMemo(
    () =>
      ZONES.map((zone) => {
        const items = lockers.filter(
          (l) =>
            l.number >= zone.start &&
            l.number <= zone.end
        );

        return {
          ...zone,
          items,
        };
      }),
    [lockers]
  );

  const visibleGroups = groups.filter(
    (g) => zoneFilter === "Semua" || zoneFilter === g.name
  );

  const selectedLocker =
    selected === null
      ? null
      : lockers.find((l) => l.number === selected);

  return (
    <div className="ml-page">
      {/* HEADER */}
      <div className="ml-heading">
        <div>
          <span className="ml-eyebrow">
            PEMINJAMAN LOKER
          </span>
          <h2>Monitoring Loker</h2>
          <p>
            Pantau penggunaan dan kondisi seluruh loker
            perpustakaan.
          </p>
        </div>

        <button
          type="button"
          className="ml-refresh"
          onClick={refresh}
        >
          <RefreshCw size={14} />
          Perbarui Data
        </button>
      </div>

      {/* STATISTIK UTAMA */}
      <div className="ml-stats">
        <article className="ml-stat">
          <span>
            <Layers3 size={14} />
            Total Loker
          </span>
          <strong>75</strong>
          <small>3 zona loker</small>
        </article>

        <article className="ml-stat">
          <span>
            <CheckCircle2 size={14} />
            Tersedia
          </span>
          <strong>{stats.available}</strong>
          <small>Siap digunakan</small>
        </article>

        <article className="ml-stat">
          <span>
            <LockKeyhole size={14} />
            Dipinjam
          </span>
          <strong>{stats.occupied}</strong>
          <small>Sedang digunakan</small>
        </article>

        <article className="ml-stat">
          <span>
            <AlertTriangle size={14} />
            Rusak
          </span>
          <strong>{stats.broken}</strong>
          <small>Tidak aktif</small>
        </article>
      </div>

      {/* STATUS LOKER */}
      <section className="ml-detail">
        <div className="ml-detail-head">
          <div>
            <h3>Status Loker</h3>
            <p>
              Nomor dan kondisi loker berdasarkan zona
            </p>
          </div>

          <div className="ml-filters">
            <select
              aria-label="Filter zona"
              value={zoneFilter}
              onChange={(e) =>
                setZoneFilter(e.target.value)
              }
            >
              <option value="Semua">
                Semua Zona
              </option>

              {ZONES.map((z) => (
                <option
                  key={z.name}
                  value={z.name}
                >
                  Zona {z.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="Semua">
                Semua Status
              </option>
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
          </div>
        </div>

        {/* LEGENDA */}
        <div className="ml-legend">
          <span>
            <i className="ml-legend-dot tersedia" />
            Tersedia
          </span>

          <span>
            <i className="ml-legend-dot dipinjam" />
            Dipinjam
          </span>

          <span>
            <i className="ml-legend-dot rusak" />
            Rusak
          </span>
        </div>

        {/* GRID LOKER */}
        <div className="ml-zone-scroll">
          {visibleGroups.map((g) => {
            const filtered = g.items.filter(
              (l) =>
                statusFilter === "Semua" ||
                l.status === statusFilter
            );

            return (
              <div
                className="ml-zone"
                key={g.name}
                style={{
                  "--ml-zone": g.color,
                }}
              >
                <div className="ml-zone-header">
                  <span className="ml-zone-bullet" />

                  <strong>
                    Zona {g.name}
                  </strong>

                  <small>
                    Nomor {g.start}–{g.end}
                  </small>

                  <span className="ml-zone-header-count">
                    {filtered.length} loker
                  </span>
                </div>

                {filtered.length > 0 ? (
                  <div className="ml-locker-grid">
                    {filtered.map((l) => (
                      <button
                        type="button"
                        key={l.number}
                        className={`ml-locker ${l.status}`}
                        onClick={() =>
                          setSelected(l.number)
                        }
                        title={`Loker ${formatNumber(
                          l.number
                        )} — ${statusLabel[l.status]}`}
                      >
                        <LockKeyhole size={12} />
                        <strong>
                          {formatNumber(l.number)}
                        </strong>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="ml-no-results">
                    Tidak ada loker dengan status tersebut.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="ml-note">
          Data monitoring mengikuti penyimpanan lokal
          halaman Pilih Loker.
        </p>
      </section>

      {/* POPUP DETAIL LOKER */}
      {selectedLocker && (
        <div
          className="ml-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelected(null);
            }
          }}
        >
          <div
            className="ml-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Detail loker ${selectedLocker.number}`}
          >
            <div className="ml-modal-top">
              <h3>
                Detail Loker{" "}
                {formatNumber(selectedLocker.number)}
              </h3>

              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Tutup detail"
              >
                ×
              </button>
            </div>

            <p>
              Zona:{" "}
              <strong>
                {
                  ZONES.find(
                    (z) =>
                      selectedLocker.number >= z.start &&
                      selectedLocker.number <= z.end
                  )?.name
                }
              </strong>
            </p>

            <p>
              Status:{" "}
              <strong>
                {statusLabel[selectedLocker.status]}
              </strong>
            </p>

            {selectedLocker.status === "dipinjam" && (
              <p>
                Peminjam:{" "}
                <strong>
                  {selectedLocker.borrower ||
                    "Tidak tercatat"}
                </strong>
              </p>
            )}

            <button
              type="button"
              className="ml-modal-close"
              onClick={() => setSelected(null)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
