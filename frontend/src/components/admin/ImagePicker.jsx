import { useState, useEffect, useRef } from 'react';
import './ImagePicker.css';

export default function ImagePicker({ folder, value, onChange, label }) {
  const [images, setImages] = useState([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    fetch('/image-manifest.json')
      .then((res) => res.json())
      .then((data) => setImages(data[folder] || []))
      .catch(() => setImages([]));
  }, [folder]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = images.filter((f) =>
    f.toLowerCase().includes(filter.toLowerCase())
  );

  const displayName = value || 'Ninguna seleccionada';

  return (
    <div className="image-picker" ref={ref}>
      {label && <label className="form-label">{label}</label>}
      <div className="image-picker-current" onClick={() => setOpen(!open)}>
        {value ? (
          <img
            src={`/${folder}/${value}`}
            alt={value}
            className="image-picker-thumb"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="image-picker-thumb image-picker-empty">?</div>
        )}
        <span className="image-picker-name">{displayName}</span>
        <span className="image-picker-arrow">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="image-picker-dropdown">
          <input
            className="image-picker-search"
            placeholder="Buscar..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
          />
          <div className="image-picker-list">
            <div
              className={`image-picker-option ${!value ? 'selected' : ''}`}
              onClick={() => { onChange(''); setOpen(false); setFilter(''); }}
            >
              Ninguna
            </div>
            {filtered.map((img) => (
              <div
                key={img}
                className={`image-picker-option ${value === img ? 'selected' : ''}`}
                onClick={() => { onChange(img); setOpen(false); setFilter(''); }}
              >
                <img src={`/${folder}/${img}`} alt={img} className="image-picker-option-img" />
                <span>{img}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="image-picker-option" style={{ opacity: 0.3 }}>Sin resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
