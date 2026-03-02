import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '7')
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Calculate start date
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('gamification_xp_history')
    .select('amount, created_at')
    .eq('user_id', user.id)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Group by date
  const groupedData = data.reduce((acc: any, curr: any) => {
    const date = new Date(curr.created_at).toLocaleDateString('es-MX', { 
        month: 'short', 
        day: 'numeric' 
    })
    
    if (!acc[date]) {
      acc[date] = 0
    }
    acc[date] += curr.amount
    return acc
  }, {})
  
  // Convert to array format for Recharts
  // Fill missing days with 0 if needed (optional, keeping it simple for now)
  const chartData = Object.keys(groupedData).map(date => ({
    date,
    xp: groupedData[date]
  }))
  
  return NextResponse.json(chartData)
}
