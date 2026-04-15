import { useState } from "react";
import { Link } from "react-router-dom";

export function KeycapModal({ cap, boxes, makers, onClose, onDelete, onEdit, onMove }) {
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

export function MoveModal({ cap, boxes, inventory, onClose, onMove }) {
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

export function AddModal({ boxes, makers, keycaps, onClose, onAdd }) {
  const [form, setForm] = useState({ sculpt: "", colorway: "", maker_id: "", collab_id: "", box_id: "" });

  const findFirstEmptyCell = (boxId) => {
    if (!boxId || !keycaps) return { cell_x: 0, cell_y: 0 };
    const box = boxes.find((b) => b.id === boxId);
    if (!box) return { cell_x: 0, cell_y: 0 };
    const width = box.width || 9;
    const height = box.height || 9;
    const boxKeycaps = keycaps.filter((k) => k.box_id === boxId);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const occupied = boxKeycaps.some((k) => k.cell_x === x && k.cell_y === y);
        if (!occupied) return { cell_x: x, cell_y: y };
      }
    }
    return { cell_x: 0, cell_y: 0 };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const boxId = form.box_id ? Number(form.box_id) : null;
    const cell = boxId ? findFirstEmptyCell(boxId) : { cell_x: null, cell_y: null };
    onAdd({
      sculpt: form.sculpt,
      colorway: form.colorway || null,
      maker_id: form.maker_id ? Number(form.maker_id) : null,
      collab_id: form.collab_id ? Number(form.collab_id) : null,
      box_id: boxId,
      cell_x: cell.cell_x,
      cell_y: cell.cell_y,
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

export function AddBoxModal({ onClose, onAdd }) {
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
            <label>Label *</label>
            <input
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g., A1"
            />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Drew's Alphas"
            />
          </div>
          <div className="form-group">
            <label>Maker</label>
            <input
              value={form.maker_name}
              onChange={(e) => setForm({ ...form, maker_name: e.target.value })}
              placeholder="e.g., Keycult"
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
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={form.dedicated}
                onChange={(e) => setForm({ ...form, dedicated: e.target.checked })}
              />
              Dedicated (only for one maker)
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={form.allow_add}
                onChange={(e) => setForm({ ...form, allow_add: e.target.checked })}
              />
              Allow adding keycaps
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={form.allow_duplicates}
                onChange={(e) => setForm({ ...form, allow_duplicates: e.target.checked })}
              />
              Allow duplicates
            </label>
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

export function AddMakerModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    maker_name: "",
    maker_name_clean: "",
    instagram: "",
    city: "",
    state: "",
    country: "",
    first_name: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...form,
      maker_name_clean: form.maker_name_clean || form.maker_name.toLowerCase().replace(/\s+/g, "_"),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Maker</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              required
              value={form.maker_name}
              onChange={(e) => setForm({ ...form, maker_name: e.target.value })}
              placeholder="e.g., Keycult"
            />
          </div>
          <div className="form-group">
            <label>Clean Name</label>
            <input
              value={form.maker_name_clean}
              onChange={(e) => setForm({ ...form, maker_name_clean: e.target.value })}
              placeholder="e.g., keycult (auto-generated if empty)"
            />
          </div>
          <div className="form-group">
            <label>Instagram</label>
            <input
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              placeholder="username only"
            />
          </div>
          <div className="form-group">
            <label>First Name</label>
            <input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
          </div>
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
          <div className="form-group">
            <label>Country</label>
            <input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Archivist ID</label>
            <input
              value={form.keycap_archivist_id}
              onChange={(e) => setForm({ ...form, keycap_archivist_id: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Archivist Name</label>
            <input
              value={form.keycap_archivist_name}
              onChange={(e) => setForm({ ...form, keycap_archivist_name: e.target.value })}
            />
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
