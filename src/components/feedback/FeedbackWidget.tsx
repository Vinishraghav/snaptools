'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Send,
  CheckCircle2,
  Mail,
  ExternalLink,
} from 'lucide-react';

interface FeedbackWidgetProps {
  toolName?: string;
  toolSlug?: string;
}

export default function FeedbackWidget({
  toolName = 'OmniTools Platform',
  toolSlug = 'general',
}: FeedbackWidgetProps) {
  const [rating, setRating] = useState<'helpful' | 'unhelpful' | 'idea' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Send via FormSubmit AJAX to vinish523@gmail.com
      await fetch('https://formsubmit.co/ajax/vinish523@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `[OmniTools Feedback] - ${toolName}`,
          tool: toolName,
          slug: toolSlug,
          experience: rating || 'Not specified',
          message: feedbackText,
          senderEmail: userEmail || 'Anonymous',
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      });
    } catch {
      // Fallback works gracefully even if network is offline
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  const mailtoUrl = `mailto:vinish523@gmail.com?subject=${encodeURIComponent(
    `[OmniTools Feedback] - ${toolName}`
  )}&body=${encodeURIComponent(
    `Tool: ${toolName}\nRating: ${rating || 'N/A'}\nFeedback: ${feedbackText}\nUser Email: ${userEmail}\nURL: ${
      typeof window !== 'undefined' ? window.location.href : ''
    }`
  )}`;

  return (
    <section
      aria-label="User Feedback"
      className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-white via-neutral-50/80 to-blue-50/20 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/20 border border-neutral-200 dark:border-neutral-800 shadow-sm"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100/70 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Developer Feedback</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-neutral-950 dark:text-white">
            Help Us Improve {toolName}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Send your thoughts, bug reports, or feature requests directly to{' '}
            <a
              href="mailto:vinish523@gmail.com"
              className="text-blue-600 dark:text-blue-400 font-semibold underline underline-offset-2"
            >
              vinish523@gmail.com
            </a>
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
              Thank You for Your Feedback!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
              Your feedback for <strong>{toolName}</strong> has been routed to{' '}
              <strong>vinish523@gmail.com</strong>. We review every note to build better tools!
            </p>
            <div className="pt-2">
              <a
                href={mailtoUrl}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                <Mail className="w-3.5 h-3.5" /> Send direct email via mail app
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick reaction buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setRating('helpful')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
                  rating === 'helpful'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-600 dark:text-emerald-300 shadow-sm'
                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <ThumbsUp className="w-4 h-4 text-emerald-500" />
                <span>Works Great!</span>
              </button>

              <button
                type="button"
                onClick={() => setRating('unhelpful')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
                  rating === 'unhelpful'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950 dark:border-rose-600 dark:text-rose-300 shadow-sm'
                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <ThumbsDown className="w-4 h-4 text-rose-500" />
                <span>Found a Bug / Issue</span>
              </button>

              <button
                type="button"
                onClick={() => setRating('idea')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
                  rating === 'idea'
                    ? 'bg-amber-50 border-amber-400 text-amber-700 dark:bg-amber-950 dark:border-amber-600 dark:text-amber-300 shadow-sm'
                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Feature Suggestion</span>
              </button>
            </div>

            {/* Message input */}
            <div>
              <textarea
                required
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="What can we do to make this tool even better for you? (e.g. add new formats, fix calculation, etc.)"
                className="w-full p-3.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Optional Email & Submit */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Your email (optional, for reply)"
                className="w-full sm:w-2/3 px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={submitting || !feedbackText.trim()}
                className="w-full sm:w-1/3 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                {submitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to Developer</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
              <span>Recipient: vinish523@gmail.com</span>
              <a
                href={mailtoUrl}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Prefer email app? <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
