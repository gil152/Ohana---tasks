import { useState, useEffect, useRef } from "react";

// ── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://puucgbonsyreprdhvxzw.supabase.co";
const SUPABASE_KEY = "sb_publishable_3y5jzpLKXJAIRSpDeuak_Q_Q4jPoZfY";

const sb = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "",
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const dbGet    = (table, query = "")       => sb(`${table}?${query}&order=created_at.asc`);
const dbInsert = (table, data)             => sb(table, { method: "POST", body: JSON.stringify(data), prefer: "return=representation" });
const dbUpdate = (table, id, data)        => sb(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data), prefer: "return=representation" });
const dbDelete = (table, id)              => sb(`${table}?id=eq.${id}`, { method: "DELETE" });

// ── EmailJS config ─────────────────────────────────────────────────────────────
const EMAILJS_CONFIG = {
  serviceId:  "YOUR_SERVICE_ID",
  templateId: "YOUR_TEMPLATE_ID",
  publicKey:  "YOUR_PUBLIC_KEY",
};

// ── Users (local — no DB needed) ──────────────────────────────────────────────
const USERS = [
  { id: 1, name: "גיל בן כליפה", role: "מנהל", avatar: "ג", email: "Gil@ohanagroup.co.il",      password: "admin2024" },
  { id: 2, name: "דודו אוחנה",   role: "עובד",  avatar: "ד", email: "David@ohanagroup.co.il",    password: "1234" },
  { id: 3, name: "שי אוחנה",     role: "עובד",  avatar: "ש", email: "Shai@ohanagroup.co.il",     password: "1234" },
  { id: 4, name: "ביררה וסאי",   role: "עובד",  avatar: "ב", email: "Birarar@ohanagroup.co.il",  password: "1234" },
  { id: 5, name: "רותם איש טוב", role: "עובד",  avatar: "ר", email: "Rotem@ohanagroup.co.il",    password: "1234" },
  { id: 6, name: "עדי אוחנה",    role: "עובד",  avatar: "ע", email: "Adio@ohanagroup.co.il",     password: "1234" },
  { id: 7, name: "נטלי ברוש",    role: "עובד",  avatar: "נ", email: "Accounts@ohanagroup.co.il", password: "1234" },
  { id: 8, name: "ילנה",         role: "עובד",  avatar: "י", email: "Office@ohanagroup.co.il",   password: "1234" },
  { id: 9, name: "שלומי לוי",    role: "עובד",  avatar: "ל", email: "Shlomo@ohanagroup.co.il",   password: "1234" },
];

const DEFAULT_PROJECTS = [
  { id: 1, name: "ז׳בוטינסקי 77",  color: "#2563eb" },
  { id: 2, name: "יעקב סלע 26-28", color: "#7c3aed" },
  { id: 3, name: "פנקס דנין",       color: "#059669" },
  { id: 4, name: "שדרות ירושלים",   color: "#ea580c" },
];

const PRIORITY = {
  urgent: { label: "דחוף", color: "#ef4444", bg: "#fef2f2" },
  high:   { label: "גבוה", color: "#f97316", bg: "#fff7ed" },
  normal: { label: "רגיל", color: "#3b82f6", bg: "#eff6ff" },
  low:    { label: "נמוך", color: "#6b7280", bg: "#f9fafb" },
};

const STATUS = {
  todo:       { label: "לביצוע", color: "#6b7280" },
  inprogress: { label: "בתהליך", color: "#f97316" },
  done:       { label: "הושלם",  color: "#10b981" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getUser    = (id) => USERS.find(u => u.id === id);
const getProject = (projects, id) => projects.find(p => p.id === id) || { name: "כללי", color: "#6b7280" };

async function sendEmail({ toUser, subject, message, taskTitle, actorName }) {
  if (EMAILJS_CONFIG.publicKey === "YOUR_PUBLIC_KEY") return { simulated: true };
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.serviceId, template_id: EMAILJS_CONFIG.templateId,
        user_id: EMAILJS_CONFIG.publicKey,
        template_params: { to_name: toUser.name, to_email: toUser.email, subject, message, task_title: taskTitle, actor_name: actorName },
      }),
    });
    return { ok: res.ok };
  } catch { return { error: true }; }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const sel = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, color: "#374151", background: "#fafafa", outline: "none", direction: "rtl" };

