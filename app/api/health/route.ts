import { healthChecker } from '@/lib/monitoring';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Register health checks
healthChecker.registerCheck('database', async () => {
  try {
    if (!supabase) {
      return false;
    }
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
});

healthChecker.registerCheck('firebase', async () => {
  try {
    // Basic Firebase check - in real app, you'd check Firebase services
    return !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    );
  } catch {
    return false;
  }
});

export async function GET() {
  try {
    const results = await healthChecker.runAllChecks();
    const allHealthy = Object.values(results).every(Boolean);
    
    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: results,
    }, { 
      status: allHealthy ? 200 : 503 
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    }, { 
      status: 500 
    });
  }
} 