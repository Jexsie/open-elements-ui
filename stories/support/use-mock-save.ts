import { useCallback, useRef, useState } from "react";

/** A single save attempt, in the order the component reported it. */
export interface MockSaveAttempt {
  readonly id: number;
  readonly markdown: string;
  readonly status: "pending" | "saved" | "failed";
}

export interface MockSaveOptions {
  /** How long a save takes to settle, in milliseconds. */
  readonly latencyMs: number;
  /**
   * Arm a single failure. The first save after this switches on rejects; every
   * save after that succeeds again, so rollback and recovery can both be seen
   * without touching the control a second time.
   */
  readonly failNext: boolean;
}

export interface MockSave {
  /** Pass as `onChange`. Resolves after `latencyMs`, or rejects when armed. */
  readonly save: (markdown: string) => Promise<void>;
  readonly attempts: readonly MockSaveAttempt[];
}

/**
 * A stand-in for a consuming app's persistence layer.
 *
 * The library's components speak callbacks, not HTTP: `MarkdownView.onChange`
 * returns `void | Promise<void>`, and everything spec 003 describes — the
 * optimistic flip, the disabled state while pending, the rollback on rejection
 * — hangs off that Promise. So the mock is a function. An HTTP mock would
 * exercise the story's own plumbing instead of the component.
 */
export function useMockSave({ latencyMs, failNext }: MockSaveOptions): MockSave {
  const [attempts, setAttempts] = useState<readonly MockSaveAttempt[]>([]);

  // Read the controls through a ref so `save` never changes identity: it is
  // handed to a component that keeps it for the lifetime of its editor.
  const latencyRef = useRef(latencyMs);
  latencyRef.current = latencyMs;

  const nextIdRef = useRef(0);

  const armedRef = useRef(failNext);
  const previousFailNextRef = useRef(failNext);
  if (previousFailNextRef.current !== failNext) {
    // Re-arm on every switch-on, so toggling the control off and on again
    // buys another single failure.
    previousFailNextRef.current = failNext;
    armedRef.current = failNext;
  }

  const save = useCallback((markdown: string): Promise<void> => {
    const shouldFail = armedRef.current;
    armedRef.current = false;

    const id = nextIdRef.current++;
    setAttempts((previous) => [...previous, { id, markdown, status: "pending" }]);

    return new Promise<void>((resolve, reject) => {
      window.setTimeout(() => {
        const status = shouldFail ? "failed" : "saved";
        setAttempts((previous) =>
          previous.map((attempt) => (attempt.id === id ? { ...attempt, status } : attempt)),
        );
        if (shouldFail) reject(new Error("Mock save rejected"));
        else resolve();
      }, latencyRef.current);
    });
  }, []);

  return { save, attempts };
}