// ── Small components ──────────────────────────────────────────────────────────
const Avatar = ({ user, size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#1e40af,#3b82f6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 700, flexShrink: 0 }}>
    {user?.avatar || "?"}
  </div>
);

const Badge = ({ priority }) => {
  const p = PRIORITY[priority] || PRIORITY.normal;
  return <span style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}33`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{p.label}</span>;
};

const StatusDot = ({ status }) => {
  const s = STATUS[status] || STATUS.todo;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: s.color, fontSize: 12, fontWeight: 600 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} />{s.label}</span>;
};

const ProjectTag = ({ projects, projectId }) => {
  const p = getProject(projects, projectId);
  return <span style={{ background: (p.color || "#6b7280") + "18", color: p.color || "#6b7280", border: `1px solid ${p.color || "#6b7280"}33`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{p.name}</span>;
};

const Field = ({ label, children }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</div>
    {children}
  </div>
);

const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, flexDirection: "column", gap: 16 }}>
    <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTop: "3px solid #1e40af", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <div style={{ color: "#6b7280", fontSize: 14 }}>טוען נתונים...</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── DB Setup — create tables if missing ───────────────────────────────────────
// Tables needed in Supabase (SQL to run once):
// CREATE TABLE projects (id SERIAL PRIMARY KEY, name TEXT, color TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
// CREATE TABLE tasks (id SERIAL PRIMARY KEY, title TEXT, project_id INT, assignee_id INT, priority TEXT, status TEXT, due DATE, created_at TIMESTAMPTZ DEFAULT NOW());
// CREATE TABLE comments (id SERIAL PRIMARY KEY, task_id INT, user_id INT, text TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
// CREATE TABLE notifications (id SERIAL PRIMARY KEY, user_id INT, icon TEXT, text TEXT, read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());

// ── Login ─────────────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = () => {
    setLoading(true); setError("");
    setTimeout(() => {
      const user = USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
      if (user) onLogin(user);
      else { setError("כתובת מייל או סיסמה שגויים"); setLoading(false); }
    }, 400);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#0f172a 100%)", display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl", fontFamily: "'Segoe UI',Arial,sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {[...Array(5)].map((_, i) => <div key={i} style={{ position: "absolute", width: 80 + i * 50, height: 80 + i * 50, borderRadius: "50%", border: "1px solid rgba(59,130,246,.1)", top: `${8 + i * 14}%`, left: `${4 + i * 16}%` }} />)}
      </div>
      <div style={{ position: "relative", width: "100%", maxWidth: 420, padding: 16 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 6 }}>🏗</div>
          <div style={{ color: "#fff", fontSize: 26, fontWeight: 800 }}>Ohana Group</div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>מערכת ניהול משימות</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 20, padding: 30, boxShadow: "0 24px 64px rgba(0,0,0,.35)" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>כניסה למערכת</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 22 }}>הכנס את פרטי הכניסה שלך</div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>כתובת מייל</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="name@ohanagroup.co.il" style={{ ...sel, padding: "11px 14px", fontSize: 14, borderRadius: 10 }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>סיסמה</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••" style={{ ...sel, padding: "11px 14px", fontSize: 14, borderRadius: 10 }} />
          </div>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "9px 13px", color: "#dc2626", fontSize: 13, marginBottom: 10 }}>⚠ {error}</div>}
          <button onClick={handleLogin} disabled={loading || !email || !password} style={{ width: "100%", background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>
            {loading ? "מתחבר..." : "כניסה"}
          </button>
          <div style={{ marginTop: 18, padding: 12, background: "#f8fafc", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>👤 כניסה מהירה</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {USERS.map(u => (
                <button key={u.id} onClick={() => { setEmail(u.email); setPassword(u.password); }} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 6, padding: "5px 8px", cursor: "pointer", textAlign: "right", fontSize: 11 }}>
                  <span style={{ fontWeight: 600, color: u.id === 1 ? "#1e40af" : "#374151" }}>{u.name}</span>
                  {u.id === 1 && <span style={{ color: "#1e40af", fontSize: 10 }}> ⭐</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── DB Setup Screen ───────────────────────────────────────────────────────────
const SetupScreen = ({ onSetupDone }) => {
  const [step, setStep]   = useState("idle"); // idle | running | done | error
  const [log, setLog]     = useState([]);
  const addLog = (msg, ok = true) => setLog(prev => [...prev, { msg, ok }]);

  const runSetup = async () => {
    setStep("running"); setLog([]);
    try {
      // Try to insert default projects if table is empty
      addLog("בודק טבלת פרויקטים...");
      let existing = [];
      try { existing = await dbGet("projects", "select=id"); } catch { existing = []; }

      if (!existing || existing.length === 0) {
        addLog("יוצר פרויקטים ראשוניים...");
        for (const p of DEFAULT_PROJECTS) {
          await dbInsert("projects", { name: p.name, color: p.color });
        }
        addLog("פרויקטים נוצרו ✓");
      } else {
        addLog("פרויקטים קיימים ✓");
      }
      addLog("החיבור ל-Supabase תקין ✓");
      setStep("done");
      setTimeout(onSetupDone, 1000);
    } catch (e) {
      addLog(`שגיאה: ${e.message}`, false);
      setStep("error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl", fontFamily: "'Segoe UI',Arial,sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 36, maxWidth: 500, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,.1)" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗄️</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>הגדרת מסד נתונים</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>
          לפני הכניסה יש צורך ליצור את הטבלאות ב-Supabase.<br />
          <strong>פתח את Supabase → SQL Editor</strong> והרץ את הקוד הבא פעם אחת:
        </div>
        <pre style={{ background: "#1e293b", color: "#e2e8f0", borderRadius: 10, padding: 16, fontSize: 11, overflowX: "auto", marginBottom: 20, lineHeight: 1.6, direction: "ltr", textAlign: "left" }}>{`CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  project_id INT,
  assignee_id INT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'todo',
  due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INT,
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT,
  icon TEXT,
  text TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}</pre>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>אחרי שהרצת את ה-SQL, לחץ "בדוק וחבר":</div>
        {log.length > 0 && (
          <div style={{ background: "#f9fafb", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12 }}>
            {log.map((l, i) => <div key={i} style={{ color: l.ok ? "#166534" : "#dc2626", padding: "2px 0" }}>{l.ok ? "✓" : "✗"} {l.msg}</div>)}
          </div>
        )}
        <button onClick={runSetup} disabled={step === "running"} style={{ background: step === "done" ? "#10b981" : "#1e40af", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          {step === "idle" && "בדוק וחבר →"}
          {step === "running" && "בודק..."}
          {step === "done" && "✓ מוכן! טוען..."}
          {step === "error" && "נסה שוב"}
        </button>
      </div>
    </div>
  );
};

