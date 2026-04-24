import { useState } from 'react';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/bfhl';

// Render tree as indented text lines
function renderTree(obj, prefix = '', isLast = true) {
  const entries = Object.entries(obj);
  return entries.map(([key, children], idx) => {
    const isLastEntry = idx === entries.length - 1;
    const connector = isLastEntry ? '└── ' : '├── ';
    const childPrefix = prefix + (isLastEntry ? '    ' : '│   ');
    const childLines = Object.keys(children).length > 0
      ? renderTree(children, childPrefix, isLastEntry)
      : [];
    return [prefix + connector + key, ...childLines].join('\n');
  }).join('\n');
}

function TreeDisplay({ tree, hasCycle }) {
  if (hasCycle) {
    return <div className="tree-view empty">⟳ Cycle detected — no tree structure</div>;
  }
  const entries = Object.entries(tree);
  if (entries.length === 0) return <div className="tree-view empty">empty</div>;
  const [rootKey, rootChildren] = entries[0];
  const childLines = Object.keys(rootChildren).length > 0
    ? renderTree(rootChildren)
    : '';
  const full = rootKey + (childLines ? '\n' + childLines : '');
  return <pre className="tree-view">{full}</pre>;
}

export default function App() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResponse(null);
    if (!input.trim()) {
      setError('Please enter a JSON array of node strings.');
      return;
    }
    let parsed;
    try {
      const raw = JSON.parse(input);
      // Accept both: plain array OR {"data": [...]} object
      if (Array.isArray(raw)) {
        parsed = raw;
      } else if (raw && Array.isArray(raw.data)) {
        parsed = raw.data;
      } else {
        throw new Error();
      }
    } catch {
      setError('Invalid JSON. Paste a JSON array like ["A->B", "A->C"] or the full {"data": [...]} object.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsed }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to the API. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="header">
        <div className="header-badge">
          <span className="dot" />
          SRM Full Stack Challenge — Round 1
        </div>
        <h1>Hierarchy Processor</h1>
        <p>Enter a list of node edges to analyze trees, detect cycles, and compute insights.</p>
      </header>

      {/* Input Card */}
      <div className="card input-section">
        <div className="card-header">
          <div className="card-header-title">
            <div className="card-header-icon" style={{ background: 'rgba(124,106,255,0.15)' }}>📝</div>
            Node Edge Input
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-label">
              <span className="form-label-text">JSON Array</span>
            </div>
            <textarea
              className="input-area"
              placeholder={'Paste an array: ["A->B", "A->C"]\n\nOR paste the full request body:\n{\n  "data": ["A->B", "A->C"]\n}'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {error && (
              <div className="error-box">
                <span className="error-icon">⚠</span>
                <div>{error}</div>
              </div>
            )}
            <div className="submit-row">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <><div className="spinner" /> Processing...</> : <>⚡ Analyze Nodes</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      {response && (
        <div className="result-section" style={{ marginTop: 24 }}>
          {/* User Strip */}
          <div className="user-strip">
            <span className="user-strip-item">🪪 <strong>{response.user_id}</strong></span>
            <span className="user-strip-sep">·</span>
            <span className="user-strip-item">✉ <strong>{response.email_id}</strong></span>
            <span className="user-strip-sep">·</span>
            <span className="user-strip-item">🎓 <strong>{response.college_roll_number}</strong></span>
          </div>

          {/* Summary Stats */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-header-title">
                <div className="card-header-icon" style={{ background: 'rgba(34,211,160,0.15)' }}>📊</div>
                Summary
              </div>
            </div>
            <div className="card-body">
              <div className="summary-grid">
                <div className="stat-card trees">
                  <div className="stat-label">Valid Trees</div>
                  <div className="stat-value">{response.summary.total_trees}</div>
                </div>
                <div className="stat-card cycles">
                  <div className="stat-label">Pure Cycles</div>
                  <div className="stat-value">{response.summary.total_cycles}</div>
                </div>
                <div className="stat-card root">
                  <div className="stat-label">Largest Root</div>
                  <div className="stat-value">{response.summary.largest_tree_root || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hierarchies */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-header-title">
                <div className="card-header-icon" style={{ background: 'rgba(94,170,255,0.15)' }}>🌲</div>
                Hierarchies ({response.hierarchies.length})
              </div>
            </div>
            <div className="card-body">
              {response.hierarchies.length === 0 ? (
                <p className="empty-notice">No hierarchies found.</p>
              ) : (
                <div className="hierarchies-grid">
                  {response.hierarchies.map((h, i) => (
                    <div key={i} className={`hierarchy-card${h.has_cycle ? ' cycle' : ''}`}>
                      <div className="hierarchy-top">
                        <div className="hierarchy-root">
                          <div className="root-badge">{h.root}</div>
                          <div className="root-label">
                            <strong>Root: {h.root}</strong>
                            {h.has_cycle ? 'Cyclic Group' : `Depth: ${h.depth}`}
                          </div>
                        </div>
                        {h.has_cycle
                          ? <span className="cycle-tag">⟳ Cycle</span>
                          : <span className="depth-tag">↕ {h.depth}</span>
                        }
                      </div>
                      <TreeDisplay tree={h.tree} hasCycle={!!h.has_cycle} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Invalid & Duplicate */}
          <div className="info-panels">
            <div className="info-panel invalid">
              <div className="info-panel-header">
                ✕ Invalid Entries
                <span className="info-panel-count">{response.invalid_entries.length}</span>
              </div>
              <div className="info-panel-body">
                {response.invalid_entries.length > 0
                  ? response.invalid_entries.map((e, i) => <div key={i}>"{e}"</div>)
                  : <div className="empty-notice">None — all entries were valid</div>
                }
              </div>
            </div>
            <div className="info-panel duplicate">
              <div className="info-panel-header">
                ⊕ Duplicate Edges
                <span className="info-panel-count">{response.duplicate_edges.length}</span>
              </div>
              <div className="info-panel-body">
                {response.duplicate_edges.length > 0
                  ? response.duplicate_edges.map((e, i) => <div key={i}>"{e}"</div>)
                  : <div className="empty-notice">None — no duplicates found</div>
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}