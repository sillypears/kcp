const API = "";

export async function fetchKeycaps(params = {}) {
  const qs = new URLSearchParams();
  if (params.box_id) qs.set("box_id", params.box_id);
  if (params.maker_id) qs.set("maker_id", params.maker_id);
  if (params.search) qs.set("search", params.search);
  const res = await fetch(`${API}/api/keycaps/?${qs}`);
  if (!res.ok) throw new Error("Failed to fetch keycaps");
  return res.json();
}

export async function fetchKeycap(id) {
  const res = await fetch(`${API}/api/keycaps/${id}`);
  if (!res.ok) throw new Error("Failed to fetch keycap");
  return res.json();
}

export async function createKeycap(data) {
  const res = await fetch(`${API}/api/keycaps/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create keycap");
  return res.json();
}

export async function updateKeycap(id, data) {
  const res = await fetch(`${API}/api/keycaps/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update keycap");
  return res.json();
}

export async function deleteKeycap(id) {
  const res = await fetch(`${API}/api/keycaps/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete keycap");
}

export async function moveKeycap(keycap_id, box_id, cell_x, cell_y) {
  const res = await fetch(`${API}/api/keycaps/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keycap_id, box_id, cell_x, cell_y }),
  });
  if (!res.ok) throw new Error("Failed to move keycap");
  return res.json();
}

export async function fetchBoxes() {
  const res = await fetch(`${API}/api/boxes/`);
  if (!res.ok) throw new Error("Failed to fetch boxes");
  return res.json();
}

export async function fetchBoxKeycaps(boxId) {
  const res = await fetch(`${API}/api/boxes/${boxId}/keycaps`);
  if (!res.ok) throw new Error("Failed to fetch box keycaps");
  return res.json();
}

export async function fetchMakers() {
  const res = await fetch(`${API}/api/makers/`);
  if (!res.ok) throw new Error("Failed to fetch makers");
  return res.json();
}

export async function createMaker(data) {
  const res = await fetch(`${API}/api/makers/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create maker");
  return res.json();
}

export async function deleteMaker(id) {
  const res = await fetch(`${API}/api/makers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete maker");
}

export async function createBox(data) {
  const res = await fetch(`${API}/api/boxes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create box");
  return res.json();
}

export async function updateBox(id, data) {
  const res = await fetch(`${API}/api/boxes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update box");
  return res.json();
}

export async function deleteBox(id) {
  const res = await fetch(`${API}/api/boxes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete box");
}

export async function fetchBoxInventory() {
  const res = await fetch(`${API}/api/stats/box-inventory`);
  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json();
}
