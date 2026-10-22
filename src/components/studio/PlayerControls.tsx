import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { Button } from '../ui/Button';
import { SPEEDS, type TracePlayer } from './useTracePlayer';

export function PlayerControls({ player }: { player: TracePlayer }) {
  const { index, total, playing } = player;
  const disabled = total === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="w-20 shrink-0 font-mono text-xs text-muted" aria-live="polite">
          {total ? index + 1 : 0} / {total}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(total - 1, 0)}
          value={index}
          onChange={(e) => player.seek(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 cursor-pointer accent-[rgb(var(--accent))]"
          aria-label="Trace progress"
          aria-valuetext={`Step ${index + 1} of ${total}`}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button size="icon" onClick={player.reset} disabled={disabled || player.atStart} aria-label="Reset to first step" title="Reset (Home)">
            <RotateCcw />
          </Button>
          <Button size="icon" onClick={player.prev} disabled={disabled || player.atStart} aria-label="Previous step" title="Previous (←)">
            <ChevronLeft />
          </Button>
          <Button variant="primary" className="w-24" onClick={player.toggle} disabled={total <= 1} aria-label={playing ? 'Pause' : 'Play'} title="Play / pause (Space)">
            {playing ? <Pause /> : <Play />}
            {playing ? 'Pause' : player.atEnd && total > 1 ? 'Replay' : 'Play'}
          </Button>
          <Button size="icon" onClick={player.next} disabled={disabled || player.atEnd} aria-label="Next step" title="Next (→)">
            <ChevronRight />
          </Button>
          <Button size="icon" onClick={player.toEnd} disabled={disabled || player.atEnd} aria-label="Jump to last step" title="Last step (End)">
            <SkipForward />
          </Button>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5" role="radiogroup" aria-label="Playback speed">
          {SPEEDS.map((s) => (
            <button
              key={s}
              role="radio"
              aria-checked={player.speed === s}
              onClick={() => player.setSpeed(s)}
              className={`rounded px-2 py-1 font-mono text-xs transition-colors ${player.speed === s ? 'bg-subtle text-fg' : 'text-muted hover:text-fg'}`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
      <p className="hidden text-[11px] text-muted sm:block">
        Shortcuts: <span className="kbd">Space</span> play/pause · <span className="kbd">←</span> <span className="kbd">→</span> step ·{' '}
        <span className="kbd">Home</span> reset
      </p>
    </div>
  );
}
