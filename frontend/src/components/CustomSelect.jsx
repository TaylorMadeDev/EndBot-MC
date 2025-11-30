import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/customselect.css';

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Choose...',
  searchable = false,
  searchPlaceholder = 'Search...'
}) {
  const [open, setOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = useMemo(() => options.find(o => String(o.value) === String(value)), [options, value]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      // Scroll selected into view
      const idx = options.findIndex(o => String(o.value) === String(value));
      if (idx >= 0) {
        const el = listRef.current.querySelector(`[data-index="${idx}"]`);
        if (el) el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [open, options, value]);

  // Filter options when searchable
  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(o => String(o.label).toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q));
  }, [options, searchable, query]);

  const handleKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
      setOpen(true);
      e.preventDefault();
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') {
      setHoveredIndex(i => Math.min(filtered.length - 1, (i < 0 ? 0 : i + 1)));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHoveredIndex(i => Math.max(0, (i < 0 ? filtered.length - 1 : i - 1)));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const idx = hoveredIndex >= 0 ? hoveredIndex : filtered.findIndex(o => String(o.value) === String(value));
      const opt = filtered[idx >= 0 ? idx : 0];
      if (opt) {
        onChange(opt.value);
        setOpen(false);
        setQuery('');
      }
      e.preventDefault();
    }
  };

  return (
    <div
      className={`custom-select ${open ? 'open' : ''}`}
      ref={rootRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
    >
      <button
        className="select-trigger"
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle options"
      >
        <span className={`select-value ${selectedOption ? '' : 'placeholder'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <i className="fas fa-chevron-down chevron"></i>
      </button>

      <div className="select-dropdown" role="listbox" ref={listRef}>
        {searchable && (
          <div className="select-search">
            <i className="fas fa-search"></i>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHoveredIndex(-1); }}
              placeholder={searchPlaceholder}
              autoFocus
            />
          </div>
        )}
        {filtered.map((opt, idx) => {
          const selected = String(opt.value) === String(value);
          const hovered = idx === hoveredIndex;
          return (
            <div
              key={opt.value}
              data-index={idx}
              className={`select-option ${selected ? 'selected' : ''} ${hovered ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(-1)}
              onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
              role="option"
              aria-selected={selected}
            >
              <span className="option-label">{opt.label}</span>
              {selected && <i className="fas fa-check option-check"></i>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
