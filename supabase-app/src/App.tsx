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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4">
      {!user ? (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl text-center">
          <h1 className="text-3xl font-bold mb-4">🚀 Supabase App</h1>
          <p className="mb-6 text-gray-300">Login to manage your tasks</p>

          <button
            onClick={handleLogin}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg font-semibold transition"
          >
            Login with Google
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xl bg-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Welcome 👋</h2>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-1 px-3 py-2 rounded bg-gray-700 outline-none"
            />
            <button
              onClick={addTask}
              className="bg-green-500 px-4 rounded hover:bg-green-600"
            >
              Add
            </button>
          </div>

          <ul className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-gray-400">No tasks yet</p>
            ) : (
              tasks.map((task) => (
                <li
                  key={task.id}
                  className="bg-gray-700 px-3 py-2 rounded"
                >
                  {task.title}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default App