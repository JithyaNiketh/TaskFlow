import { useEffect, useMemo, useState } from "react";

function parseISODate(value) {
  if (typeof value !== "string") return null;

  const match = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  // Reject impossible dates such as 2026-02-31 or month 13.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function localTodayISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default function CustomDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    monthStart(parseISODate(value) || new Date())
  );

  // When a different task is opened for editing, show that task's due-date month.
  // Empty or malformed values safely fall back to the current month.
  useEffect(() => {
    setVisibleMonth(monthStart(parseISODate(value) || new Date()));
  }, [value]);

  // Keep calendar calculations safe even if an unexpected invalid Date enters state.
  const safeVisibleMonth = useMemo(() => {
    return visibleMonth instanceof Date && !Number.isNaN(visibleMonth.getTime())
      ? monthStart(visibleMonth)
      : monthStart(parseISODate(value) || new Date());
  }, [visibleMonth, value]);

  const year = safeVisibleMonth.getFullYear();
  const month = safeVisibleMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday-first calendar. offset is always an integer from 0 to 6.
  const offset = (firstDay + 6) % 7;
  const days = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (days.length % 7 !== 0) days.push(null);

  function formatDisplay(dateString) {
    const date = parseISODate(dateString);
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
  }

  const todayISO = localTodayISO();
  const selectedDate = parseISODate(value);
  const selectedDay = selectedDate ? selectedDate.getDate() : null;
  const selectedMonth = selectedDate ? selectedDate.getMonth() : null;
  const selectedYear = selectedDate ? selectedDate.getFullYear() : null;

  function selectDay(day) {
    if (!Number.isInteger(day)) return;

    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const selectedISO = `${year}-${mm}-${dd}`;

    if (selectedISO < todayISO) return;

    onChange(selectedISO);
    setOpen(false);
  }

  function changeMonth(amount) {
    setVisibleMonth(new Date(year, month + amount, 1));
  }

  function selectToday() {
    const today = new Date();
    const todayISOValue = localTodayISO();
    setVisibleMonth(monthStart(today));
    onChange(todayISOValue);
    setOpen(false);
  }

  return (
    <div className="projects-date-picker">
      <div className="projects-date-input-wrap">
        <input
          type="text"
          readOnly
          value={formatDisplay(value)}
          placeholder="DD/MM/YYYY"
          aria-label="Due date, day/month/year"
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen((current) => !current);
            }
            if (event.key === "Escape") setOpen(false);
          }}
        />

        <button
          type="button"
          className="projects-calendar-trigger"
          aria-label="Choose due date"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
              x="3.5"
              y="5.5"
              width="17"
              height="15"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M7.5 3.5v4M16.5 3.5v4M4 10h16"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {open && (
        <div className="projects-calendar">
          <div className="projects-calendar-header">
            <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>
              ‹
            </button>

            <strong>
              {safeVisibleMonth.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </strong>

            <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>
              ›
            </button>
          </div>

          <div className="projects-calendar-grid">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
              <span className="projects-calendar-weekday" key={day}>
                {day}
              </span>
            ))}

            {days.map((day, index) =>
              day === null ? (
                <span className="projects-calendar-empty" key={`empty-${index}`} />
              ) : (
                <button
                  type="button"
                  key={`${year}-${month}-${day}`}
                  disabled={`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` < todayISO}
                  className={[
                    "projects-calendar-day",
                    day === selectedDay && month === selectedMonth && year === selectedYear
                      ? "selected"
                      : "",
                    (() => {
                      const today = new Date();
                      return day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear()
                        ? "today"
                        : "";
                    })(),
                  ].filter(Boolean).join(" ")}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              )
            )}
          </div>

          <div className="projects-calendar-footer">
            <button type="button" onClick={selectToday}>Today</button>

            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Clear date
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
