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
} from "./api";

function App() {
  const [keycaps, setKeycaps] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [makers, setMakers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCap, setSelectedCap] = useState(null);
  const [movingCap, setMovingCap] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

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
    await updateKeycap(id, data);
    setSelectedCap(null);
    loadData();
  };

  const totalCapacity = inventory.reduce((s, b) => s + (b.capacity || 0), 0);
  const totalUsed = inventory.reduce((s, b) => s + (b.current_count || 0), 0);

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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          <span className="highlight">{keycaps.length}</span> keycaps
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
          const isDropTarget = movingCap && box.id !== movingCap.box_id;
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
                  {box.label} — {box.name || "Unnamed"}
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
                            <span className="maker">{cap.maker_name?.split(" ")[0]}</span>
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
    </>
  );
}

function KeycapModal({ cap, boxes, makers, onClose, onDelete, onEdit, onMove }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    sculpt: cap.sculpt,
    colorway: cap.colorway || "",
    maker_id: cap.maker_id,
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
              <span>{cap.maker_name || "—"}</span>
            </div>
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
  const [form, setForm] = useState({ sculpt: "", colorway: "", maker_id: "", box_id: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      sculpt: form.sculpt,
      colorway: form.colorway || null,
      maker_id: form.maker_id ? Number(form.maker_id) : null,
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

export default App;
