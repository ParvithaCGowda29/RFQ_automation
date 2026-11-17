import { useState } from "react";
import { MASTER_SHEETS } from "./mastersData";

// CAM Masters - same three masters and fixed columns as Admin_Masters,
// contents from the approved "CAM Masters - contents for review.xlsx".
export function Masters() {
  const [active, setActive] = useState(0);
  const sheet = MASTER_SHEETS[active];
  return (
    <div className="mst">
      <aside className="mst-nav">
        <div className="mst-nav-label">MASTERS</div>
        {MASTER_SHEETS.map((s, i) => (
          <button key={s.name} className={"mst-nav-item" + (i === active ? " on" : "")}
            aria-current={i === active ? "page" : undefined} onClick={() => setActive(i)}>
            <span>{s.name}</span>
            <small className="mst-count">{s.rows.length}</small>
          </button>
        ))}
      </aside>
      <section className="mst-body">
        <div className="mst-h">
          <h2>{sheet.name}</h2>
          <span className="mst-sub">{sheet.rows.length} row{sheet.rows.length === 1 ? "" : "s"} - {sheet.headers.length} fixed columns</span>
        </div>
        <div className="mst-grid-wrap">
          <table className="mst-grid">
            <thead>
              <tr>{sheet.headers.map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {sheet.rows.map((r, ri) => (
                <tr key={ri}>
                  {sheet.headers.map(h => <td key={h} title={r[h] || undefined}>{r[h] || ""}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mst-foot">
          <span>Column names match the masters workbook - hover a cell to read the full text</span>
          <span>Demo data - No backend connected</span>
        </div>
      </section>
    </div>
  );
}
