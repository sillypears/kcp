import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { KeycapModal, MoveModal, AddModal, AddBoxModal, AddMakerModal } from "../components/Modals";
import { Footer } from "../components/Footer";
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
} from "../api";

export function HomePage() {
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [boxList, makerList, inv] = await Promise.all([
        fetchBoxes(),
        fetchMakers(),
        fetchBoxInventory(),
      ]);
      setBoxes(boxList);
      setMakers(makerList);
      setInventory(inv);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadKeycaps = useCallback(async (searchTerm) => {
    try {
      const caps = await fetchKeycaps(searchTerm ? { search: searchTerm } : {});
      setKeycaps(caps);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadKeycaps(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, loadKeycaps]);

  const handleMove = async (keycapId, targetBoxId, cellX, cellY) => {
    setKeycaps((prev) =>
      prev.map((k) =>
        k.id === keycapId
          ? { ...k, box_id: targetBoxId, cell_x: cellX, cell_y: cellY, label: targetBoxId ? boxes.find((b) => b.id === targetBoxId)?.label : null }
          : k
      )
    );
    setMovingCap(null);
    await moveKeycap(keycapId, targetBoxId, cellX, cellY);
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

  const handleAddMaker = async (data) => {
    await createMaker(data);
    setShowAddMakerModal(false);
    loadData();
  };

  const totalCapacity = inventory.reduce((s, b) => s + (b.capacity || 0), 0);
  const totalUsed = inventory.reduce((s, b) => s + (b.current_count || 0), 0);
  const unboxed = keycaps.filter((c) => !c.box_id);
  const filteredUniqueSculpts = [...new Set(keycaps.map((c) => c.unique_id).filter(Boolean))];

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  return (
    <>
      <header className="app-header">
        <h1>Waste of Time</h1>
        <div className="header-controls">
          <div className="search-wrapper">
            <input
              className="search-input"
              placeholder="Search maker, sculpt, colorway..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setSearch(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
            />
            {searchInput && (
              <button
                className="search-clear"
                onClick={() => { setSearchInput(""); setSearch(""); }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
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
        <span><span className="highlight">{filteredUniqueSculpts.length}</span> sculpts</span>
        <span>{totalUsed}/{totalCapacity} slots used</span>
        <span><span className="highlight">{boxes.length}</span> boxes</span>
        {unboxed.length > 0 && (
          <span><span className="highlight">{unboxed.length}</span> unboxed</span>
        )}
      </div>

      <div className="boxes-grid">
        {boxes.map((box) => {
          const boxCaps = keycaps.filter((c) => c.box_id === box.id);
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
                setKeycaps((prev) =>
                  prev.map((k) =>
                    k.id === movingCap.id
                      ? { ...k, box_id: box.id, cell_x: 0, cell_y: 0, label: box.label }
                      : k
                  )
                );
                setMovingCap(null);
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
          <h2>Unboxed Keycaps</h2>
          <div className="unboxed-grid">
            {unboxed.map((cap) => (
              <div
                key={cap.id}
                className={`keycap-cell filled unboxed-cap${movingCap?.id === cap.id ? " selected" : ""}`}
                title={`ID: ${cap.id}\nMaker: ${cap.maker_name}${cap.collab_name ? ' x ' + cap.collab_name : ''}\nSculpt: ${cap.sculpt}\nColorway: ${cap.colorway || '—'}`}
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

      {selectedCap && (
        <KeycapModal
          cap={selectedCap}
          boxes={boxes}
          makers={makers}
          onClose={() => setSelectedCap(null)}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onMove={() => {
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

      <Footer />
    </>
  );
}