// ── Notification Panel ────────────────────────────────────────────────────────
const NotificationPanel = ({ notifications, onMarkAll }) => (
  <div style={{ position: "absolute", top: 52, left: 0, width: 320, background: "#fff", borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,.18)", zIndex: 200, border: "1px solid #e5e7eb", direction: "rtl", overflow: "hidden" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{ fontWeight: 700, fontSize: 14 }}>התראות</span>
      <button onClick={onMarkAll} style={{ background: "none", border: "none", fontSize: 12, color: "#3b82f6", cursor: "pointer", fontWeight: 600 }}>סמן הכל כנקרא</button>
    </div>
    <div style={{ maxHeight: 340, overflowY: "auto" }}>
      {notifications.length === 0
        ? <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>אין התראות 🎉</div>
        : notifications.map(n => (
          <div key={n.id} style={{ padding: "11px 16px", borderBottom: "1px solid #f9fafb", background: n.read ? "#fff" : "#eff6ff", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 17, flexShrink: 0 }}>{n.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#111827", fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>{n.text}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{new Date(n.created_at).toLocaleString("he-IL")}</div>
            </div>
            {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))
      }
    </div>
  </div>
);

// ── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task, projects, onOpen }) => {
  const assignee  = getUser(task.assignee_id);
  const isOverdue = task.status !== "done" && task.due && new Date(task.due) < new Date();
  return (
    <div onClick={() => onOpen(task)} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "box-shadow .15s,transform .15s", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.06)";  e.currentTarget.style.transform = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#111827", lineHeight: 1.4, flex: 1 }}>{task.title}</span>
        <Badge priority={task.priority} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        <ProjectTag projects={projects} projectId={task.project_id} />
        <StatusDot status={task.status} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Avatar user={assignee} size={24} />
          <span style={{ fontSize: 12, color: "#6b7280" }}>{assignee?.name || "לא שויך"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {(task.comments?.length > 0) && <span style={{ fontSize: 12, color: "#9ca3af" }}>💬 {task.comments.length}</span>}
          {task.due && <span style={{ fontSize: 11, color: isOverdue ? "#ef4444" : "#9ca3af", fontWeight: isOverdue ? 700 : 400 }}>{isOverdue ? "⚠ " : ""}{new Date(task.due).toLocaleDateString("he-IL")}</span>}
        </div>
      </div>
    </div>
  );
};

