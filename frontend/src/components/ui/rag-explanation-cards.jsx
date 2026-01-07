import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const OFFSET_FACTOR = 4;
const SCALE_FACTOR = 0.03;
const OPACITY_FACTOR = 0.1;

export function RAGExplanationCards({ cards }) {
  const [dismissedCards, setDismissedCards] = React.useState([]);
  const activeCards = cards.filter(({ id }) => !dismissedCards.includes(id));
  const cardCount = activeCards.length;
  const [showCompleted, setShowCompleted] = React.useState(cardCount > 0);

  React.useEffect(() => {
    let timeout;
    if (cardCount === 0)
      timeout = setTimeout(() => setShowCompleted(false), 2700);
    return () => clearTimeout(timeout);
  }, [cardCount]);

  return activeCards.length || showCompleted ? (
    <div
      className="group overflow-hidden px-3 pb-3 pt-8 h-full"
      data-active={cardCount !== 0}
    >
      <div className="relative size-full">
        {activeCards.toReversed().map(({ id, title, description, icon }, idx) => (
          <div
            key={id}
            className={cn(
              "absolute left-0 top-0 size-full scale-[var(--scale)] transition-[opacity,transform] duration-200",
              cardCount - idx > 3
                ? [
                    "opacity-0 sm:group-hover:translate-y-[var(--y)] sm:group-hover:opacity-[var(--opacity)]",
                  ]
                : "translate-y-[var(--y)] opacity-[var(--opacity)]"
            )}
            style={
              {
                "--y": `-${(cardCount - (idx + 1)) * OFFSET_FACTOR}%`,
                "--scale": 1 - (cardCount - (idx + 1)) * SCALE_FACTOR,
                "--opacity":
                  cardCount - (idx + 1) >= 6
                    ? 0
                    : 1 - (cardCount - (idx + 1)) * OPACITY_FACTOR,
              }
            }
            aria-hidden={idx !== cardCount - 1}
          >
            <ExplanationCard
              title={title}
              description={description}
              icon={icon}
              hideContent={cardCount - idx > 2}
              active={idx === cardCount - 1}
              onDismiss={() =>
                setDismissedCards([id, ...dismissedCards.slice(0, 50)])
              }
            />
          </div>
        ))}
        <div className="pointer-events-none invisible" aria-hidden>
          <ExplanationCard title="Title" description="Description" />
        </div>
        {showCompleted && !cardCount && (
          <div
            className="animate-slide-up-fade absolute inset-0 flex size-full flex-col items-center justify-center gap-3 [animation-duration:1s]"
            style={{ "--offset": "10px" }}
          >
            <div className="animate-fade-in absolute inset-0 rounded-lg border border-gray-300 [animation-delay:2.3s] [animation-direction:reverse] [animation-duration:0.2s]" />
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
            <span className="animate-fade-in text-xs font-medium text-gray-600 [animation-delay:2.3s] [animation-direction:reverse] [animation-duration:0.2s]">
              All concepts covered!
            </span>
          </div>
        )}
      </div>
    </div>
  ) : null;
}

function ExplanationCard({
  title,
  description,
  icon,
  onDismiss,
  hideContent,
  active,
}) {
  const ref = React.useRef(null);
  const drag = React.useRef({
    start: 0,
    delta: 0,
    startTime: 0,
    maxDelta: 0,
  });
  const animation = React.useRef();
  const [dragging, setDragging] = React.useState(false);

  const onDragMove = (e) => {
    if (!ref.current) return;
    const { clientX } = e;
    const dx = clientX - drag.current.start;
    drag.current.delta = dx;
    drag.current.maxDelta = Math.max(drag.current.maxDelta, Math.abs(dx));
    ref.current.style.setProperty("--dx", dx.toString());
  };

  const dismiss = () => {
    if (!ref.current) return;

    const cardWidth = ref.current.getBoundingClientRect().width;
    const translateX = Math.sign(drag.current.delta) * cardWidth;

    animation.current = ref.current.animate(
      { opacity: 0, transform: `translateX(${translateX}px)` },
      { duration: 150, easing: "ease-in-out", fill: "forwards" }
    );
    animation.current.onfinish = () => onDismiss?.();
  };

  const stopDragging = (cancelled) => {
    if (!ref.current) return;
    unbindListeners();
    setDragging(false);

    const dx = drag.current.delta;
    if (Math.abs(dx) > ref.current.clientWidth / (cancelled ? 2 : 3)) {
      dismiss();
      return;
    }

    animation.current = ref.current.animate(
      { transform: "translateX(0)" },
      { duration: 150, easing: "ease-in-out" }
    );
    animation.current.onfinish = () =>
      ref.current?.style.setProperty("--dx", "0");

    drag.current = { start: 0, delta: 0, startTime: 0, maxDelta: 0 };
  };

  const onDragEnd = () => stopDragging(false);
  const onDragCancel = () => stopDragging(true);

  const onPointerDown = (e) => {
    if (!active || !ref.current || animation.current?.playState === "running")
      return;

    bindListeners();
    setDragging(true);
    drag.current.start = e.clientX;
    drag.current.startTime = Date.now();
    drag.current.delta = 0;
    ref.current.style.setProperty("--w", ref.current.clientWidth.toString());
  };

  const bindListeners = () => {
    document.addEventListener("pointermove", onDragMove);
    document.addEventListener("pointerup", onDragEnd);
    document.addEventListener("pointercancel", onDragCancel);
  };

  const unbindListeners = () => {
    document.removeEventListener("pointermove", onDragMove);
    document.removeEventListener("pointerup", onDragEnd);
    document.removeEventListener("pointercancel", onDragCancel);
  };

  return (
    <Card
      ref={ref}
      className={cn(
        "relative select-none gap-2 p-5 text-sm bg-white overflow-hidden h-full flex flex-col",
        "translate-x-[calc(var(--dx)*1px)] rotate-[calc(var(--dx)*0.05deg)] opacity-[calc(1-max(var(--dx),-1*var(--dx))/var(--w)/2)]",
        "transition-shadow data-[dragging=true]:shadow-lg"
      )}
      data-dragging={dragging}
      onPointerDown={onPointerDown}
    >
      <div className={cn(hideContent && "invisible", "flex flex-col flex-1")}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md animate-pulse">
            {icon}
          </div>
          <div className="flex-1">
            <span className="font-semibold text-gray-900 block mb-1">
              {title}
            </span>
            <p className="text-gray-600 text-xs leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        
        {/* Animated Visual */}
        <div className="relative flex-1 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden border border-gray-200 mb-2">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              {/* Animated flowing particles */}
              <div className="absolute top-1/2 left-0 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
              <div className="absolute top-1/3 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute top-2/3 left-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
              
              {/* Flowing lines */}
              <svg className="absolute inset-0 w-full h-full opacity-30">
                <path
                  d="M 0 50 Q 50 20, 100 50 T 200 50"
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  fill="none"
                  className="animate-pulse"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
        
        <div
          className={cn(
            "h-0 overflow-hidden opacity-0 transition-[height,opacity] duration-200",
            "sm:group-has-[*[data-dragging=true]]:h-7 sm:group-has-[*[data-dragging=true]]:opacity-100 sm:group-hover:group-data-[active=true]:h-7 sm:group-hover:group-data-[active=true]:opacity-100"
          )}
        >
          <div className="flex items-center justify-end pt-3">
            <button
              type="button"
              onClick={dismiss}
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors duration-75 font-medium"
            >
              Got it →
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

