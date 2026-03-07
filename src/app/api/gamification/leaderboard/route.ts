import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'weekly'
  const limit = parseInt(searchParams.get('limit') || '10')
  
  let periodStart = null
  const now = new Date()
  
  if (period === 'weekly') {
    now.setDate(now.getDate() - 7)
    periodStart = now.toISOString()
  } else if (period === 'monthly') {
    now.setDate(now.getDate() - 30)
    periodStart = now.toISOString()
  }
  
  const { data, error } = await (supabase.rpc as any)('get_leaderboard', {
    period_start: periodStart,
    limit_count: limit
  })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
