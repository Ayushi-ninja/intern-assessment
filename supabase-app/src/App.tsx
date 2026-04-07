import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import type { Task } from './types'

function App() {
  const [user, setUser] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')

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

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
}

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setTasks([])
  }

  const fetchTasks = async () => {
   const { data, error } = await supabase.functions.invoke('getTasks')

   if (error) {
    console.error(error)
  } else {
    setTasks(data)
  }
}

  const addTask = async () => {
    if (!newTask.trim()) return

    await supabase.from('tasks').insert([{ title: newTask }])
    setNewTask('')
    fetchTasks()
  }

  useEffect(() => {
    if (user) fetchTasks()
  }, [user])

  if (loading) {
    return (
      <div className="center">
        <h2>Loading...</h2>
      </div>
    )
  }

  return (
    <div className="container">
      {!user ? (
        <div className="card">
          <h1>Login App</h1>

          <button className="btn" onClick={handleLogin}>
            Login with Google
          </button>
        </div>
      ) : (
        <div className="dashboard">
          <div className="header">
            <h2>Welcome</h2>
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
            {tasks.map((task) => (
              <li key={task.id}>{task.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default App