import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchKeycaps } from "../api";

export function BoxPage() {
  const { boxId } = useParams();
  const [box, setBox] = useState(null);
  const [keycaps, setKeycaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [boxData, caps] = await Promise.all([
          fetch(`/api/boxes/${boxId}`).then((r) => r.json()),
          fetchKeycaps({ box_id: Number(boxId) }),
        ]);
        setBox(boxData);
        setKeycaps(caps);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [boxId]);

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  const width = box?.width || 9;
  const height = box?.height || 9;
  const capacity = box?.capacity || width * height;
  const pct = (keycaps.length / capacity) * 100;

  const capAt = (x, y) => keycaps.find((c) => c.cell_x === x && c.cell_y === y);

  const makers = [...new Set(keycaps.map((c) => c.maker_name).filter(Boolean))];

  return (
    <>
      <header className="app-header">
        <div className="header-controls">
          <Link to="/" className="btn btn-secondary">← Back</Link>
          <h1>{box?.label} — {box?.name || "Unnamed"}</h1>
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {height} rows × {width} cols
          </span>
        </div>
      </header>

      <div className="status-bar">
        <span>
          <span className="highlight">{keycaps.length}</span> / {capacity} slots used ({pct.toFixed(1)}%)
        </span>
        {box?.maker_name && (
          <span>Maker: <span className="highlight">{box.maker_name}</span></span>
        )}
        <span>
          <span className="highlight">{makers.length}</span> makers represented
        </span>
      </div>

      <div className="box-detail-layout">
        <div className="box-detail-left">
          <div className="box-detail-grid" style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}>
            {Array.from({ length: height }).map((_, y) =>
              Array.from({ length: width }).map((_, x) => {
                const cap = capAt(x, y);
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`keycap-cell${!cap ? " empty" : " filled"}`}
                    title={cap ? `ID: ${cap.id}\nMaker: ${cap.maker_name}${cap.collab_name ? ' x ' + cap.collab_name : ''}\nSculpt: ${cap.sculpt}\nColorway: ${cap.colorway || '—'}\nPosition: (${cap.cell_x}, ${cap.cell_y})` : `Empty cell (${x}, ${y})`}
                  >
                    {cap ? (
                      <>
                        <Link to={`/maker/${cap.maker_id}`} className="maker-link" onClick={(e) => e.stopPropagation()}>
                          {cap.maker_name?.split(" ")[0]}
                        </Link>
                        <span className="sculpt">{cap.sculpt}</span>
                        {cap.colorway && <span className="colorway">{cap.colorway}</span>}
                      </>
                    ) : (
                      <span className="empty-cell">({x},{y})</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="box-detail-stats">
            <div className="stat-item">
              <span className="stat-label">Capacity</span>
              <span className="stat-value">{capacity}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Used</span>
              <span className="stat-value">{keycaps.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Empty</span>
              <span className="stat-value">{capacity - keycaps.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Makers</span>
              <span className="stat-value">{makers.length}</span>
            </div>
            {box?.dedicated !== undefined && (
              <div className="stat-item">
                <span className="stat-label">Dedicated</span>
                <span className="stat-value">{box.dedicated ? "Yes" : "No"}</span>
              </div>
            )}
            {box?.allow_add !== undefined && (
              <div className="stat-item">
                <span className="stat-label">Allow Add</span>
                <span className="stat-value">{box.allow_add ? "Yes" : "No"}</span>
              </div>
            )}
          </div>
        </div>

        <div className="box-detail-right">
          <h3>Keycaps in this box</h3>
          <div className="keycap-list">
            {keycaps.map((cap) => (
              <div key={cap.id} className="keycap-list-item">
                <Link to={`/maker/${cap.maker_id}`} className="maker-link">{cap.maker_name}</Link>
                <span className="sculpt">{cap.sculpt}</span>
                {cap.collab_name && <span className="collab">x {cap.collab_name}</span>}
                {cap.colorway && <span className="colorway">{cap.colorway}</span>}
                <span className="position">({cap.cell_x}, {cap.cell_y})</span>
              </div>
            ))}
            {keycaps.length === 0 && (
              <div className="keycap-list-empty">No keycaps in this box</div>
            )}
          </div>
        </div>
      </div>

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
