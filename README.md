# 🚀 Supabase Full-Stack Task Manager (React + TypeScript)

A modern full-stack web application built using **React (TypeScript)** and **Supabase**, featuring secure authentication, database operations with Row-Level Security (RLS), and serverless backend using Edge Functions.

---

## 🌐 Live Demo

👉 https://your-app-name.netlify.app

---

## 📌 Features

* 🔐 **Google Authentication** using Supabase Auth
* 🧑‍💻 **User-specific data access** with Row-Level Security (RLS)
* 📦 **Task Management System**

  * Add tasks
  * View tasks (only your own)
* ⚡ **Supabase Edge Functions** for backend logic
* 🎨 **Modern UI** with Tailwind CSS
* ☁️ **Deployed on Netlify**

---

## 🏗️ Tech Stack

### Frontend

* ⚛️ React (Vite)
* 🟦 TypeScript
* 🎨 Tailwind CSS

### Backend (Serverless)

* 🟢 Supabase

  * Authentication (Google OAuth)
  * PostgreSQL Database
  * Row Level Security (RLS)
  * Edge Functions (Deno)

### Deployment

* 🌍 Netlify (Frontend)
* ☁️ Supabase Cloud (Backend)

---

## 🔐 Authentication Flow

* Users log in via **Google OAuth**
* Supabase manages session and JWT tokens
* All database queries are secured via **RLS policies**

---

## 🗄️ Database Schema

### `tasks` Table

| Column     | Type      |
| ---------- | --------- |
| id         | uuid (PK) |
| user_id    | uuid      |
| title      | text      |
| created_at | timestamp |

---

## 🔒 Row Level Security (RLS)

RLS ensures users can only access their own data:

```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Read policy
CREATE POLICY "Users can view their own tasks"
ON tasks
FOR SELECT
USING (auth.uid() = user_id);

-- Insert policy
CREATE POLICY "Users can insert their own tasks"
ON tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## ⚡ Edge Function

Custom backend logic using Supabase Edge Functions:

* Fetches user-specific tasks
* Uses JWT from request headers
* Ensures secure data access

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🧪 Local Setup

```bash
# Clone repo
git clone https://github.com/your-username/your-repo.git

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## 🚀 Deployment

* Frontend deployed on **Netlify**
* Backend handled by **Supabase**

---

## 🧠 Key Learnings

* Implemented secure authentication using OAuth
* Used RLS for fine-grained database security
* Built serverless backend with Edge Functions
* Managed environment variables for production deployment

---

## 📸 Screenshots

(Add screenshots here)

---

## 🙌 Acknowledgements

* Supabase
* Netlify
* React & Vite

---

## 📬 Contact

If you have any questions or feedback, feel free to connect!

---

⭐ If you like this project, give it a star!
