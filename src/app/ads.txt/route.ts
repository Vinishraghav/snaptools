import { NextResponse } from 'next/server';

export async function GET() {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'pub-XXXXXXXXXXXXXXXX';
  // Standard Google AdSense ads.txt specification
  const content = `# Google AdSense Authorized Digital Sellers (ads.txt) for SnapTools\ngoogle.com, ${publisherId.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
