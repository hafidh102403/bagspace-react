
import React, { useEffect, useMemo, useState } from "react";
import { LockKeyhole, X } from "lucide-react";
import "./PilihLoker.css";
import { getLockers, borrowLockerAPI } from "./services/api";

const LOCKER_EVENT = "bagspace-lockers-updated";
const TOTAL = 75;

const zoneOf = (number) =>
  number <= 28 ? "Kuning" : number <= 56 ? "Hijau" : "Merah";

const zoneColors = {
  Kuning: "#eab308",
  Hijau: "#22c55e",
  Merah: "#ef4444",
};

function formatBorrowedAt(value) {
  if (!value) {
    return {
      date: "Belum tercatat",
      time: "Belum tercatat",
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: "Tidak valid",
      time: "Tidak valid",
    };
  }

  return {
    date: date.toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    time:
      date.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) + " WIB",
  };
}

function normalizeProdi(value) {
  const prodi = String(value || "").trim().toUpperCase();

  if (prodi === "MLIE") return "MLIE";
  if (prodi === "MPIE") return "MPIE";
  if (prodi === "PIWAR") return "PIWAR";

  if (
    prodi === "DOSEN" ||
    prodi === "TENDIK" ||
    prodi === "DOSEN/TENDIK"
  ) {
    return "Dosen/Tendik";
  }

  return prodi;
}

