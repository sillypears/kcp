export function UnboxedStatusBar({ unboxed }) {
  if (!unboxed || unboxed.length === 0) return null;

  const uniqueSculpts = [...new Set(unboxed.map((c) => c.unique_id).filter(Boolean))];
  const uniqueMakers = [...new Set(unboxed.map((c) => c.maker_name).filter(Boolean))];

  return (
    <div className="status-bar">
      <span><span className="highlight">{unboxed.length}</span> unboxed keycaps</span>
      <span><span className="highlight">{uniqueSculpts.length}</span> unboxed sculpts</span>
      <span><span className="highlight">{uniqueMakers.length}</span> makers</span>
    </div>
  );
}
