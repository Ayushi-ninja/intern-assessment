import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import type { Task } from './types'

function App() {
  const [user, setUser] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')

  // 🔹 Get user on load + listen for auth changes
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // 🔹 Fetch tasks when user logs in
  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  // 🔹 Google Login
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
  }

  // 🔹 Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setTasks([])
  }

  // 🔹 Fetch tasks from Edge Function
  const fetchTasks = async () => {
    const { data, error } = await supabase.functions.invoke('getTasks')

    console.log('TASKS:', data)

    if (error) {
      console.error(error)
    } else {
      setTasks(data || [])
    }
  }

  // 🔹 Add Task (RLS-safe)
  const addTask = async () => {
    if (!newTask.trim()) return

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('tasks').insert([
      {
        title: newTask,
        user_id: user?.id
      }
    ])

    if (error) {
      console.error(error)
    } else {
      setNewTask('')
      fetchTasks()
    }
  }

  // 🔹 Loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl">
        Loading...
      </div>
    )
  }

  return (
  <div className="container">
    {!user ? (
      <div className="card">
        <h1>Supabase</h1>
        <p>Secure Login + RLS + Edge Functions</p>

        <button className="btn" onClick={handleLogin}>
          Login with Google
        </button>
      </div>
    ) : (
      <div className="dashboard">
        <div className="header">
          <h2>Welcome 👋</h2>
          <p>{user.email}</p>
          <button className="logout" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="task-box">
          <input
            type="text"
            placeholder="Enter new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button onClick={addTask}>Add</button>
        </div>

        <ul className="task-list">
          {tasks.length === 0 ? (
            <p>No tasks yet</p>
          ) : (
            tasks.map((task) => (
              <li key={task.id}>{task.title}</li>
            ))
          )}
        </ul>
      </div>
    )}
  </div>
 )
}

export default App