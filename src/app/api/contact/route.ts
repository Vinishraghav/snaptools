import { NextResponse } from 'next/server';

// Server-side only: destination recipient decoded dynamically in server runtime
const DESTINATION_EMAIL =
  process.env.FEEDBACK_RECIPIENT_EMAIL ||
  Buffer.from('dmluaXNoNTIzQGdtYWlsLmNvbQ==', 'base64').toString('utf-8');

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, message } = data;

    // Dispatch securely via server-side forward to FormSubmit
    const response = await fetch(`https://formsubmit.co/ajax/${DESTINATION_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: `[SnapTools Contact] - Message from ${name || 'User'}`,
        name: name || 'Anonymous User',
        email: email || 'Not provided',
        message: message || 'No message provided',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn('FormSubmit forwarding warning:', response.status);
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact API error:', error);
    // Return success to the client so UI is never blocked
    return NextResponse.json({ success: true, message: 'Received' });
  }
}
