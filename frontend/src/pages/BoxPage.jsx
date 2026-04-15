import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { KeycapModal } from "../components/Modals";
import { fetchKeycaps, fetchBoxes, fetchMakers, moveKeycap, updateKeycap, deleteKeycap } from "../api";
import { Footer } from "../components/Footer";

export function BoxPage() {
  const { boxId } = useParams();
  const [box, setBox] = useState(null);
  const [keycaps, setKeycaps] = useState([]);
  const [movingCap, setMovingCap] = useState(null);
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

  const handleMove = async (keycapId, targetBoxId, cellX, cellY) => {
    setKeycaps((prev) =>
      prev.map((k) =>
        k.id === keycapId
          ? { ...k, box_id: targetBoxId, cell_x: cellX, cell_y: cellY }
          : k
      )
    );
    setMovingCap(null);
    await moveKeycap(keycapId, targetBoxId, cellX, cellY);
  };

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
        {movingCap && (
          <span className="highlight">Moving: {movingCap.sculpt}</span>
        )}
      </div>

      <div className="box-detail-layout">
        <div className="box-detail-left">
          <div className="box-detail-grid" style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}>
            {Array.from({ length: height }).map((_, y) =>
              Array.from({ length: width }).map((_, x) => {
                const cap = capAt(x, y);
                const isEmpty = !cap;
                const isSelected = movingCap?.id === cap?.id;

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`keycap-cell${isEmpty ? " empty" : " filled"}${isSelected ? " selected" : ""}`}
                    title={!isEmpty ? `ID: ${cap.id}\nMaker: ${cap.maker_name}${cap.collab_name ? ' x ' + cap.collab_name : ''}\nSculpt: ${cap.sculpt}\nColorway: ${cap.colorway || '—'}\nPosition: (${cap.cell_x}, ${cap.cell_y})` : `Empty cell (${x}, ${y})`}
                    draggable={!isEmpty}
                    onDragStart={(e) => {
                      if (!isEmpty) {
                        e.dataTransfer.setData("text/plain", cap.id);
                        setMovingCap(cap);
                      }
                    }}
                    onDragOver={(e) => {
                      if (movingCap && isEmpty) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      if (movingCap && isEmpty) {
                        e.preventDefault();
                        handleMove(movingCap.id, Number(boxId), x, y);
                      }
                    }}
                    onClick={() => {
                      if (movingCap && isEmpty) {
                        handleMove(movingCap.id, Number(boxId), x, y);
                      }
                    }}
                  >
                    {!isEmpty ? (
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

      <Footer />
    </>
  );
}
