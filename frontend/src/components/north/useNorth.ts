import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NorthNavigate,
  NorthProgressPayload,
  NorthScenarioStep,
  NorthState,
  api,
} from "../../api";

/**
 * Wires the North API + state machine for the panel. Owns:
 *  - the current scenario + progress payload (fetched once on mount)
 *  - the visible North state (idle / waiting / listening / …)
 *  - "isTyping" flag so the panel can hide the input until the bubble finishes
 *  - a small "is first visit today" flag so the panel can play the "hyped" intro
 *
 * The visual state is *derived*, not mirrored from the API: the API tells us
 * which state a step *expects*, and the hook layers transient states on top of
 * that (listening while the user types, celebrating right after a correct
 * answer, …).
 */
export function useNorth() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<NorthProgressPayload | null>(null);
  const [state, setState] = useState<NorthState>("idle");
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const greetingShown = useRef(false);

  /** Act on a navigate hint coming back from /respond. We wait briefly so the
   * celebration animation has a chance to play before yanking the route. */
  const handleNavigate = useCallback(
    (hint: NorthNavigate | null | undefined) => {
      if (!hint) return;
      window.setTimeout(() => {
        if (hint.type === "course") navigate(`/courses/${hint.target}`);
        else if (hint.type === "url") window.location.assign(hint.target);
      }, 600);
    },
    [navigate],
  );

  // -- initial fetch ------------------------------------------------------
  const load = useCallback(async () => {
    try {
      const next = await api.northProgress();
      setProgress(next);
      // Tag this as today's first sighting so we can play the "hyped" state
      // exactly once per day per user.
      const today = new Date().toISOString().slice(0, 10);
      const lastSeen = (() => {
        try {
          return localStorage.getItem("kompas_north_last_seen");
        } catch {
          return null;
        }
      })();
      const isFirstVisitToday = lastSeen !== today && !greetingShown.current;
      try {
        localStorage.setItem("kompas_north_last_seen", today);
      } catch {
        /* quota */
      }
      greetingShown.current = true;

      if (next.completed) {
        setState("celebrating");
      } else if (!next.scenario) {
        setState("idle");
      } else if (isFirstVisitToday) {
        setState("hyped");
      } else {
        setState(next.next_step?.north_state ?? "waiting");
      }
      // Always start with the typewriter running so the user sees the message
      // build up rather than appearing all at once.
      setIsTyping(true);
    } catch (e: any) {
      setError(e?.detail || e?.message || String(e));
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  // -- typewriter signals -------------------------------------------------
  const onBubbleDone = useCallback(() => {
    setIsTyping(false);
    // Once the message is fully visible, switch from the intro state to the
    // step's "resting" state (waiting / thinking / listening etc).
    const step = progress?.next_step;
    if (step) setState(step.north_state);
  }, [progress]);

  // The user is composing — show the "listening" state.
  const onUserTyping = useCallback(() => {
    setState("listening");
  }, []);

  // -- submit / advance ---------------------------------------------------
  const submit = useCallback(
    async (response: string | null) => {
      if (!progress?.next_step || busy) return;
      const step = progress.next_step;
      setBusy(true);
      setState("thinking");
      try {
        const result = await api.northRespond(step.id, response);
        // Build the next progress payload from the response.
        setProgress((prev) => {
          if (!prev || !prev.scenario) return prev;
          return {
            ...prev,
            current_step: result.current_step,
            total_steps: result.total_steps,
            completed: result.completed,
            next_step: result.next_step,
          };
        });
        // The /respond endpoint may include a navigate hint when the step we
        // just finished had a content_ref pointing at a course.
        handleNavigate(result.navigate);
        if (result.is_correct === false) {
          // Wrong answer: stay on the step, briefly show "surprised", then
          // settle back into the step's resting state so the user can retry.
          setState("surprised");
          setIsTyping(false);
          window.setTimeout(() => {
            setState(step.north_state);
          }, 900);
        } else if (result.completed) {
          setState("celebrating");
          setIsTyping(false);
        } else if (result.next_step) {
          setState("celebrating");
          // Replay the typewriter for the new step's message.
          setIsTyping(true);
          // After a short celebration, drop into the next step's state. The
          // typewriter onDone callback will take over from there.
          window.setTimeout(() => {
            setState(result.next_step!.north_state);
          }, 600);
        } else {
          setState("idle");
          setIsTyping(false);
        }
      } catch (e: any) {
        setError(e?.detail || e?.message || String(e));
        setState("surprised");
      } finally {
        setBusy(false);
      }
    },
    [progress, busy],
  );

  const reset = useCallback(async () => {
    setBusy(true);
    try {
      const next = await api.northReset();
      setProgress(next);
      setState("hyped");
      setIsTyping(true);
    } catch (e: any) {
      setError(e?.detail || e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const currentStep: NorthScenarioStep | null = progress?.next_step ?? null;
  return {
    progress,
    currentStep,
    state,
    isTyping,
    busy,
    error,
    onBubbleDone,
    onUserTyping,
    submit,
    reset,
    reload: load,
  };
}
