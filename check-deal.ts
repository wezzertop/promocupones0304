
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fghyaukpaufsmxvmwnbg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnaHlhdWtwYXVmc214dm13bmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTgzODcsImV4cCI6MjA4Nzc5NDM4N30.7tZfRlQvGkQoUVRia4lLxlK9iT5ypZwLnfpS4epmPMs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDeal(id: string) {
  console.log(`Checking deal with ID: ${id}`)
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching deal:', error)
  } else {
    console.log('Deal found:', data)
  }
}

// The ID from the previous user input (from the href)
const dealId = '500781a3-e557-4018-8608-c76d593a3c21'
checkDeal(dealId)
