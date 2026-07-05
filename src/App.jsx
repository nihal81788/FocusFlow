import React, { useState, useEffect, useRef, useCallback } from 'react';

const MODES = { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
const CYCLE = ['work', 'shortBreak', 'longBreak'];
const LABELS = { work: 'Work Session', shortBreak: 'Short Break', longBreak: 'Long Break' };

const parseMD = (str) => ({
  __html: str
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
});

export default function App() {
  const [mode, setMode] = useState('work');
  const [time, setTime] = useState(MODES.work);
  const [running, setRunning] = useState(false);
  const endRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  const update = useCallback(() => {
    if (!running || !endRef.current) return;
    const rem = endRef.current - Date.now();
    if (rem <= 0) {
      setTime(0); setRunning(false); endRef.current = null;
    } else {
      setTime(Math.ceil(rem / 1000));
    }
  }, [running]);

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

  const toggle = () => {
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
    setRunning(false); endRef.current = null; setMode(next); setTime(MODES[next]);
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
    <div style={{ minHeight: '100vh', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', fontFamily: 'sans-serif', padding: '2rem', boxSizing: 'border-box' }}>
      
      <div style={{ flex: '1 1 300px', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h1 style={{ color: '#fff', textAlign: 'center', margin: 0 }}>FLOWSTATE</h1>
        <div style={{ textAlign: 'center', padding: '2rem', background: '#333', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#aaa', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{LABELS[mode]}</h2>
          <div style={{ fontSize: '5rem', margin: '1rem 0', fontWeight: 'bold', fontFamily: 'monospace', color: '#fff' }}>
            {Math.floor(time / 60).toString().padStart(2, '0')}:{(time % 60).toString().padStart(2, '0')}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button onClick={toggle} style={btnStyle}>{running ? 'Pause' : 'Start'}</button>
            <button onClick={() => { setRunning(false); endRef.current = null; setTime(MODES[mode]); }} style={btnStyle}>Reset</button>
            <button onClick={skip} style={btnStyle}>Skip</button>
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 300px', maxWidth: '500px', padding: '2rem', background: '#333', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Daily Tasks</h2>
          <span style={{ background: '#555', padding: '4px 10px', borderRadius: '20px', fontSize: '0.9rem' }}>
            {comp} / {tasks.length} Done
          </span>
        </div>
        
        <form onSubmit={addTask} style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
          <input 
            value={newTask} 
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add task (use **bold**, *italic*, - list)" 
            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', outline: 'none', fontFamily: 'inherit' }} 
          />
          <button type="submit" style={{...btnStyle, background: '#aa3bff'}}>Add</button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
          {tasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#444', padding: '10px', borderRadius: '6px' }}>
              <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} style={{ transform: 'scale(1.2)', cursor: 'pointer', flexShrink: 0 }} />
              
              <div style={{ flex: 1, opacity: t.completed ? 0.5 : 1, textDecoration: t.completed ? 'line-through' : 'none', wordBreak: 'break-word', lineHeight: '1.4' }}>
                {t.isEditing ? (
                  <input 
                    value={t.text} 
                    onChange={(e) => updateTaskText(t.id, e.target.value)}
                    onBlur={() => toggleEdit(t.id)}
                    onKeyDown={(e) => e.key === 'Enter' && toggleEdit(t.id)}
                    autoFocus
                    style={{ width: '100%', padding: '4px', background: '#222', border: '1px solid #555', color: '#fff', boxSizing: 'border-box' }} 
                  />
                ) : (
                  <span dangerouslySetInnerHTML={parseMD(t.text)} onDoubleClick={() => toggleEdit(t.id)} style={{ cursor: 'pointer', display: 'block', margin: 0 }} title="Double-click to edit" />
                )}
              </div>
              
              <button onClick={() => deleteTask(t.id)} style={{ background: 'transparent', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: '1.2rem', flexShrink: 0, padding: '0 5px' }}>×</button>
            </div>
          ))}
          {tasks.length === 0 && <div style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', padding: '1rem' }}>No tasks yet. You ain't gonna need it?</div>}
        </div>
      </div>
    </div>
  );
}

const btnStyle = { padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', border: 'none', borderRadius: '6px', background: '#555', color: 'white', fontWeight: '600' };
