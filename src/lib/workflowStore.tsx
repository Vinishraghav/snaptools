'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export interface WorkflowPayload {
  id: string;
  files: File[];
  sourceToolSlug: string;
  timestamp: number;
  textPayload?: string;
  metadata?: Record<string, unknown>;
}

interface WorkflowContextValue {
  payload: WorkflowPayload | null;
  lastConsumedId: string | null;
  setWorkflowPayload: (input: Omit<WorkflowPayload, 'id' | 'timestamp'>) => WorkflowPayload;
  pipeToTool: (targetSlugOrPath: string, input: Omit<WorkflowPayload, 'id' | 'timestamp'>) => void;
  markConsumed: (id: string) => void;
  clearWorkflowPayload: () => void;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [payload, setPayload] = useState<WorkflowPayload | null>(null);
  const [lastConsumedId, setLastConsumedId] = useState<string | null>(null);
  const payloadRef = useRef<WorkflowPayload | null>(null);

  const setWorkflowPayload = useCallback(
    (input: Omit<WorkflowPayload, 'id' | 'timestamp'>): WorkflowPayload => {
      const next: WorkflowPayload = {
        ...input,
        id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
      };
      payloadRef.current = next;
      setPayload(next);
      setLastConsumedId(null);
      return next;
    },
    []
  );

  const pipeToTool = useCallback(
    (targetSlugOrPath: string, input: Omit<WorkflowPayload, 'id' | 'timestamp'>) => {
      setWorkflowPayload(input);
      const href = targetSlugOrPath.startsWith('/')
        ? targetSlugOrPath
        : `/tools/${targetSlugOrPath}`;
      router.push(href);
    },
    [router, setWorkflowPayload]
  );

  const markConsumed = useCallback((id: string) => {
    setLastConsumedId(id);
  }, []);

  const clearWorkflowPayload = useCallback(() => {
    payloadRef.current = null;
    setPayload(null);
    setLastConsumedId(null);
  }, []);

  return (
    <WorkflowContext.Provider
      value={{
        payload,
        lastConsumedId,
        setWorkflowPayload,
        pipeToTool,
        markConsumed,
        clearWorkflowPayload,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

const FALLBACK_CTX: WorkflowContextValue = {
  payload: null,
  lastConsumedId: null,
  setWorkflowPayload: (input) => ({
    ...input,
    id: 'fallback',
    timestamp: Date.now(),
  }),
  pipeToTool: () => {},
  markConsumed: () => {},
  clearWorkflowPayload: () => {},
};

export function useWorkflowStore(): WorkflowContextValue {
  return useContext(WorkflowContext) ?? FALLBACK_CTX;
}

export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'application/octet-stream' });
}
