import { BrowserRouter, Routes, Route, Link, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import "./index.css";
import {
  fetchKeycaps,
  fetchBoxes,
  fetchMakers,
  fetchBoxInventory,
  moveKeycap,
  createKeycap,
  updateKeycap,
  deleteKeycap,
  createMaker,
  createBox,
  deleteBox,
  deleteMaker,
} from "./api";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/maker/:makerId" element={<MakerPage />} />
        <Route path="/box/:boxId" element={<BoxPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function HomePage() {
  const [keycaps, setKeycaps] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [makers, setMakers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCap, setSelectedCap] = useState(null);
  const [movingCap, setMovingCap] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddBoxModal, setShowAddBoxModal] = useState(false);
  const [showAddMakerModal, setShowAddMakerModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const uniqueSculpts = [...new Set(keycaps.map((c) => c.sculpt).filter(Boolean))];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [caps, boxList, makerList, inv] = await Promise.all([
        fetchKeycaps(search ? { search } : {}),
        fetchBoxes(),
        fetchMakers(),
        fetchBoxInventory(),
      ]);
      setKeycaps(caps);
      setBoxes(boxList);
      setMakers(makerList);
      setInventory(inv);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMove = async (keycapId, targetBoxId, cellX, cellY) => {
    await moveKeycap(keycapId, targetBoxId, cellX, cellY);
    setMovingCap(null);
    loadData();
  };

  const handleAdd = async (data) => {
    await createKeycap(data);
    setShowAddModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this keycap?")) {
      await deleteKeycap(id);
      setSelectedCap(null);
      loadData();
    }
  };

  const handleEdit = async (id, data) => {
    const cleaned = {
      ...data,
      maker_id: data.maker_id || null,
      collab_id: data.collab_id === "" ? null : data.collab_id,
      box_id: data.box_id || null,
    };
    await updateKeycap(id, cleaned);
    setSelectedCap(null);
    loadData();
  };

  const handleAddBox = async (data) => {
    await createBox(data);
    setShowAddBoxModal(false);
    loadData();
  };

  const handleDeleteBox = async (id) => {
    if (confirm("Delete this box? All keycaps inside will become unboxed.")) {
      await deleteBox(id);
      loadData();
    }
  };

  const handleAddMaker = async (data) => {
    await createMaker(data);
    setShowAddMakerModal(false);
    loadData();
  };

  const handleDeleteMaker = async (id) => {
    if (confirm("Delete this maker? This may break keycaps that reference it.")) {
      await deleteMaker(id);
      loadData();
    }
  };

  const totalCapacity = inventory.reduce((s, b) => s + (b.capacity || 0), 0);
  const totalUsed = inventory.reduce((s, b) => s + (b.current_count || 0), 0);
  const unboxed = keycaps.filter((c) => !c.box_id);

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  return (
    <>
      <header className="app-header">
        <h1>Waste of Time</h1>
        <div className="header-controls">
          <input
            className="search-input"
            placeholder="Search maker, sculpt, colorway..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
          />
          <button className="btn" onClick={() => setSearch(searchInput)}>Search</button>
          <button className="btn btn-secondary" onClick={() => setShowAddBoxModal(true)}>
            + Add Box
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAddMakerModal(true)}>
            + Add Maker
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Keycap
          </button>
        </div>
      </header>

      <div className="status-bar">
        <span>
          <span className="highlight">{totalUsed}</span> / {totalCapacity} slots used
        </span>
        <span>
          <span className="highlight">{uniqueSculpts.length}</span> sculpts
        </span>
        <span>
          <span className="highlight">{boxes.length}</span> boxes
        </span>
        {movingCap && showMoveModal && (
          <>
            <span style={{ marginLeft: "auto" }}>
              Moving: <span className="highlight">{movingCap.sculpt}</span> — click a box below
            </span>
            <span className="cancel-btn" onClick={() => { setShowMoveModal(false); setMovingCap(null); }}>
              Cancel
            </span>
          </>
        )}
      </div>

      <div className="boxes-grid">
        {boxes.map((box) => {
          const boxCaps = keycaps.filter((c) => c.box_id === box.id);
          const inv = inventory.find((i) => i.id === box.id);
          const pct = box.capacity ? (boxCaps.length / box.capacity) * 100 : 0;
          const isDropTarget = movingCap && (box.id !== movingCap.box_id || !movingCap.box_id);
          const width = box.width || 9;
          const height = box.height || 9;

          const capAt = (x, y) => boxCaps.find((c) => c.cell_x === x && c.cell_y === y);

          return (
            <div
              key={box.id}
              className={`box-card${isDropTarget ? " drop-target" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
              }}
            >
              <div className="box-header">
                <h2>
                  <Link to={`/box/${box.id}`} className="box-link">
                    {box.label} — {box.name || "Unnamed"}
                  </Link>
                </h2>
                <span className={`box-badge${pct >= 100 ? " full" : ""}`}>
                  {boxCaps.length}/{box.capacity || "?"}
                </span>
              </div>
              <div
                className="keycap-grid"
                style={{
                  gridTemplateColumns: `repeat(${width}, 1fr)`,
                }}
              >
                {Array.from({ length: height }).map((_, y) =>
                  Array.from({ length: width }).map((_, x) => {
                    const cap = capAt(x, y);
                    const isEmpty = !cap;
                    const isSelected = selectedCap?.id === cap?.id;
                    const isMoving = movingCap?.id === cap?.id;
                    const isDropCap = movingCap && isEmpty;

                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`keycap-cell${isEmpty ? " empty" : " filled"}${isSelected ? " selected" : ""}${isMoving ? " selected" : ""}`}
                        title={!isEmpty ? `ID: ${cap.id}\nMaker: ${cap.maker_name}${cap.collab_name ? ' x ' + cap.collab_name : ''}\nSculpt: ${cap.sculpt}\nColorway: ${cap.colorway || '—'}\nBox: ${cap.label || '—'}\nPosition: (${cap.cell_x}, ${cap.cell_y})` : ''}
                        draggable={!isEmpty}
                        onDragStart={(e) => {
                          if (!isEmpty) {
                            e.dataTransfer.setData("text/plain", cap.id);
                            setMovingCap(cap);
                          }
                        }}
                        onDragOver={(e) => {
                          if (isDropCap) e.preventDefault();
                        }}
                        onDrop={(e) => {
                          if (isDropCap && movingCap) {
                            e.preventDefault();
                            handleMove(movingCap.id, box.id, x, y);
                          }
                        }}
                        onClick={() => {
                          if (movingCap) {
                            handleMove(movingCap.id, box.id, x, y);
                          } else if (!isEmpty) {
                            setSelectedCap(cap);
                          }
                        }}
                      >
                        {!isEmpty ? (
                          <>
                            <Link to={`/maker/${cap.maker_id}`} className="maker-link" onClick={(e) => e.stopPropagation()}>
                              {cap.maker_name?.split(" ")[0]}
                            </Link>
                            {cap.collab_name && <span className="collab"> x {cap.collab_name}</span>}
                            <span className="sculpt">{cap.sculpt}</span>
                            {cap.colorway && <span className="colorway">{cap.colorway}</span>}
                          </>
                        ) : null}
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
              <div
                key={cap.id}
                className={`keycap-cell filled unboxed-cap${movingCap?.id === cap.id ? " selected" : ""}`}
                title={`ID: ${cap.id}\nMaker: ${cap.maker_name}${cap.collab_name ? ' x ' + cap.collab_name : ''}\nSculpt: ${cap.sculpt}\nColorway: ${cap.colorway || '—'}\nBox: ${cap.label || 'Unboxed'}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", cap.id);
                  setMovingCap(cap);
                }}
                onClick={() => setSelectedCap(cap)}
              >
                <Link to={`/maker/${cap.maker_id}`} className="maker-link" onClick={(e) => e.stopPropagation()}>
                  {cap.maker_name?.split(" ")[0]}
                </Link>
                {cap.collab_name && <span className="collab"> x {cap.collab_name}</span>}
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

      {selectedCap && (
        <KeycapModal
          cap={selectedCap}
          boxes={boxes}
          makers={makers}
          onClose={() => setSelectedCap(null)}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onMove={(boxId) => {
            setMovingCap(selectedCap);
            setShowMoveModal(true);
            setSelectedCap(null);
          }}
        />
      )}

      {showMoveModal && movingCap && (
        <MoveModal
          cap={movingCap}
          boxes={boxes}
          inventory={inventory}
          onClose={() => {
            setShowMoveModal(false);
            setMovingCap(null);
          }}
          onMove={(keycapId, boxId, cellX, cellY) => {
            handleMove(keycapId, boxId, cellX, cellY);
            setShowMoveModal(false);
          }}
        />
      )}

      {showAddModal && (
        <AddModal
          boxes={boxes}
          makers={makers}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}

      {showAddBoxModal && (
        <AddBoxModal
          onClose={() => setShowAddBoxModal(false)}
          onAdd={handleAddBox}
        />
      )}

      {showAddMakerModal && (
        <AddMakerModal
          onClose={() => setShowAddMakerModal(false)}
          onAdd={handleAddMaker}
        />
      )}
    </>
  );
}

function MakerPage() {
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

  const uniqueSculpts = [...new Set(keycaps.map((c) => c.sculpt).filter(Boolean))];

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

function BoxPage() {
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

function KeycapModal({ cap, boxes, makers, onClose, onDelete, onEdit, onMove }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    sculpt: cap.sculpt,
    colorway: cap.colorway || "",
    maker_id: cap.maker_id,
    collab_id: cap.collab_id !== null ? cap.collab_id : "",
    box_id: cap.box_id,
  });

  const handleSave = () => {
    onEdit(cap.id, form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{editMode ? "Edit Keycap" : cap.sculpt}</h2>

        {editMode ? (
          <>
            <div className="form-group">
              <label>Sculpt</label>
              <input
                value={form.sculpt}
                onChange={(e) => setForm({ ...form, sculpt: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Colorway</label>
              <input
                value={form.colorway}
                onChange={(e) => setForm({ ...form, colorway: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Maker</label>
              <select
                value={form.maker_id || ""}
                onChange={(e) => setForm({ ...form, maker_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">— None —</option>
                {makers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.maker_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Collab Maker</label>
              <select
                value={form.collab_id || ""}
                onChange={(e) => setForm({ ...form, collab_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">— None —</option>
                {makers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.maker_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Box</label>
              <select
                value={form.box_id || ""}
                onChange={(e) => setForm({ ...form, box_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">— None —</option>
                {boxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label} — {b.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="keycap-detail">
            <div className="detail-row">
              <span className="detail-label">Maker</span>
              {cap.maker_id ? (
                <Link to={`/maker/${cap.maker_id}`} className="maker-link">{cap.maker_name || "—"}</Link>
              ) : (
                <span>{cap.maker_name || "—"}</span>
              )}
            </div>
            {cap.collab_name && (
              <div className="detail-row">
                <span className="detail-label">Collab</span>
                <span>{cap.collab_name}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Sculpt</span>
              <span>{cap.sculpt}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Colorway</span>
              <span>{cap.colorway || "—"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Box</span>
              <span>{cap.label || "—"}</span>
            </div>
          </div>
        )}

        <div className="modal-actions">
          {editMode ? (
            <>
              <button className="btn btn-secondary" onClick={() => setEditMode(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-danger" onClick={() => onDelete(cap.id)}>
                Delete
              </button>
              <button className="btn btn-secondary" onClick={() => onMove()}>
                Move
              </button>
              <button className="btn btn-secondary" onClick={() => setEditMode(true)}>
                Edit
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MoveModal({ cap, boxes, inventory, onClose, onMove }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Move: {cap.sculpt}</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
          Currently in {cap.label || "no box"}
        </p>
        {cap.box_id && (
          <button
            className="move-target-btn"
            style={{ marginBottom: "0.5rem" }}
            onClick={() => onMove(cap.id, null, null, null)}
          >
            <span>Unbox (remove from box)</span>
          </button>
        )}
        <div className="move-target-list">
          {boxes
            .filter((b) => b.id !== cap.box_id)
            .map((b) => {
              const inv = inventory.find((i) => i.id === b.id);
              return (
                <button
                  key={b.id}
                  className="move-target-btn"
                  onClick={() => onMove(cap.id, b.id, 0, 0)}
                >
                  <span>
                    {b.label} — {b.name}
                  </span>
                  <span className="count">
                    {inv?.current_count || 0}/{b.capacity}
                  </span>
                </button>
              );
            })}
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AddModal({ boxes, makers, onClose, onAdd }) {
  const [form, setForm] = useState({ sculpt: "", colorway: "", maker_id: "", collab_id: "", box_id: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      sculpt: form.sculpt,
      colorway: form.colorway || null,
      maker_id: form.maker_id ? Number(form.maker_id) : null,
      collab_id: form.collab_id ? Number(form.collab_id) : null,
      box_id: form.box_id ? Number(form.box_id) : null,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Keycap</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Sculpt *</label>
            <input
              required
              value={form.sculpt}
              onChange={(e) => setForm({ ...form, sculpt: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Colorway</label>
            <input
              value={form.colorway}
              onChange={(e) => setForm({ ...form, colorway: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Maker</label>
            <select
              value={form.maker_id}
              onChange={(e) => setForm({ ...form, maker_id: e.target.value })}
            >
              <option value="">— None —</option>
              {makers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.maker_name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Collab Maker</label>
            <select
              value={form.collab_id}
                onChange={(e) => setForm({ ...form, collab_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">— None —</option>
              {makers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.maker_name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Box</label>
            <select
              value={form.box_id}
              onChange={(e) => setForm({ ...form, box_id: e.target.value })}
            >
              <option value="">— None —</option>
              {boxes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label} — {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddBoxModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    label: "",
    name: "",
    maker_name: "",
    capacity: 81,
    height: 9,
    width: 9,
    dedicated: false,
    allow_add: true,
    allow_duplicates: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...form,
      capacity: form.capacity ? Number(form.capacity) : null,
      height: form.height ? Number(form.height) : 9,
      width: form.width ? Number(form.width) : 9,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Box</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Label * (unique)</label>
            <input
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. A1"
            />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. GMK Artisan Display"
            />
          </div>
          <div className="form-group">
            <label>Maker Name</label>
            <input
              value={form.maker_name}
              onChange={(e) => setForm({ ...form, maker_name: e.target.value })}
              placeholder="e.g. NovelKeys"
            />
          </div>
          <div className="form-group">
            <label>Capacity</label>
            <input
              type="number"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Height</label>
              <input
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Width</label>
              <input
                type="number"
                value={form.width}
                onChange={(e) => setForm({ ...form, width: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={form.dedicated}
                  onChange={(e) => setForm({ ...form, dedicated: e.target.checked })}
                /> Dedicated
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={form.allow_add}
                  onChange={(e) => setForm({ ...form, allow_add: e.target.checked })}
                /> Allow Add
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={form.allow_duplicates}
                  onChange={(e) => setForm({ ...form, allow_duplicates: e.target.checked })}
                /> Allow Duplicates
              </label>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMakerModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    maker_name: "",
    maker_name_clean: "",
    instagram: "",
    city: "",
    state: "",
    country: "",
    first_name: "",
    state_code: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...form,
      maker_name_clean: form.maker_name_clean || form.maker_name.toLowerCase().replace(/[^a-z0-9]/g, ""),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Maker</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name * (unique)</label>
            <input
              required
              value={form.maker_name}
              onChange={(e) => setForm({ ...form, maker_name: e.target.value })}
              placeholder="e.g. Keycult"
            />
          </div>
          <div className="form-group">
            <label>Clean Name (for unique ID)</label>
            <input
              value={form.maker_name_clean}
              onChange={(e) => setForm({ ...form, maker_name_clean: e.target.value })}
              placeholder="e.g. keycult"
            />
          </div>
          <div className="form-group">
            <label>First Name</label>
            <input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              placeholder="e.g. John"
            />
          </div>
          <div className="form-group">
            <label>Instagram</label>
            <input
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="@username"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>State Code</label>
              <input
                value={form.state_code}
                onChange={(e) => setForm({ ...form, state_code: e.target.value })}
                placeholder="CA"
                maxLength={3}
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="US"
                maxLength={10}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const countryNames = {
  US: "United States",
  CA: "Canada",
  UK: "United Kingdom",
  DE: "Germany",
  FR: "France",
  JP: "Japan",
  CN: "China",
  KR: "South Korea",
  AU: "Australia",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  CH: "Switzerland",
  AT: "Austria",
  BE: "Belgium",
  IE: "Ireland",
  NZ: "New Zealand",
  SG: "Singapore",
  HK: "Hong Kong",
  TW: "Taiwan",
  MX: "Mexico",
  BR: "Brazil",
  VN: "Vietnam",
  TH: "Thailand",
  MY: "Malaysia",
  PH: "Philippines",
  ID: "Indonesia",
  IN: "India",
  PL: "Poland",
  CZ: "Czech Republic",
  PT: "Portugal",
  GR: "Greece",
  HU: "Hungary",
  RO: "Romania",
  RU: "Russia",
  UA: "Ukraine",
  IL: "Israel",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  ZA: "South Africa",
  EG: "Egypt",
  NG: "Nigeria",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  PE: "Peru",
};

const countryFlags = {
  US: "🇺🇸",
  CA: "🇨🇦",
  UK: "🇬🇧",
  DE: "🇩🇪",
  FR: "🇫🇷",
  JP: "🇯🇵",
  CN: "🇨🇳",
  KR: "🇰🇷",
  AU: "🇦🇺",
  IT: "🇮🇹",
  ES: "🇪🇸",
  NL: "🇳🇱",
  SE: "🇸🇪",
  NO: "🇳🇴",
  DK: "🇩🇰",
  FI: "🇫🇮",
  CH: "🇨🇭",
  AT: "🇦🇹",
  BE: "🇧🇪",
  IE: "🇮🇪",
  NZ: "🇳🇿",
  SG: "🇸🇬",
  HK: "🇭🇰",
  TW: "🇹🇼",
  MX: "🇲🇽",
  BR: "🇧🇷",
  VN: "🇻🇳",
  TH: "🇹🇭",
  MY: "🇲🇾",
  PH: "🇵🇭",
  ID: "🇮🇩",
  IN: "🇮🇳",
  PL: "🇵🇱",
  CZ: "🇨🇿",
  PT: "🇵🇹",
  GR: "🇬🇷",
  HU: "🇭🇺",
  RO: "🇷🇴",
  RU: "🇷🇺",
  UA: "🇺🇦",
  IL: "🇮🇱",
  AE: "🇦🇪",
  SA: "🇸🇦",
  ZA: "🇿🇦",
  EG: "🇪🇬",
  NG: "🇳🇬",
  AR: "🇦🇷",
  CL: "🇨🇱",
  CO: "🇨🇴",
  PE: "🇵🇪",
};

function CountryFlag({ code }) {
  const flag = countryFlags[code?.toUpperCase()];
  const name = countryNames[code?.toUpperCase()];
  
  if (!flag) return null;
  
  return (
    <span className="country-flag" title={name || code}>
      {flag}
    </span>
  );
}

export default App;