import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

/* ─── Sidebar nav config ─────────────────────── */
const NAV = [
  { id: 'overview',    label: 'Overview',       icon: '📊' },
  { id: 'investments', label: 'Investments',     icon: '💼' },
  { id: 'roi',         label: 'ROI History',     icon: '📈' },
  { id: 'referral',    label: 'Referral Income', icon: '💰' },
  { id: 'tree',        label: 'Referral Tree',   icon: '🌲' },
];

/* ─── Toast ──────────────────────────────────── */
const Toast = ({ toasts }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast ${t.type}`}>
        {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'} {t.msg}
      </div>
    ))}
  </div>
);

/* ─── Custom Tooltip ─────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>
          ₹{Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
};

/* ─── Investment Modal ───────────────────────── */
const PLANS = [
  { name: 'Starter Plan',  durationDays: 30,  dailyROIPercentage: 1.0 },
  { name: 'Silver Plan',   durationDays: 60,  dailyROIPercentage: 1.5 },
  { name: 'Gold Plan',     durationDays: 90,  dailyROIPercentage: 2.0 },
  { name: 'Platinum Plan', durationDays: 180, dailyROIPercentage: 2.5 },
];

const InvestModal = ({ onClose, onSuccess, showToast }) => {
  const [selected, setSelected] = useState(PLANS[0]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const expectedTotal = amount
    ? (Number(amount) * selected.dailyROIPercentage / 100 * selected.durationDays).toFixed(2)
    : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 100) {
      showToast('Minimum investment is ₹100', 'error'); return;
    }
    setLoading(true);
    try {
      await api.post('/investments', {
        amount: Number(amount),
        planName: selected.name,
        durationDays: selected.durationDays,
        dailyROIPercentage: selected.dailyROIPercentage
      });
      showToast('Investment created successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create investment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">💼 New Investment</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>CHOOSE PLAN</p>
            <div className="plan-grid">
              {PLANS.map(p => (
                <div
                  key={p.name}
                  className={`plan-card ${selected.name === p.name ? 'selected' : ''}`}
                  onClick={() => setSelected(p)}
                >
                  <div className="plan-card-name">{p.name}</div>
                  <div className="plan-card-roi">{p.dailyROIPercentage}% <span>/ day</span></div>
                  <div className="plan-card-duration">⏱ {p.durationDays} days</div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Investment Amount (₹)</label>
              <input
                type="number"
                placeholder="Min ₹100"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="100"
                required
              />
            </div>

            {amount > 0 && (
              <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Daily ROI</span>
                  <span className="text-green">₹{(Number(amount) * selected.dailyROIPercentage / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total ROI ({selected.durationDays}d)</span>
                  <span className="text-green">₹{expectedTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                  <span style={{ fontWeight: 600 }}>Total Return</span>
                  <span style={{ fontWeight: 700, color: '#818cf8' }}>₹{(Number(amount) + Number(expectedTotal)).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-action outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-action primary" disabled={loading}>
              {loading ? 'Processing...' : '✅ Confirm Investment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Referral Tree Node ─────────────────────── */
const LEVEL_COLORS = ['level-1-avatar', 'level-2-avatar', 'level-3-avatar', 'level-4-avatar', 'level-5-avatar'];
const LEVEL_COMMISSIONS = { 1: '5%', 2: '3%', 3: '2%', 4: '1%', 5: '0.5%' };

const TreeNode = ({ node }) => (
  <div className="tree-node">
    <div className="tree-node-card">
      <div className={`tree-node-avatar ${LEVEL_COLORS[(node.level - 1) % 5]}`}>
        {node.fullName?.charAt(0).toUpperCase()}
      </div>
      <div>
        <div className="tree-node-name">{node.fullName}</div>
        <div className="tree-node-email">{node.email}</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span className="tree-level-badge">L{node.level} • {LEVEL_COMMISSIONS[node.level]}</span>
      </div>
    </div>
    {node.children?.length > 0 && (
      <div className="tree-children">
        {node.children.map((child, i) => <TreeNode key={i} node={child} />)}
      </div>
    )}
  </div>
);

/* ─── Main Dashboard ─────────────────────────── */
const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [page, setPage] = useState('overview');
  const [stats, setStats]         = useState(null);
  const [investments, setInvs]    = useState([]);
  const [roiHistory, setROI]      = useState([]);
  const [levelIncome, setLevel]   = useState([]);
  const [referralTree, setTree]   = useState([]);
  const [directRefs, setDirect]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts]       = useState([]);
  const [copied, setCopied]       = useState(false);

  const showToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [s, inv, roi, li, tree, direct] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/investments?limit=50'),
        api.get('/dashboard/roi-history?limit=50'),
        api.get('/dashboard/level-income?limit=50'),
        api.get('/referrals/tree'),
        api.get('/referrals/direct')
      ]);
      setStats(s.data.data);
      setInvs(inv.data.data.investments);
      setROI(roi.data.data.roiHistory);
      setLevel(li.data.data.levelIncome);
      setTree(tree.data.data.tree);
      setDirect(direct.data.data.referrals);
    } catch (err) {
      showToast('Failed to load some data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const copyCode = () => {
    navigator.clipboard.writeText(user?.referralCode || '');
    setCopied(true);
    showToast('Referral code copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerROI = async () => {
    try {
      const res = await api.post('/investments/trigger-roi');
      const d = res.data.data;
      showToast(`ROI Processed: ${d.processed} credited, ${d.skipped} skipped`, 'success');
      fetchAll();
    } catch (err) {
      showToast('ROI trigger failed', 'error');
    }
  };

  // Chart data from ROI history
  const chartData = roiHistory.slice(0, 14).reverse().map(r => ({
    date: new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    roi: r.amount
  }));

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p className="loading-text">Loading your dashboard...</p>
    </div>
  );

  return (
    <div className="app-layout">
      <Toast toasts={toasts} />

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💎</div>
          <div className="sidebar-logo-text">
            InvestPro
            <span>Investment Platform</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {NAV.map(n => (
            <div
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName}</div>
            <div className="sidebar-user-role">Investor</div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Logout">⏻</button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">{NAV.find(n => n.id === page)?.label}</div>
            <div className="topbar-subtitle">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="topbar-actions">
            <button className="btn-action success" onClick={handleTriggerROI}>⚡ Process ROI</button>
            <button className="btn-action primary" onClick={() => setShowModal(true)}>+ New Investment</button>
          </div>
        </div>

        <div className="page-content">
          {page === 'overview' && <OverviewPage stats={stats} chartData={chartData} user={user} copyCode={copyCode} copied={copied} directRefs={directRefs} />}
          {page === 'investments' && <InvestmentsPage investments={investments} setShowModal={setShowModal} />}
          {page === 'roi' && <ROIPage roiHistory={roiHistory} />}
          {page === 'referral' && <ReferralIncomePage levelIncome={levelIncome} />}
          {page === 'tree' && <TreePage tree={referralTree} user={user} />}
        </div>
      </div>

      {showModal && (
        <InvestModal onClose={() => setShowModal(false)} onSuccess={fetchAll} showToast={showToast} />
      )}
    </div>
  );
};

export default Dashboard;

/* ─── Page: Overview ─────────────────────────── */
const OverviewPage = ({ stats, chartData, user, copyCode, copied, directRefs }) => (
  <>
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-card-icon icon-indigo">💼</div>
          <span className="stat-card-badge badge-amber">{stats?.activeInvestments || 0} active</span>
        </div>
        <div className="stat-card-label">Total Invested</div>
        <div className="stat-card-value">₹{(stats?.totalInvestments || 0).toLocaleString('en-IN')}</div>
        <div className="stat-card-sub">Across all plans</div>
        <div className="stat-card-glow glow-indigo" />
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-card-icon icon-green">📈</div>
          <span className="stat-card-badge badge-green">Daily</span>
        </div>
        <div className="stat-card-label">Total ROI Earned</div>
        <div className="stat-card-value text-green">₹{(stats?.totalROIEarned || 0).toLocaleString('en-IN')}</div>
        <div className="stat-card-sub">Lifetime earnings</div>
        <div className="stat-card-glow glow-green" />
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-card-icon icon-amber">👥</div>
          <span className="stat-card-badge badge-amber">{directRefs?.length || 0} direct</span>
        </div>
        <div className="stat-card-label">Level Income</div>
        <div className="stat-card-value text-amber">₹{(stats?.totalLevelIncome || 0).toLocaleString('en-IN')}</div>
        <div className="stat-card-sub">From referrals</div>
        <div className="stat-card-glow glow-amber" />
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-card-icon icon-cyan">💳</div>
          <span className="stat-card-badge badge-green">Available</span>
        </div>
        <div className="stat-card-label">Wallet Balance</div>
        <div className="stat-card-value text-cyan">₹{(stats?.walletBalance || 0).toLocaleString('en-IN')}</div>
        <div className="stat-card-sub">Ready to withdraw</div>
        <div className="stat-card-glow glow-cyan" />
      </div>
    </div>

    <div className="two-col">
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">📈 ROI Earnings (last 14 days)</span>
        </div>
        <div className="panel-body">
          {chartData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📉</div>
              <p>No ROI history yet. Create an investment and process ROI.</p>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="roi" stroke="#6366f1" strokeWidth={2} fill="url(#roiGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">🔗 Your Referral Code</span>
        </div>
        <div className="panel-body">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Share your code to earn level income when your referrals invest.
          </p>
          <div className="referral-box">
            <span className="referral-code-display font-mono">{user?.referralCode}</span>
            <button className="copy-btn" onClick={copyCode}>
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>
          <div className="referral-stats">
            <div className="referral-stat-item">Level 1: <strong style={{ color: '#818cf8' }}>5%</strong></div>
            <div className="referral-stat-item">Level 2: <strong style={{ color: '#818cf8' }}>3%</strong></div>
            <div className="referral-stat-item">Level 3: <strong style={{ color: '#818cf8' }}>2%</strong></div>
            <div className="referral-stat-item">Level 4: <strong style={{ color: '#818cf8' }}>1%</strong></div>
            <div className="referral-stat-item">Level 5: <strong style={{ color: '#818cf8' }}>0.5%</strong></div>
          </div>
        </div>
      </div>
    </div>
  </>
);

/* ─── Page: Investments ──────────────────────── */
const InvestmentsPage = ({ investments, setShowModal }) => (
  <div className="panel">
    <div className="panel-header">
      <span className="panel-title">💼 Investment History</span>
      <button className="btn-action primary" onClick={() => setShowModal(true)}>+ New Investment</button>
    </div>
    <div className="table-wrapper">
      {investments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💼</div>
          <p>No investments yet. Click "New Investment" to get started.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Amount</th>
              <th>Daily ROI</th>
              <th>Duration</th>
              <th>Total ROI</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {investments.map(inv => (
              <tr key={inv._id}>
                <td style={{ fontWeight: 600 }}>{inv.plan?.name}</td>
                <td>₹{inv.amount?.toLocaleString('en-IN')}</td>
                <td className="text-green">{inv.plan?.dailyROIPercentage}%</td>
                <td>{inv.plan?.durationDays}d</td>
                <td className="text-green">₹{inv.totalROIGenerated?.toFixed(2)}</td>
                <td className="text-muted">{new Date(inv.startDate).toLocaleDateString('en-IN')}</td>
                <td className="text-muted">{new Date(inv.endDate).toLocaleDateString('en-IN')}</td>
                <td><span className={`badge badge-${inv.status?.toLowerCase()}`}>● {inv.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

/* ─── Page: ROI History ──────────────────────── */
const ROIPage = ({ roiHistory }) => (
  <div className="panel">
    <div className="panel-header">
      <span className="panel-title">📈 Daily ROI History</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{roiHistory.length} records</span>
    </div>
    <div className="table-wrapper">
      {roiHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <p>No ROI records yet. Use "Process ROI" to calculate daily earnings.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr><th>Date</th><th>Investment Plan</th><th>Investment Amount</th><th>ROI Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {roiHistory.map(r => (
              <tr key={r._id}>
                <td className="text-muted">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                <td>{r.investment?.plan?.name || '—'}</td>
                <td>₹{r.investment?.amount?.toLocaleString('en-IN') || '—'}</td>
                <td className="text-green">+₹{r.amount?.toFixed(2)}</td>
                <td><span className={`badge badge-${r.status?.toLowerCase()}`}>● {r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

/* ─── Page: Referral Income ──────────────────── */
const ReferralIncomePage = ({ levelIncome }) => (
  <div className="panel">
    <div className="panel-header">
      <span className="panel-title">💰 Level Income History</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{levelIncome.length} records</span>
    </div>
    <div className="table-wrapper">
      {levelIncome.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <p>No referral income yet. Share your referral code to earn commissions.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr><th>From</th><th>Email</th><th>Level</th><th>Commission</th><th>Amount</th><th>Date</th></tr>
          </thead>
          <tbody>
            {levelIncome.map(inc => (
              <tr key={inc._id}>
                <td style={{ fontWeight: 600 }}>{inc.generator?.fullName || 'N/A'}</td>
                <td className="text-muted">{inc.generator?.email || '—'}</td>
                <td><span className="badge badge-active">L{inc.level}</span></td>
                <td className="text-amber">{inc.percentage}%</td>
                <td className="text-green">+₹{inc.amount?.toFixed(2)}</td>
                <td className="text-muted">{new Date(inc.date).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

/* ─── Page: Tree ─────────────────────────────── */
const TreePage = ({ tree, user }) => (
  <div className="panel">
    <div className="panel-header">
      <span className="panel-title">🌲 Referral Network Tree</span>
    </div>
    <div className="panel-body">
      {/* Root node */}
      <div style={{ marginBottom: 16 }}>
        <div className="tree-node-card" style={{ border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.08)' }}>
          <div className="tree-node-avatar level-1-avatar">👑</div>
          <div>
            <div className="tree-node-name">{user?.fullName} (You)</div>
            <div className="tree-node-email">Code: {user?.referralCode}</div>
          </div>
          <span className="tree-level-badge" style={{ background: 'rgba(99,102,241,0.25)' }}>Root</span>
        </div>
      </div>
      {tree.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <p>No referrals yet. Share your code to build your network.</p>
        </div>
      ) : (
        <div className="tree-container">
          {tree.map((node, i) => <TreeNode key={i} node={node} />)}
        </div>
      )}
    </div>
  </div>
);