// ── Task Modal ────────────────────────────────────────────────────────────────
const TaskModal = ({ task, projects, onClose, onSave, onDelete, currentUser, onNotify }) => {
  const [t, setT]             = useState({ ...task });
  const [comments, setComments] = useState(task.comments || []);
  const [comment, setComment]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [confirmDel, setConfirmDel]   = useState(false);

  const addComment = async () => {
    if (!comment.trim()) return;
    setSaving(true);
    try {
      const [saved] = await dbInsert("comments", { task_id: task.id, user_id: currentUser.id, text: comment });
      setComments(prev => [...prev, saved]);
      setComment("");
      const assignee = getUser(t.assignee_id);
      if (assignee && assignee.id !== currentUser.id) {
        const notif = { user_id: assignee.id, icon: "💬", text: `${currentUser.name} הגיב על המשימה שלך: "${t.title}"`, read: false };
        const [savedNotif] = await dbInsert("notifications", notif);
        onNotify(savedNotif);
        setEmailStatus("sending");
        const r = await sendEmail({ toUser: assignee, subject: `תגובה חדשה: ${t.title}`, message: `${currentUser.name} הגיב:\n"${comment}"`, taskTitle: t.title, actorName: currentUser.name });
        setEmailStatus(r.simulated ? "simulated" : "sent");
      }
    } finally { setSaving(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dbUpdate("tasks", t.id, { title: t.title, project_id: t.project_id, assignee_id: t.assignee_id, priority: t.priority, status: t.status, due: t.due || null });
      onSave({ ...t, comments });
      onClose();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await dbDelete("tasks", t.id);
    onDelete(t.id);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: 28, direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <input value={t.title} onChange={e => setT(p => ({ ...p, title: e.target.value }))} style={{ fontSize: 18, fontWeight: 700, border: "none", outline: "none", flex: 1, color: "#111827", background: "transparent" }} />
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <Field label="פרויקט">
            <select value={t.project_id ?? ""} onChange={e => setT(p => ({ ...p, project_id: e.target.value ? +e.target.value : null }))} style={sel}>
              <option value="">כללי</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="אחראי">
            <select value={t.assignee_id ?? ""} onChange={e => setT(p => ({ ...p, assignee_id: e.target.value ? +e.target.value : null }))} style={sel}>
              <option value="">לא שויך</option>
              {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="עדיפות">
            <select value={t.priority} onChange={e => setT(p => ({ ...p, priority: e.target.value }))} style={sel}>
              {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="סטטוס">
            <select value={t.status} onChange={e => setT(p => ({ ...p, status: e.target.value }))} style={sel}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="תאריך יעד">
            <input type="date" value={t.due || ""} onChange={e => setT(p => ({ ...p, due: e.target.value }))} style={sel} />
          </Field>
        </div>
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 12 }}>תגובות</div>
          {comments.map((c) => {
            const u = getUser(c.user_id);
            return (
              <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <Avatar user={u} size={28} />
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "8px 12px", flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 2 }}>{u?.name}</div>
                  <div style={{ fontSize: 13, color: "#4b5563" }}>{c.text}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{new Date(c.created_at).toLocaleString("he-IL")}</div>
                </div>
              </div>
            );
          })}
          {emailStatus && (
            <div style={{ background: emailStatus === "simulated" ? "#fffbeb" : "#f0fdf4", border: `1px solid ${emailStatus === "simulated" ? "#fde68a" : "#bbf7d0"}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: emailStatus === "simulated" ? "#92400e" : "#166534", marginBottom: 10 }}>
              {emailStatus === "sending" && "📤 שולח מייל..."}{emailStatus === "sent" && "✅ מייל נשלח"}{emailStatus === "simulated" && "⚠ EmailJS לא מוגדר"}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === "Enter" && !saving && addComment()} placeholder="הוסף תגובה..." style={{ ...sel, flex: 1, borderRadius: 10 }} />
            <button onClick={addComment} disabled={saving || !comment.trim()} style={{ background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>שלח</button>
          </div>
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{ background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>{saving ? "שומר..." : "שמור"}</button>
            <button onClick={onClose} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontSize: 14 }}>ביטול</button>
          </div>
          {currentUser.id === 1 && (
            confirmDel
              ? <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#ef4444" }}>למחוק?</span>
                  <button onClick={handleDelete} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>כן</button>
                  <button onClick={() => setConfirmDel(false)} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>לא</button>
                </div>
              : <button onClick={() => setConfirmDel(true)} style={{ background: "none", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>🗑 מחק</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── New Task Modal ─────────────────────────────────────────────────────────────
const NewTaskModal = ({ projects, onClose, onAdd, currentUser, onNotify }) => {
  const [t, setT]             = useState({ title: "", project_id: null, assignee_id: currentUser.id, priority: "normal", status: "todo", due: "" });
  const [saving, setSaving]   = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  const handleAdd = async () => {
    if (!t.title.trim() || saving) return;
    setSaving(true);
    try {
      const [saved] = await dbInsert("tasks", { title: t.title, project_id: t.project_id || null, assignee_id: t.assignee_id || null, priority: t.priority, status: t.status, due: t.due || null });
      onAdd({ ...saved, comments: [] });
      const assignee = getUser(t.assignee_id);
      if (assignee && assignee.id !== currentUser.id) {
        const notif = { user_id: assignee.id, icon: "📋", text: `${currentUser.name} הקצה לך משימה: "${t.title}"`, read: false };
        const [savedNotif] = await dbInsert("notifications", notif);
        onNotify(savedNotif);
        setEmailStatus("sending");
        const r = await sendEmail({ toUser: assignee, subject: `משימה חדשה: ${t.title}`, message: `${currentUser.name} הקצה לך:\n📌 ${t.title}\nעדיפות: ${PRIORITY[t.priority].label}\nתאריך יעד: ${t.due || "לא נקבע"}`, taskTitle: t.title, actorName: currentUser.name });
        setEmailStatus(r.simulated ? "simulated" : "sent");
        setTimeout(onClose, 1000);
      } else onClose();
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, padding: 28, direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>משימה חדשה</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>×</button>
        </div>
        <input value={t.title} onChange={e => setT(p => ({ ...p, title: e.target.value }))} placeholder="כותרת המשימה..." style={{ ...sel, fontSize: 15, fontWeight: 600, padding: "10px 12px", marginBottom: 14 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <Field label="פרויקט">
            <select value={t.project_id ?? ""} onChange={e => setT(p => ({ ...p, project_id: e.target.value ? +e.target.value : null }))} style={sel}>
              <option value="">כללי</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="אחראי">
            <select value={t.assignee_id ?? ""} onChange={e => setT(p => ({ ...p, assignee_id: e.target.value ? +e.target.value : null }))} style={sel}>
              <option value="">לא שויך</option>
              {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="עדיפות">
            <select value={t.priority} onChange={e => setT(p => ({ ...p, priority: e.target.value }))} style={sel}>
              {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="תאריך יעד">
            <input type="date" value={t.due} onChange={e => setT(p => ({ ...p, due: e.target.value }))} style={sel} />
          </Field>
        </div>
        {emailStatus && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400e", marginBottom: 12 }}>
            {emailStatus === "sending" && "📤 שולח מייל..."}{emailStatus === "sent" && "✅ נשלח!"}{emailStatus === "simulated" && "⚠ EmailJS לא מוגדר"}
          </div>
        )}
        <button onClick={handleAdd} disabled={!t.title.trim() || saving} style={{ background: t.title.trim() ? "#1e40af" : "#e5e7eb", color: t.title.trim() ? "#fff" : "#9ca3af", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
          {saving ? "שומר..." : "הוסף משימה"}
        </button>
      </div>
    </div>
  );
};

// ── Add Project Modal ─────────────────────────────────────────────────────────
const COLORS = ["#2563eb","#7c3aed","#059669","#ea580c","#dc2626","#db2777","#0891b2","#65a30d"];
const AddProjectModal = ({ onClose, onAdd }) => {
  const [name, setName]   = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const handleAdd = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const [saved] = await dbInsert("projects", { name: name.trim(), color });
      onAdd(saved);
      onClose();
    } finally { setSaving(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 380, padding: 28, direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>פרויקט חדש</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>×</button>
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="שם הפרויקט..." style={{ ...sel, fontSize: 14, padding: "10px 12px", marginBottom: 16 }} />
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 8 }}>צבע</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLORS.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: color === c ? "3px solid #111" : "2px solid transparent", cursor: "pointer" }} />)}
          </div>
        </div>
        <button onClick={handleAdd} disabled={!name.trim() || saving} style={{ background: name.trim() ? color : "#e5e7eb", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
          {saving ? "שומר..." : "הוסף פרויקט"}
        </button>
      </div>
    </div>
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]   = useState("login"); // login | setup | app
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks,    setTasks]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [myNotifs, setMyNotifs] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [view,     setView]     = useState("project");
  const [openTask, setOpenTask] = useState(null);
  const [showNew,  setShowNew]  = useState(false);
  const [showAddProj, setShowAddProj] = useState(false);
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterProject,  setFilterProject]  = useState("all");
  const [search,   setSearch]   = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const fn = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const loadData = async (user) => {
    setLoading(true);
    try {
      const [projs, rawTasks, rawComments, notifs] = await Promise.all([
        dbGet("projects", "select=*"),
        dbGet("tasks",    "select=*"),
        dbGet("comments", "select=*"),
        dbGet("notifications", `select=*&user_id=eq.${user.id}&order=created_at.desc`),
      ]);
      // attach comments to tasks
      const tasksWithComments = (rawTasks || []).map(t => ({
        ...t,
        comments: (rawComments || []).filter(c => c.task_id === t.id),
      }));
      setProjects(projs || []);
      setTasks(tasksWithComments);
      setMyNotifs(notifs || []);
      setScreen("app");
    } catch (e) {
      // Tables likely don't exist yet
      setScreen("setup");
    } finally { setLoading(false); }
  };

  const handleLogin = (user) => { setCurrentUser(user); loadData(user); };
  const handleSetupDone = () => loadData(currentUser);

  const onNotify = (notif) => {
    if (notif.user_id === currentUser.id) setMyNotifs(prev => [notif, ...prev]);
  };

  const markAllRead = async () => {
    const unread = myNotifs.filter(n => !n.read);
    for (const n of unread) await dbUpdate("notifications", n.id, { read: true });
    setMyNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const saveTask   = updated => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  const addTask    = t       => setTasks(prev => [...prev, t]);
  const deleteTask = id      => setTasks(prev => prev.filter(t => t.id !== id));
  const addProject = p       => setProjects(prev => [...prev, p]);

  const filtered = tasks.filter(t =>
    (filterStatus   === "all" || t.status     === filterStatus) &&
    (filterPriority === "all" || t.priority   === filterPriority) &&
    (filterProject  === "all" || String(t.project_id) === filterProject) &&
    (search === "" || t.title.includes(search))
  );

  const byProject  = [...projects, { id: null, name: "כללי", color: "#6b7280" }]
    .map(p => ({ ...p, tasks: filtered.filter(t => t.project_id === p.id) }))
    .filter(g => g.tasks.length > 0);
  const byAssignee = USERS
    .map(u => ({ ...u, tasks: filtered.filter(t => t.assignee_id === u.id) }))
    .filter(g => g.tasks.length > 0);
  const groups = view === "project" ? byProject : byAssignee;

  const stats = {
    total:   tasks.length,
    done:    tasks.filter(t => t.status === "done").length,
    urgent:  tasks.filter(t => t.priority === "urgent" && t.status !== "done").length,
    overdue: tasks.filter(t => t.status !== "done" && t.due && new Date(t.due) < new Date()).length,
  };

  const unreadCnt = myNotifs.filter(n => !n.read).length;

  if (screen === "login") return <LoginScreen onLogin={handleLogin} />;
  if (screen === "setup") return <SetupScreen onSetupDone={handleSetupDone} />;
  if (loading) return <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", direction: "rtl", fontFamily: "'Segoe UI',Arial,sans-serif" }}>
      {/* Topbar */}
      <div style={{ background: "#0f172a", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, boxShadow: "0 2px 8px rgba(0,0,0,.2)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏗</span>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>Ohana Group</span>
          <span style={{ color: "#475569", fontSize: 12 }}>ניהול משימות</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div ref={notifRef} style={{ position: "relative" }}>
            <button onClick={() => setShowNotifs(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 4 }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              {unreadCnt > 0 && <span style={{ position: "absolute", top: 0, left: 0, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 17, height: 17, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCnt}</span>}
            </button>
            {showNotifs && <NotificationPanel notifications={myNotifs} onMarkAll={markAllRead} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar user={currentUser} size={30} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{currentUser.name}</div>
              <div style={{ color: "#64748b", fontSize: 11 }}>{currentUser.role}</div>
            </div>
          </div>
          <button onClick={() => { setCurrentUser(null); setScreen("login"); setTasks([]); setProjects([]); }} style={{ background: "#1e293b", color: "#94a3b8", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>יציאה</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "סה״כ משימות", value: stats.total,   color: "#1e40af", icon: "📋" },
            { label: "הושלמו",      value: stats.done,    color: "#10b981", icon: "✅" },
            { label: "דחופות",      value: stats.urgent,  color: "#ef4444", icon: "🔴" },
            { label: "באיחור",      value: stats.overdue, color: "#f97316", icon: "⚠️" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.06)", borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 3, gap: 2 }}>
            {[{ k: "project", l: "לפי פרויקט" }, { k: "assignee", l: "לפי אחראי" }].map(v => (
              <button key={v.k} onClick={() => setView(v.k)} style={{ background: view === v.k ? "#fff" : "transparent", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: view === v.k ? 700 : 500, color: view === v.k ? "#1e40af" : "#6b7280", cursor: "pointer", boxShadow: view === v.k ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: "all .15s" }}>{v.l}</button>
            ))}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 חיפוש..." style={{ ...sel, width: 150, flex: "1 1 120px" }} />
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ ...sel, width: "auto" }}>
            <option value="all">כל הפרויקטים</option>
            {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
            <option value="null">כללי</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...sel, width: "auto" }}>
            <option value="all">כל הסטטוסים</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ ...sel, width: "auto" }}>
            <option value="all">כל העדיפויות</option>
            {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div style={{ marginRight: "auto", display: "flex", gap: 8 }}>
            {currentUser.id === 1 && <button onClick={() => setShowAddProj(true)} style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ פרויקט</button>}
            <button onClick={() => setShowNew(true)} style={{ background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>+ משימה חדשה</button>
          </div>
        </div>

        {/* Groups */}
        {groups.map(g => (
          <div key={g.id ?? "general"} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              {view === "project" ? <span style={{ width: 12, height: 12, borderRadius: 3, background: g.color, display: "inline-block" }} /> : <Avatar user={g} size={26} />}
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{g.name}</span>
              <span style={{ background: "#e5e7eb", color: "#374151", borderRadius: 20, padding: "1px 10px", fontSize: 12, fontWeight: 600 }}>{g.tasks.length}</span>
              {view === "project" && <span style={{ fontSize: 12, color: "#6b7280" }}>{g.tasks.filter(t => t.status === "done").length}/{g.tasks.length} הושלמו</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
              {g.tasks.map(t => <TaskCard key={t.id} task={t} projects={projects} onOpen={setOpenTask} />)}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{tasks.length === 0 ? "אין משימות עדיין — התחל בלחיצה על + משימה חדשה" : "אין משימות תואמות לסינון"}</div>
          </div>
        )}
      </div>

      {openTask    && <TaskModal task={openTask} projects={projects} onClose={() => setOpenTask(null)} onSave={saveTask} onDelete={deleteTask} currentUser={currentUser} onNotify={onNotify} />}
      {showNew     && <NewTaskModal projects={projects} onClose={() => setShowNew(false)} onAdd={addTask} currentUser={currentUser} onNotify={onNotify} />}
      {showAddProj && <AddProjectModal onClose={() => setShowAddProj(false)} onAdd={addProject} />}
    </div>
  );
}
