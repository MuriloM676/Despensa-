import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

function decimalPlaces(value: number): number {
  const text = value.toString();
  if (text.includes(".")) {
    const decimals = text.split(".")[1] ?? "";
    if (Number.parseInt(decimals) !== 0) {
      return decimals.length;
    }
  }
  return 0;
}

/** Animated number counter (M13: rAF replacement for the motion/react spring). */
export default function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const callbacks = useRef({ onStart, onEnd });
  callbacks.current = { onStart, onEnd };

  const maxDecimals = Math.max(decimalPlaces(from), decimalPlaces(to));
  const startValue = direction === "down" ? to : from;
  const endValue = direction === "down" ? from : to;

  function formatValue(latest: number): string {
    const hasDecimals = maxDecimals > 0;
    const formatted = Intl.NumberFormat("pt-BR", {
      useGrouping: Boolean(separator),
      minimumFractionDigits: hasDecimals ? maxDecimals : 0,
      maximumFractionDigits: hasDecimals ? maxDecimals : 0,
    }).format(latest);
    return separator ? formatted.replace(/\./g, separator) : formatted;
  }

  const [text, setText] = useState(() => formatValue(startValue));

  useEffect(() => {
    setText(formatValue(startValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, direction]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !startWhen) {
      return;
    }

    let frame = 0;
    let startTimeout = 0;
    let endTimeout = 0;
    let stopped = false;

    function tick(startTime: number): void {
      if (stopped) {
        return;
      }
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsed / Math.max(duration, 0.01), 1);
      const eased = 1 - Math.pow(2, -10 * progress);
      const settled = progress === 1 ? 1 : eased;
      setText(formatValue(startValue + (endValue - startValue) * settled));
      if (progress < 1) {
        frame = requestAnimationFrame(() => {
          tick(startTime);
        });
      }
    }

    function begin(): void {
      callbacks.current.onStart?.();
      startTimeout = window.setTimeout(
        () => {
          tick(performance.now());
        },
        delay * 1000,
      );
      endTimeout = window.setTimeout(
        () => {
          callbacks.current.onEnd?.();
        },
        delay * 1000 + duration * 1000,
      );
    }

    if (typeof IntersectionObserver === "undefined") {
      begin();
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting) {
            observer.disconnect();
            begin();
          }
        },
        { threshold: 0 },
      );
      observer.observe(element);
      return () => {
        stopped = true;
        observer.disconnect();
        window.clearTimeout(startTimeout);
        window.clearTimeout(endTimeout);
        cancelAnimationFrame(frame);
      };
    }

    return () => {
      stopped = true;
      window.clearTimeout(startTimeout);
      window.clearTimeout(endTimeout);
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWhen, delay, duration, from, to, direction]);

  return (
    <span className={className} ref={ref}>
      {text}
    </span>
  );
}
