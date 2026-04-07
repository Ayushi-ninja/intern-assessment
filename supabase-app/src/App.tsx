import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import type { Task } from './types'

function App() {
  const [user, setUser] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')
  const [taskLoading, setTaskLoading] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }
    getUser()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => { listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (user) fetchTasks()
    else setTasks([])
  }, [user])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setTasks([])
  }

  // 🔹 Fetch tasks — tries Edge Function first, falls back to direct query
  const fetchTasks = async () => {
    setTaskLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('getTasks')
      if (error) throw error
      if (Array.isArray(data) && data.length >= 0) {
        setTasks(data)
        return
      }
      throw new Error('Invalid data from edge function')
    } catch (edgeError) {
      console.warn('Edge function failed, falling back to direct query:', edgeError)
      // Fallback: query directly (RLS still applies — user only sees their rows)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      if (fallbackError) {
        console.error('Fallback query failed:', fallbackError)
      } else {
        setTasks(fallbackData || [])
      }
    } finally {
      setTaskLoading(false)
    }
  }

  // 🔹 Add Task then immediately re-fetch
  const addTask = async () => {
    if (!newTask.trim()) return
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const { error } = await supabase.from('tasks').insert([
      { title: newTask.trim(), user_id: currentUser?.id }
    ])
    if (error) {
      console.error('Insert error:', error)
    } else {
      setNewTask('')
      await fetchTasks() // re-fetch after insert
    }
  }

  // 🔹 Handle Enter key in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addTask()
  }

  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
        <p style={{ color: '#888', marginTop: 12 }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {!user ? (
        <div style={styles.card}>
          <div style={styles.logo}>✅</div>
          <h1 style={styles.title}>Task App</h1>
          <p style={styles.subtitle}>Sign in to manage your tasks</p>
          <button style={styles.googleBtn} onClick={handleLogin}>
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 10 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      ) : (
        <div style={styles.dashboard}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <h2 style={styles.welcome}>Welcome back 👋</h2>
              <p style={styles.email}>{user.email}</p>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>

          {/* Add Task */}
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              type="text"
              placeholder="What needs to be done?"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button style={styles.addBtn} onClick={addTask}>
              + Add
            </button>
          </div>

          {/* Task Count */}
          <div style={styles.taskMeta}>
            <span style={styles.taskCount}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Task List */}
          <div style={styles.taskList}>
            {taskLoading ? (
              <div style={styles.emptyState}>
                <div style={styles.spinner} />
                <p style={{ color: '#aaa', marginTop: 10 }}>Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 40 }}>📋</div>
                <p style={{ color: '#aaa', marginTop: 8 }}>No tasks yet — add one above!</p>
              </div>
            ) : (
              tasks.map((task, index) => (
                <div key={task.id} style={styles.taskItem}>
                  <div style={styles.taskIndex}>{index + 1}</div>
                  <span style={styles.taskTitle}>{task.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inline styles ─────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 16px',
    fontFamily: "'Inter', sans-serif",
  },
  centered: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0f0f',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #333',
    borderTop: '3px solid #6C63FF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  card: {
    background: '#1e1e2e',
    borderRadius: 20,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 380,
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    border: '1px solid #2a2a3e',
  },
  logo: { fontSize: 48, marginBottom: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 8px' },
  subtitle: { color: '#888', fontSize: 14, margin: '0 0 32px' },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '13px 20px',
    background: '#fff',
    color: '#333',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  dashboard: {
    width: '100%',
    maxWidth: 560,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#1e1e2e',
    borderRadius: 16,
    padding: '20px 24px',
    marginBottom: 16,
    border: '1px solid #2a2a3e',
  },
  welcome: { color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 },
  email: { color: '#888', fontSize: 13, margin: '4px 0 0' },
  logoutBtn: {
    padding: '8px 16px',
    background: 'transparent',
    color: '#ff6b6b',
    border: '1px solid #ff6b6b',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  },
  inputRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    padding: '13px 16px',
    background: '#1e1e2e',
    border: '1px solid #2a2a3e',
    borderRadius: 10,
    color: '#fff',
    fontSize: 15,
    outline: 'none',
  },
  addBtn: {
    padding: '13px 20px',
    background: '#6C63FF',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  taskMeta: {
    marginBottom: 10,
    paddingLeft: 4,
  },
  taskCount: {
    color: '#555',
    fontSize: 13,
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 0',
    background: '#1e1e2e',
    borderRadius: 16,
    border: '1px dashed #2a2a3e',
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: '#1e1e2e',
    border: '1px solid #2a2a3e',
    borderRadius: 12,
    padding: '14px 18px',
  },
  taskIndex: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: '#6C63FF22',
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskTitle: {
    color: '#e0e0e0',
    fontSize: 15,
  },
}

// Inject keyframe for spinner
const styleTag = document.createElement('style')
styleTag.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`
document.head.appendChild(styleTag)

export default App