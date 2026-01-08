import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { variance, side, timestamp } = body;

        // Log the variance result for production debugging
        // This will be visible in Vercel logs
        console.log(`[DEBUG_VARIANCE] Side: ${side}, Variance: ${variance}, Timestamp: ${timestamp}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[DEBUG_VARIANCE_ERROR]', error);
        return NextResponse.json({ success: false, error: 'Failed to log variance' }, { status: 500 });
    }
}
