import { NextResponse } from 'next/server';

// Server-side only: destination recipient decoded dynamically in server runtime
const DESTINATION_EMAIL =
  process.env.FEEDBACK_RECIPIENT_EMAIL ||
  Buffer.from('dmluaXNoNTIzQGdtYWlsLmNvbQ==', 'base64').toString('utf-8');

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { toolName, toolSlug, experience, message, senderEmail, pageUrl } = data;

    // Dispatch securely via server-side forward to FormSubmit
    const response = await fetch(`https://formsubmit.co/ajax/${DESTINATION_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: `[SnapTools Feedback] - ${toolName || 'Tool'} (${experience || 'General'})`,
        tool: toolName,
        slug: toolSlug,
        rating: experience,
        feedback: message,
        senderEmail: senderEmail || 'Anonymous',
        pageUrl: pageUrl || '',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn('FormSubmit feedback forwarding warning:', response.status);
    }

    return NextResponse.json({ success: true, message: 'Feedback sent successfully' });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ success: true, message: 'Received' });
  }
}
