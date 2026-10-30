
import React, { useEffect, useMemo, useState } from "react";
import { LockKeyhole, X } from "lucide-react";
import "./PilihLoker.css";

const STORAGE_KEY = "bagspace_locker_demo_v1";
const HISTORY_KEY = "bagspace_locker_history_v1";
const LOCKER_EVENT = "bagspace-lockers-updated";
const HISTORY_EVENT = "bagspace-locker-history-updated";
const TOTAL = 75;

const zoneOf = (number) =>
  number <= 28 ? "Kuning" : number <= 56 ? "Hijau" : "Merah";

const zoneColors = {
  Kuning: "#eab308",
  Hijau: "#22c55e",
  Merah: "#ef4444",
};

const initialLockers = () =>
  Array.from({ length: TOTAL }, (_, index) => ({
    id: index + 1,
    number: index + 1,
    zone: zoneOf(index + 1),
    status: "tersedia",
    borrower: "",
    userId: "",
    borrowedAt: null,
    returnedAt: null,
  }));

function loadLockers() {
  const defaults = initialLockers();

  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null"
    );

    if (!Array.isArray(saved)) return defaults;

    const byNumber = new Map(
      saved
        .filter(
          (item) =>
            item &&
            Number.isInteger(Number(item.number))
        )
        .map((item) => [Number(item.number), item])
    );

    return defaults.map((locker) => {
      const stored = byNumber.get(locker.number);

      if (!stored) return locker;

      return {
        ...locker,
        ...stored,
        number: locker.number,
        status: ["tersedia", "dipinjam", "rusak"].includes(
          stored.status
        )
          ? stored.status
          : "tersedia",
      };
    });
  } catch (error) {
    console.error("Gagal membaca data loker:", error);
    return defaults;
  }
}

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

function saveBorrowHistory(locker, borrowedAt) {
  try {
    const saved = JSON.parse(
      localStorage.getItem(HISTORY_KEY) || "[]"
    );

    const history = Array.isArray(saved) ? saved : [];

    const record = {
      id:
        globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}-${locker.number}`,
      number: locker.number,
      lockerNumber: locker.number,
      zone: zoneOf(locker.number),
      action: "pinjam",
      status: "dipinjam",
      borrower: locker.borrower,
      userId: locker.userId,
      borrowedAt,
      timestamp: borrowedAt,
      createdAt: borrowedAt,
    };

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([record, ...history])
    );

    window.dispatchEvent(new Event(HISTORY_EVENT));
    return true;
  } catch (error) {
    console.error("Gagal menyimpan riwayat:", error);
    return false;
  }
}

export default function PilihLoker({ user = null }) {
  const [lockers, setLockers] = useState(loadLockers);
  const [zone, setZone] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [notice, setNotice] = useState("");

  const [hoveredLocker, setHoveredLocker] = useState(null);
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
  });

  // Identitas akun login, berlaku untuk semua role.
  const borrowerName = String(
    user?.nama_lengkap ||
      user?.name ||
      user?.nama ||
      ""
  ).trim();

  const borrowerId = String(
    user?.id ??
      user?.nim_nip ??
      user?.email ??
      ""
  ).trim();

  const borrowerRole = String(user?.role || "").trim();

  const isLoggedIn = Boolean(borrowerName && borrowerId);

  function refresh() {
    setLockers(loadLockers());
  }

  useEffect(() => {
    const onStorage = (event) => {
      if (
        event.key === STORAGE_KEY ||
        event.key === null
      ) {
        refresh();
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(LOCKER_EVENT, refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener(
      "visibilitychange",
      onVisible
    );

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LOCKER_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener(
        "visibilitychange",
        onVisible
      );
    };
  }, []);

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

  function borrowLocker(number) {
    setHoveredLocker(null);

    if (!isLoggedIn) {
      setNotice(
        "Data akun login belum terbaca. Silakan login terlebih dahulu."
      );
      return;
    }

    const latest = loadLockers();

    const target = latest.find(
      (locker) => locker.number === number
    );

    if (!target || target.status !== "tersedia") {
      setLockers(latest);
      setNotice(
        `Loker ${String(number).padStart(2, "0")} tidak tersedia.`
      );
      return;
    }

    const activeLocker = latest.find(
      (locker) =>
        locker.status === "dipinjam" &&
        String(locker.userId || "") === borrowerId
    );

    if (activeLocker) {
      setNotice(
        `Akun ${borrowerName} masih meminjam Loker ${String(
          activeLocker.number
        ).padStart(2, "0")}. Pengembalian dilakukan melalui admin.`
      );
      return;
    }

    const borrowedAt = new Date().toISOString();

    const updatedLocker = {
      ...target,
      status: "dipinjam",
      borrower: borrowerName,
      userId: borrowerId,
      borrowerRole,
      borrowedAt,
      returnedAt: null,
    };

    const updated = latest.map((locker) =>
      locker.number === number ? updatedLocker : locker
    );

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      setLockers(updated);
      window.dispatchEvent(new Event(LOCKER_EVENT));

      const historySaved = saveBorrowHistory(
        updatedLocker,
        borrowedAt
      );

      setNotice(
        historySaved
          ? `Loker ${String(number).padStart(2, "0")} berhasil dipinjam atas nama ${borrowerName}.`
          : `Loker berhasil dipinjam, tetapi riwayat gagal disimpan.`
      );
    } catch (error) {
      console.error("Gagal meminjam loker:", error);
      setNotice("Peminjaman gagal disimpan.");
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
    typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 768;

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
            Peminjaman loker Perpustakaan Politeknik APP Jakarta
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
                  className={zone === item ? "selected" : ""}
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
                  onClick={() => handleLockerClick(locker)}
                  onMouseEnter={(event) =>
                    handleMouseEnter(event, locker)
                  }
                  onMouseMove={(event) =>
                    handleMouseMove(event, locker)
                  }
                  onMouseLeave={() => setHoveredLocker(null)}
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
                    {String(locker.number).padStart(2, "0")}
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
              Loker {String(hoveredLocker.number).padStart(2, "0")}
            </strong>
            <span>Dipinjam</span>
          </div>

          <div className="pl-tooltip-row">
            <span>Zona</span>
            <b>{zoneOf(hoveredLocker.number)}</b>
          </div>

          <div className="pl-tooltip-row">
            <span>Nama</span>
            <b>{hoveredLocker.borrower || "Tidak tercatat"}</b>
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
