import { createClient } from '@/lib/supabase/server'
import ScraperClient from './ScraperClient'

export default async function ScraperPage() {
  const supabase = await createClient()

  // Fetch categories for the dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return <ScraperClient categories={categories || []} />
}
