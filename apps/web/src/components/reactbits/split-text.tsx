import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ElementType } from "react";

export interface SplitTextProps {
  text: string;
  className?: string;
  /** Stagger between words in milliseconds. */
  delay?: number;
  duration?: number;
  splitType?: "chars" | "words" | "lines" | "words, chars";
  threshold?: number;
  rootMargin?: string;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  textAlign?: "left" | "center" | "right";
  onLetterAnimationComplete?: () => void;
}

/**
 * Masked word-by-word heading reveal (M13: CSS replacement for the
 * gsap/SplitText scramble — same placement and stagger feel, no dependency).
 * `splitType="lines"` maps to words: without a layout engine, line
 * boundaries cannot be measured, and words stagger equivalently.
 */
const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = "",
  delay = 50,
  duration = 1.25,
  splitType = "chars",
  threshold = 0.1,
  rootMargin = "-100px",
  tag = "p",
  textAlign = "center",
  onLetterAnimationComplete,
}) => {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  onCompleteRef.current = onLetterAnimationComplete;

  useEffect(() => {
    const element = ref.current;
    if (!element || !text) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          observer.disconnect();
          setVisible(true);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [text, threshold, rootMargin]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const words = text.split(" ").filter((word) => word.length > 0).length;
    const timer = window.setTimeout(
      () => {
        onCompleteRef.current?.();
      },
      delay * words + duration * 1000,
    );
    return () => {
      window.clearTimeout(timer);
    };
  }, [visible, text, delay, duration]);

  const units =
    splitType === "chars" || splitType === "words, chars"
      ? text.split("")
      : text.split(" ").flatMap((word, index, all) => (index < all.length - 1 ? [word, " "] : [word]));

  const renderTag = () => {
    const style: CSSProperties = { textAlign, wordWrap: "break-word" };
    const classes = `split-parent${visible ? " split-visible" : ""} inline-block ${className}`;
    const Tag = (tag || "p") as ElementType;
    let wordIndex = -1;

    return (
      <Tag ref={ref} style={style} className={classes}>
        <span aria-hidden="true">
          {units.map((unit, index) =>
            unit === " " ? (
              <span key={index}> </span>
            ) : (
              <span key={index} className="split-mask">
                <span
                  className="split-word"
                  style={{ "--split-index": (wordIndex += 1) } as CSSProperties}
                >
                  {unit}
                </span>
              </span>
            ),
          )}
        </span>
        <span className="sr-only">{text}</span>
      </Tag>
    );
  };

  return renderTag();
};

export default SplitText;
