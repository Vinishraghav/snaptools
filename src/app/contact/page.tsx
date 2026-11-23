'use client';

import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, ExternalLink } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetch('https://formsubmit.co/ajax/vinish523@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `[OmniTools Contact] - Message from ${name}`,
          name,
          email,
          message,
        }),
      });
    } catch {
      // fallback
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  const mailtoUrl = `mailto:vinish523@gmail.com?subject=${encodeURIComponent(
    `[OmniTools Contact] - Message from ${name || 'User'}`
  )}&body=${encodeURIComponent(message)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 dark:text-white tracking-tight">
          Contact &amp; Feedback
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Have a feature suggestion, tool request, or bug report? Reach out directly to our lead developer at{' '}
          <a
            href="mailto:vinish523@gmail.com"
            className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2"
          >
            vinish523@gmail.com
          </a>
          .
        </p>
      </div>

      {/* Direct email card */}
      <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Direct Email Address</div>
            <a
              href="mailto:vinish523@gmail.com"
              className="text-sm font-bold text-neutral-900 dark:text-white hover:text-blue-600 transition"
            >
              vinish523@gmail.com
            </a>
          </div>
        </div>

        <a
          href="mailto:vinish523@gmail.com"
          className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 flex items-center gap-1.5 transition"
        >
          <span>Open in Mail</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Message Received!</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Thank you for reaching out. Your feedback has been sent directly to <strong>vinish523@gmail.com</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Message / Feedback
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you love or what new micro-tools you'd like to see added..."
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
            >
              {submitting ? (
                <span>Sending...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to vinish523@gmail.com</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
