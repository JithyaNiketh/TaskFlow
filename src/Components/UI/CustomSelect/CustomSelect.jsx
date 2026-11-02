
import { useEffect, useRef, useState } from "react";
import "./CustomSelect.css";

export default function CustomSelect({
  value,
  options,
  onChange,
  ariaLabel = "Select an option",
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  const selectedIndex = options.findIndex(
    (option) => option.value === value
  );

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function chooseOption(option) {
    onChange(option.value);
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        setActiveIndex(Math.max(selectedIndex, 0));
      } else {
        setActiveIndex((index) => (index + 1) % options.length);
      }
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        setActiveIndex(Math.max(selectedIndex, 0));
      } else {
        setActiveIndex(
          (index) => (index - 1 + options.length) % options.length
        );
      }
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      chooseOption(options[activeIndex]);
    }

    if (event.key === " " && !open) {
      event.preventDefault();
      setActiveIndex(Math.max(selectedIndex, 0));
      setOpen(true);
    }
  }

  return (
    <div className="custom-select" ref={containerRef}>
      <button
        type="button"
        className={`custom-select-trigger ${open ? "is-open" : ""}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!open) setActiveIndex(Math.max(selectedIndex, 0));
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
      >
        <span>{options[selectedIndex]?.label ?? "Select..."}</span>
        <svg
          className="custom-select-chevron"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m7 10 5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="custom-select-menu"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              className={[
                "custom-select-option",
                option.value === value ? "is-selected" : "",
                index === activeIndex ? "is-active" : "",
              ].filter(Boolean).join(" ")}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => chooseOption(option)}
            >
              {option.label}
              {option.value === value && (
                <span className="custom-select-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
