import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://etczyvlsiebdvosxdegd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0Y3p5dmxzaWViZHZvc3hkZWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MzE5OTcsImV4cCI6MjA5OTQwNzk5N30.4IJ5s4gS1pPiq9YwDnDALCdvL9LgfRtjrGvU9GcdmBM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
