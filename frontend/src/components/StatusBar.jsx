import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchMakers, fetchKeycaps, fetchBoxes } from "../api";

export function StatusBar() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([fetchMakers(), fetchKeycaps(), fetchBoxes()])
      .then(([makers, keycaps, boxes]) => {
        const uniqueSculpts = [...new Set(keycaps.map((c) => c.unique_id).filter(Boolean))];
        setStats({ makers: makers.length, sculpts: uniqueSculpts.length, keycaps: keycaps.length, boxes: boxes.length });
      })
      .catch(console.error);
  }, []);

  if (!stats) return null;

  return (
    <div className="status-bar">
      <span><Link to="/makers" className="stat-link"><span className="highlight">{stats.makers}</span> makers</Link></span>
      <span><span className="highlight">{stats.sculpts}</span> sculpts</span>
      <span><span className="highlight">{stats.keycaps}</span> keycaps</span>
      <span><span className="highlight">{stats.boxes}</span> boxes</span>
    </div>
  );
}
