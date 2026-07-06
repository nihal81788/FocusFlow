import React, { useState, useEffect, useRef, useCallback } from 'react';
import logo from '/logo.png';

const DEFAULT_MODES = { work: 25, shortBreak: 5, longBreak: 15 };
const CYCLE = ['work', 'shortBreak', 'longBreak'];
const LABELS = { work: 'Work Session', shortBreak: 'Short Break', longBreak: 'Long Break' };

const renderMD = (str) => {
  if (str.startsWith('- ')) return <li>{renderMD(str.slice(2))}</li>;
  return str.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <b key={i}>{part.slice(2, -2)}</b>;
    if (part.startsWith('*') && part.endsWith('*')) return <i key={i}>{part.slice(1, -1)}</i>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

export default function App() {
  const [modes, setModes] = useState(() => {
    const saved = localStorage.getItem('modes');
    if (!saved) return DEFAULT_MODES;
    const parsed = JSON.parse(saved);
    return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, Number(v)]));
  });
  const [mode, setMode] = useState('work');
  const [time, setTime] = useState(modes.work * 60);
  const [running, setRunning] = useState(false);
  const endRef = useRef(null);

  const [showSettings, setShowSettings] = useState(false);

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('streak')) || 0);
  const streakRef = useRef(streak);
  const [permError, setPermError] = useState('');

  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  const [tasks, setTasks] = useState(() => {
    const todayStr = new Date().toDateString();
    const lastOpened = localStorage.getItem('lastOpenedDate');
    if (lastOpened !== todayStr) {
      localStorage.setItem('lastOpenedDate', todayStr);
      return [];
    }
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('modes', JSON.stringify(modes));
  }, [modes]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const update = useCallback(() => {
    if (!running || !endRef.current) return;
    const rem = endRef.current - Date.now();

    if (rem <= 0) {
      setTime(0); setRunning(false); endRef.current = null;

      if (mode === 'work') {
        const todayStr = new Date().toDateString();
        const lastWork = localStorage.getItem('lastWorkDate');
        if (lastWork !== todayStr) {
          const yesterday = new Date();
          yesterday.setHours(0, 0, 0, 0);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toDateString();
          let newStreak = 1;
          if (lastWork === yesterdayStr) newStreak = streakRef.current + 1;
          setStreak(newStreak);
          localStorage.setItem('streak', newStreak);
          localStorage.setItem('lastWorkDate', todayStr);
        }
      }

      const msg = `${LABELS[mode]} Complete! Time to start your next session.`;

      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification("FocusFlow", { body: msg, icon: '/logo.png', requireInteraction: true });
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then(p => p === 'granted' && new Notification("FocusFlow", { body: msg, icon: '/logo.png', requireInteraction: true }));
        } else {
          alert(msg);
        }
      } else {
        alert(msg);
      }
    } else {
      setTime(Math.ceil(rem / 1000));
    }
  }, [running, mode]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(update, 200);
    return () => clearInterval(id);
  }, [running, update]);

  useEffect(() => {
    const onVis = () => document.visibilityState === 'visible' && update();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [update]);

  const toggle = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const p = await Notification.requestPermission();
      if (p === 'denied') {
        setPermError('Notifications denied. Timer will not start.');
        return;
      }
    }
    setPermError('');
    if (running) {
      setRunning(false);
      if (endRef.current) setTime(Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000)));
      endRef.current = null;
    } else if (time > 0) {
      endRef.current = Date.now() + time * 1000;
      setRunning(true);
    }
  };

  const skip = () => {
    const next = CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length];
    setRunning(false); endRef.current = null; setMode(next); setTime(modes[next] * 60);
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTask, completed: false, isEditing: false }]);
    setNewTask('');
  };

  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  const toggleEdit = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, isEditing: !t.isEditing } : t));
  const updateTaskText = (id, text) => setTasks(tasks.map(t => t.id === id ? { ...t, text } : t));

  const comp = tasks.filter(t => t.completed).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: 'sans-serif', padding: '2rem', boxSizing: 'border-box' }}>

      <button onClick={() => setIsDark(!isDark)} style={{ position: 'absolute', top: '20px', right: '20px', padding: '10px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1.2rem', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Toggle Theme">
        {isDark ? '☀️' : '🌙'}
      </button>

      <div style={{ flex: '1 1 300px', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="FocusFlow Logo" style={{ width: '40px', height: '40px', filter: isDark ? 'invert(1)' : 'none' }} />
          <h1 style={{ color: 'var(--text-main)', textAlign: 'center', margin: 0 }}>FocusFlow</h1>
        </div>
        <div style={{ textAlign: 'center', color: '#ff9800', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '-1rem' }}>
          🔥 {streak} Day Streak
        </div>

        <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{LABELS[mode]}</h2>
            <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', filter: isDark ? 'invert(1)' : 'none' }}>⚙️</button>
          </div>

          {showSettings && (
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1rem', background: 'var(--bg-input)', padding: '10px', borderRadius: '8px' }}>
              <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column' }}>Work
                <input type="number" min="1" value={modes.work} onChange={e => {
                  const val = Number(e.target.value);
                  setModes({ ...modes, work: val });
                  if (!running && mode === 'work' && time > 0) setTime(val * 60);
                }} style={{ width: '40px', padding: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
              </label>
              <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column' }}>Short
                <input type="number" min="1" value={modes.shortBreak} onChange={e => {
                  const val = Number(e.target.value);
                  setModes({ ...modes, shortBreak: val });
                  if (!running && mode === 'shortBreak' && time > 0) setTime(val * 60);
                }} style={{ width: '40px', padding: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
              </label>
              <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column' }}>Long
                <input type="number" min="1" value={modes.longBreak} onChange={e => {
                  const val = Number(e.target.value);
                  setModes({ ...modes, longBreak: val });
                  if (!running && mode === 'longBreak' && time > 0) setTime(val * 60);
                }} style={{ width: '40px', padding: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
              </label>
            </div>
          )}

          <div style={{ fontSize: '5rem', margin: '1rem 0', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--text-main)' }}>
            {Math.floor(time / 60).toString().padStart(2, '0')}:{(time % 60).toString().padStart(2, '0')}
          </div>
          {permError && <div style={{ color: '#ff5555', fontSize: '0.9rem', marginBottom: '1rem' }}>{permError}</div>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button onClick={toggle} style={btnStyle}>{running ? 'Pause' : 'Start'}</button>
            <button onClick={() => { setRunning(false); endRef.current = null; setTime(modes[mode] * 60); }} style={btnStyle}>Reset</button>
            <button onClick={skip} style={btnStyle}>Skip</button>
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 300px', maxWidth: '500px', padding: '2rem', background: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', color: 'var(--text-main)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Daily Tasks</h2>
          <span style={{ background: 'var(--bg-button)', color: 'var(--btn-text)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.9rem' }}>
            {comp} / {tasks.length} Done
          </span>
        </div>

        <form onSubmit={addTask} style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add task (use **bold**, *italic*, - list)"
            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', fontFamily: 'inherit', background: 'var(--bg-input)', color: 'var(--text-main)' }}
          />
          <button type="submit" style={{ ...btnStyle, background: '#aa3bff', color: '#fff', border: 'none' }}>Add</button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
          {tasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-input)', padding: '10px', borderRadius: '6px' }}>
              <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} style={{ transform: 'scale(1.2)', cursor: 'pointer', flexShrink: 0 }} />

              <div style={{ flex: 1, opacity: t.completed ? 0.5 : 1, textDecoration: t.completed ? 'line-through' : 'none', wordBreak: 'break-word', lineHeight: '1.4' }}>
                {t.isEditing ? (
                  <input
                    value={t.text}
                    onChange={(e) => updateTaskText(t.id, e.target.value)}
                    onBlur={() => toggleEdit(t.id)}
                    onKeyDown={(e) => e.key === 'Enter' && toggleEdit(t.id)}
                    autoFocus
                    style={{ width: '100%', padding: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                  />
                ) : (
                  <span onDoubleClick={() => toggleEdit(t.id)} style={{ cursor: 'pointer', display: 'block', margin: 0 }} title="Double-click to edit">{renderMD(t.text)}</span>
                )}
              </div>

              <button onClick={() => deleteTask(t.id)} style={{ background: 'transparent', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: '1.2rem', flexShrink: 0, padding: '0 5px' }}>×</button>
            </div>
          ))}
          {tasks.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>No tasks yet. You ain't gonna need it?</div>}
        </div>
      </div>
    </div>
  );
}

const btnStyle = { padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-button)', color: 'var(--btn-text)', fontWeight: '600', transition: 'filter 0.2s' };
