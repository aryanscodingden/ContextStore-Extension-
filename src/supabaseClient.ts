import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efiivbulfaqqvfjtkmkq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaWl2YnVsZmFxcXZmanRrbWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzA4MzAsImV4cCI6MjA3NjgwNjgzMH0.78DAD-0HJJ_w7vXlmGq_bh4oiSDQvB4a3R9bfUZSSto'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
