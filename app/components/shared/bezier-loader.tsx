export function BezierLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="relative flex flex-col items-center gap-8">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="overflow-visible">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="grad3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Curve 1 — large outer sweep */}
          <path
            d="M 20,60 C 20,20 60,0 60,60 C 60,120 100,100 100,60"
            stroke="url(#grad1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            style={{
              strokeDasharray: 220,
              strokeDashoffset: 220,
              animation: "drawCurve 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards, fadeCurve 0.9s ease-in-out infinite 0.5s",
            }}
          />

          {/* Curve 2 — inner figure-eight */}
          <path
            d="M 40,60 C 40,30 60,20 60,60 C 60,100 80,90 80,60"
            stroke="url(#grad2)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            style={{
              strokeDasharray: 140,
              strokeDashoffset: 140,
              animation: "drawCurve 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.08s forwards, fadeCurve 0.9s ease-in-out infinite 0.55s",
            }}
          />

          {/* Curve 3 — tight center loop */}
          <path
            d="M 50,60 C 50,42 60,38 60,60 C 60,82 70,78 70,60"
            stroke="url(#grad3)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            style={{
              strokeDasharray: 80,
              strokeDashoffset: 80,
              animation: "drawCurve 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards, fadeCurve 0.9s ease-in-out infinite 0.6s",
            }}
          />

          {/* Orbiting dot */}
          <circle r="3" fill="#3b82f6" opacity="0.9">
            <animateMotion
              dur="1.2s"
              repeatCount="indefinite"
              path="M 20,60 C 20,20 60,0 60,60 C 60,120 100,100 100,60"
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="spline"
              keySplines="0.45 0 0.55 1"
            />
            <animate attributeName="r" values="2;3.5;2" dur="1.2s" repeatCount="indefinite" />
          </circle>

          {/* Second orbiting dot */}
          <circle r="2" fill="#8b5cf6" opacity="0.7">
            <animateMotion
              dur="1s"
              repeatCount="indefinite"
              path="M 40,60 C 40,30 60,20 60,60 C 60,100 80,90 80,60"
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="spline"
              keySplines="0.45 0 0.55 1"
            />
          </circle>

          {/* Center pulse */}
          <circle cx="60" cy="60" r="4" fill="none" stroke="#0f172a" strokeWidth="1" opacity="0.15">
            <animate attributeName="r" values="4;18;4" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
            <animate attributeName="opacity" values="0.2;0;0.2" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>

        <p className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground/60 animate-pulse">
          Chargement
        </p>

        <style>{`
          @keyframes drawCurve {
            to { stroke-dashoffset: 0; }
          }
          @keyframes fadeCurve {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.35; }
          }
        `}</style>
      </div>
    </div>
  );
}
