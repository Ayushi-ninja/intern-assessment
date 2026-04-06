import { createClient } from '@supabase/supabase-js'

const supabaseUrl: string = "https://oxbqxxjkafakrhaghkyj.supabase.co"
const supabaseAnonKey: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94YnF4eGprYWZha3JoYWdoa3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzMzMDQsImV4cCI6MjA5MTA0OTMwNH0.mN4hcf_7gz9w21kO0BqGIfq25U1BOSucjQ2Q4N7QjsY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)