export default function PilihLoker({ user = null }) {
  const [lockers, setLockers] = useState([]);
  const [zone, setZone] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [notice, setNotice] = useState("");
  const [hoveredLocker, setHoveredLocker] = useState(null);

  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
  });

  const borrowerName = String(
    user?.nama_lengkap ||
      user?.name ||
      user?.nama ||
      ""
  ).trim();

  const borrowerId = String(
    user?.id ??
      user?.nim_nip ??
      user?.nim ??
      user?.email ??
      ""
  ).trim();

  const borrowerRole = String(user?.role || "").trim();

  const borrowerProdi = normalizeProdi(
    user?.prodi ||
      user?.program_studi ||
      user?.programStudi ||
      ""
  );

  const isLoggedIn = Boolean(borrowerName && borrowerId && user?.token);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
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
        console.error("Gagal mengambil data loker:", error);

        if (active) {
          setNotice(error.message || "Gagal mengambil data loker.");
        }
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    refresh();

    window.addEventListener(LOCKER_EVENT, refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      window.removeEventListener(LOCKER_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.token]);

  const counts = useMemo(
    () => ({
      tersedia: lockers.filter(
        (locker) => locker.status === "tersedia"
      ).length,

      dipinjam: lockers.filter(
        (locker) => locker.status === "dipinjam"
      ).length,

      rusak: lockers.filter(
        (locker) => locker.status === "rusak"
      ).length,
    }),
    [lockers]
  );

  const visible = useMemo(
    () =>
      lockers.filter(
        (locker) =>
          (zone === "Semua" ||
            zoneOf(locker.number) === zone) &&
          (statusFilter === "Semua" ||
            locker.status === statusFilter)
      ),
    [lockers, zone, statusFilter]
  );

  async function borrowLocker(number) {
    setHoveredLocker(null);

    if (!isLoggedIn) {
      setNotice("Sesi login tidak tersedia. Silakan login kembali.");
      return;
    }

    try {
      const result = await borrowLockerAPI(user.token, number);

      setNotice(
        result.message ||
        `Loker ${String(number).padStart(2, "0")} berhasil dipinjam.`
      );

      const latest = await getLockers(user.token);
      setLockers(latest);

      window.dispatchEvent(new Event(LOCKER_EVENT));
    } catch (error) {
      console.error("Gagal meminjam loker:", error);

      setNotice(
        error.message || "Peminjaman gagal diproses."
      );

      // Sinkronkan ulang data jika peminjaman ditolak
      try {
        const latest = await getLockers(user.token);
        setLockers(latest);
      } catch (refreshError) {
        console.error("Gagal memperbarui data loker:", refreshError);
      }
    }
  }
  function handleLockerClick(locker) {
    if (locker.status === "tersedia") {
      borrowLocker(locker.number);
    } else if (locker.status === "rusak") {
      setNotice("Loker rusak dan tidak dapat dipinjam.");
    }
  }

  function handleMouseEnter(event, locker) {
    if (locker.status !== "dipinjam") return;

    setHoveredLocker(locker);
    setMousePosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleMouseMove(event, locker) {
    if (locker.status !== "dipinjam") return;

    setMousePosition({
      x: event.clientX,
      y: event.clientY,
    });
  }

  const tooltipWidth = 245;
  const tooltipHeight = 175;
  const tooltipGap = 16;

  const viewportWidth =
    typeof window !== "undefined"
      ? window.innerWidth
      : 1024;

  const viewportHeight =
    typeof window !== "undefined"
      ? window.innerHeight
      : 768;

  const tooltipLeft = Math.max(
    8,
    Math.min(
      mousePosition.x + tooltipGap,
      viewportWidth - tooltipWidth - 8
    )
  );

  const tooltipTop = Math.max(
    8,
    Math.min(
      mousePosition.y + tooltipGap,
      viewportHeight - tooltipHeight - 8
    )
  );

  const hoveredTime = formatBorrowedAt(
    hoveredLocker?.borrowedAt ||
      hoveredLocker?.borrowed_at ||
      hoveredLocker?.startTime
  );

  return (
    <div className="pl-page">
      <div className="pl-header">
        <div>
          <h2>Pilih Loker</h2>
          <p>
            Peminjaman loker Perpustakaan
            Politeknik APP Jakarta
          </p>
        </div>

        <span className="pl-total">
          <LockKeyhole size={15} />
          75 Loker
        </span>
      </div>

      <div className="pl-stats">
        <div>
          <span>Total Loker</span>
          <strong>{TOTAL}</strong>
        </div>

        <div>
          <span>Tersedia</span>
          <strong>{counts.tersedia}</strong>
        </div>

        <div>
          <span>Dipinjam</span>
          <strong>{counts.dipinjam}</strong>
        </div>

        <div>
          <span>Rusak</span>
          <strong>{counts.rusak}</strong>
        </div>
      </div>

      <section className="pl-panel">
        <div className="pl-toolbar">
          <div className="pl-tabs" aria-label="Filter zona">
            {["Semua", "Kuning", "Hijau", "Merah"].map(
              (item) => (
                <button
                  type="button"
                  key={item}
                  className={
                    zone === item ? "selected" : ""
                  }
                  onClick={() => setZone(item)}
                >
                  {item === "Semua"
                    ? "Semua Zona"
                    : `Zona ${item}`}
                </button>
              )
            )}
          </div>

          <select
            aria-label="Filter status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="Semua">Semua Status</option>
            <option value="tersedia">Tersedia</option>
            <option value="dipinjam">Dipinjam</option>
            <option value="rusak">Rusak</option>
          </select>
        </div>

        <div className="pl-legend">
          <span>
            <i className="pl-dot available" />
            Tersedia
          </span>

          <span>
            <i className="pl-dot occupied" />
            Dipinjam
          </span>

          <span>
            <i className="pl-dot broken" />
            Rusak
          </span>
        </div>

        {notice && (
          <div className="pl-notice" role="status">
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

        <div className="pl-grid-scroll">
          {visible.length > 0 ? (
            <div className="pl-grid">
              {visible.map((locker) => (
                <button
                  type="button"
                  key={locker.number}
                  onClick={() =>
                    handleLockerClick(locker)
                  }
                  onMouseEnter={(event) =>
                    handleMouseEnter(event, locker)
                  }
                  onMouseMove={(event) =>
                    handleMouseMove(event, locker)
                  }
                  onMouseLeave={() =>
                    setHoveredLocker(null)
                  }
                  className={`pl-locker ${locker.status}`}
                  style={{
                    "--zone-color":
                      zoneColors[zoneOf(locker.number)],
                  }}
                  title={
                    locker.status === "dipinjam"
                      ? undefined
                      : `Loker ${locker.number}: ${locker.status}`
                  }
                  aria-label={`Loker ${locker.number}, ${locker.status}`}
                >
                  <span className="pl-locker-zone" />

                  <LockKeyhole size={16} />

                  <strong>
                    {String(locker.number).padStart(
                      2,
                      "0"
                    )}
                  </strong>
                </button>
              ))}
            </div>
          ) : (
            <div className="pl-empty">
              Tidak ada loker yang sesuai filter.
            </div>
          )}
        </div>

        <div className="pl-footnote">
          Klik loker tersedia untuk langsung meminjam.
          Arahkan kursor ke loker dipinjam untuk melihat
          informasi peminjam.
        </div>
      </section>

      {hoveredLocker && (
        <div
          className="pl-cursor-tooltip"
          style={{
            left: tooltipLeft,
            top: tooltipTop,
          }}
          role="tooltip"
        >
          <div className="pl-tooltip-header">
            <strong>
              Loker{" "}
              {String(hoveredLocker.number).padStart(
                2,
                "0"
              )}
            </strong>

            <span>Dipinjam</span>
          </div>

          <div className="pl-tooltip-row">
            <span>Zona</span>
            <b>
              {zoneOf(hoveredLocker.number)}
            </b>
          </div>

          <div className="pl-tooltip-row">
            <span>Nama</span>
            <b>
              {hoveredLocker.borrower ||
                "Tidak tercatat"}
            </b>
          </div>

          <div className="pl-tooltip-row">
            <span>Tanggal</span>
            <b>{hoveredTime.date}</b>
          </div>

          <div className="pl-tooltip-row">
            <span>Jam</span>
            <b>{hoveredTime.time}</b>
          </div>
        </div>
      )}
    </div>
  );
}

