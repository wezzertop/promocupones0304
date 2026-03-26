import { NextRequest, NextResponse } from 'next/server';
import { MercadoLibreService } from '@/lib/mercadolibre/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, redirectUri } = body;

    if (!code || !redirectUri) {
      return NextResponse.json(
        { success: false, error: 'Missing code or redirectUri' },
        { status: 400 }
      );
    }

    await MercadoLibreService.authorize(code, redirectUri);

    return NextResponse.json({
      success: true,
      message: 'Mercado Libre successfully authorized.',
    });
  } catch (error: any) {
    console.error('[API] Mercado Libre auth error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
