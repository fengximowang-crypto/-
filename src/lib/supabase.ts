import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jbodtfjhvjchvvbaaxpt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impib2R0ZmpodmpjaHZ2YmFheHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNTQ5MzUsImV4cCI6MjA5MzczMDkzNX0.UqVxBAeQ7S9Q5qOKpyF-OwDz53TQwz3TAaKXwJZ5BcI'

export const supabase = createClient(supabaseUrl, supabaseKey)
