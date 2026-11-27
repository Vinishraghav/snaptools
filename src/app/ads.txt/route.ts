import { NextResponse } from 'next/server';

export async function GET() {
  const rawId = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '').trim();
  const normalizedPubId = rawId.replace(/^ca-/, '');

  if (!/^pub-\d{10,}$/.test(normalizedPubId)) {
    return new NextResponse('Google AdSense publisher ID not yet configured.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const content = `# Google AdSense Authorized Digital Sellers (ads.txt) for SnapTools\ngoogle.com, ${normalizedPubId}, DIRECT, f08c47fec0942fa0\n`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
