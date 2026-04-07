import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchKeycaps, fetchBoxes } from "../api";

function CountryFlag({ code }) {
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return <span>{String.fromCodePoint(...codePoints)}</span>;
}

export function MakerPage() {
  const { makerId } = useParams();
  const [maker, setMaker] = useState(null);
  const [keycaps, setKeycaps] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [makerData, caps, boxList] = await Promise.all([
          fetch(`/api/makers/${makerId}`).then((r) => r.ok ? r.json() : null),
          fetchKeycaps({ maker_id: Number(makerId) }),
          fetchBoxes(),
        ]);
        setKeycaps(caps);
        setBoxes(boxList);
        if (makerData) {
          setMaker(makerData);
        } else if (caps.length > 0 && caps[0].maker_name) {
          setMaker({ id: Number(makerId), name: caps[0].maker_name });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [makerId]);

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  const unboxed = keycaps.filter((c) => !c.box_id);
  const boxed = keycaps.filter((c) => c.box_id);

  const uniqueSculpts = [...new Set(keycaps.map((c) => c.unique_id).filter(Boolean))];

  return (
    <>
      <header className="app-header">
        <div className="header-controls">
          <Link to="/" className="btn btn-secondary">← Back</Link>
          <h1>{maker?.maker_name || maker?.name || "Maker"}</h1>
          {maker?.instagram && (
            <a
              href={`https://instagram.com/${maker.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              title={maker.instagram.replace('@', '')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          )}
        </div>
      </header>

      <div className="status-bar">
        <span>
          <span className="highlight">{uniqueSculpts.length}</span> sculpts
        </span>
        <span>
          <span className="highlight">{boxed.length}</span> in boxes
        </span>
        <span>
          <span className="highlight">{unboxed.length}</span> unboxed
        </span>
      </div>

      {(maker?.first_name || maker?.city || maker?.state || maker?.country) && (
        <div className="maker-info">
          {maker?.first_name && <span className="maker-info-item">{maker.first_name}</span>}
          {maker?.city && <span className="maker-info-item">{maker.city}</span>}
          {maker?.state && <span className="maker-info-item">{maker.state}</span>}
          {maker?.country && <span className="maker-info-item"><CountryFlag code={maker.country} /></span>}
        </div>
      )}

      <div className="maker-stats maker-page-grid">
        {boxes.map((box) => {
          const boxCaps = keycaps.filter((c) => c.box_id === box.id);
          if (boxCaps.length === 0) return null;
          return (
            <div key={box.id} className="box-card">
              <div className="box-header">
                <h2>
                  <Link to={`/box/${box.id}`} className="box-link">
                    {box.label} — {box.name || "Unnamed"}
                  </Link>
                </h2>
                <span className="box-badge">{boxCaps.length}</span>
              </div>
              <div className="keycap-grid" style={{ gridTemplateColumns: `repeat(${box.width || 9}, 1fr)` }}>
                {Array.from({ length: box.height || 9 }).map((_, y) =>
                  Array.from({ length: box.width || 9 }).map((_, x) => {
                    const cap = boxCaps.find((c) => c.cell_x === x && c.cell_y === y);
                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`keycap-cell${!cap ? " empty" : " filled"}`}
                      >
                        {cap && (
                          <>
                            <span className="sculpt">{cap.sculpt}</span>
                            {cap.colorway && <span className="colorway">{cap.colorway}</span>}
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {unboxed.length > 0 && (
        <div className="unboxed-section">
          <div className="unboxed-header">
            <h2>Unboxed Keycaps</h2>
            <span className="box-badge">{unboxed.length}</span>
          </div>
          <div className="unboxed-grid">
            {unboxed.map((cap) => (
              <div key={cap.id} className="keycap-cell filled unboxed-cap">
                <span className="sculpt">{cap.sculpt}</span>
                {cap.colorway && <span className="colorway">{cap.colorway}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="app-footer">
        <a href="https://github.com/sillypears" target="_blank" rel="noopener noreferrer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>
      </footer>
    </>
  );
}
