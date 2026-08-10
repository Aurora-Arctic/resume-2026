import React, {
  type ReactElement,
  type ReactNode,
  cloneElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import { classNames } from '../../utils/classNames';
import './index.scss';

// A single key holding a JSON array of dismissed tooltip ids, rather than
// one storage key per tooltip — keeps "restore everything" (RestoreTooltips)
// a single removeItem instead of a prefix scan, while individual tooltips
// still track their own dismissal independently via their own id.
export const TOOLTIP_STORAGE_KEY = 'tooltip-cleared';
// Broadcast by RestoreTooltips so any currently-mounted tooltip updates its
// already-loaded React state immediately, without needing a page reload.
export const TOOLTIP_RESTORE_EVENT = 'tooltips:restore';
// Broadcast by dismissTooltips so a group of related, already-mounted
// tooltips (e.g. every tooltip in one resume section) can be dismissed
// together from a single ×, without each needing its own click.
export const TOOLTIP_DISMISS_EVENT = 'tooltips:dismiss';

const readClearedIds = (): string[] => {
  const raw = window.localStorage.getItem(TOOLTIP_STORAGE_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed)
    ? parsed.filter((entry): entry is string => typeof entry === 'string')
    : [];
};

// Persists every id in `ids` as dismissed (merged with whatever's already
// cleared) and broadcasts them in one event, rather than a `group` prop on
// Tooltip itself — the caller already knows exactly which ids it owns, so no
// extra abstraction is needed on the component.
export const dismissTooltips = (ids: string[]): void => {
  try {
    const clearedIds = readClearedIds();
    const merged = [...new Set([...clearedIds, ...ids])];
    window.localStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage unavailable — dismissal only lasts this page view
  }
  window.dispatchEvent(new CustomEvent(TOOLTIP_DISMISS_EVENT, { detail: { ids } }));
};

// Merges our own handler onto whatever the trigger already has, rather than
// clobbering it — the trigger element is caller-supplied (see TooltipProps),
// so a future caller's own onMouseEnter/onFocus must still run.
const composeHandlers =
  <E,>(existing: ((event: E) => void) | undefined, ours: (event: E) => void) =>
  (event: E): void => {
    existing?.(event);
    ours(event);
  };

interface TooltipProps {
  id: string;
  content: ReactNode;
  // Placement is the caller's responsibility, not this component's — the
  // trigger and tooltip render as plain siblings (a Fragment adds no
  // wrapper element), so absolute positioning falls back to whatever
  // positioned ancestor they already share. This class hooks that
  // per-instance placement CSS onto the tooltip bubble.
  className?: string;
  children: ReactElement<React.HTMLAttributes<HTMLElement>>;
  // Fires after this instance's own dismiss persists/hides — lets a caller
  // (e.g. Skills) fan a single dismissal out to a whole group of related
  // tooltips via dismissTooltips, without Tooltip itself knowing about them.
  onDismiss?: () => void;
}

const Tooltip = ({ id, content, className, children, onDismiss }: TooltipProps): ReactElement => {
  const [cleared, setCleared] = useState(false);
  // CSS alone can't hide the bubble the instant × is clicked while it's
  // still being hovered/focused — the cleared+hover/focus rule (index.scss)
  // still resolves to the same "visible" target value, so no transition
  // fires and it just stays shown. This inline-style override forces it
  // closed regardless of the live :hover/:focus-within state, until the
  // trigger is deliberately hovered/focused again (a fresh attempt).
  //
  // The override must also kill the transition itself (transition: 'none'),
  // not just flip the target opacity/visibility values: at the moment of
  // dismiss the element still matches `.tooltip.tooltip--cleared:hover`
  // (cleared just became true while still hovered), which sets a 1s
  // transition-delay. Inline style beats that rule's opacity/visibility
  // declarations, but not its transition-delay — so without disabling the
  // transition too, the browser would honor that delay (and, since
  // `visibility` only flips at transition-end, stay fully visible) for a
  // full second before actually hiding.
  const [forceHidden, setForceHidden] = useState(false);
  // trigger.focus() below (returning focus after dismiss) fires the
  // trigger's own onFocus synchronously — without this guard that would
  // immediately undo forceHidden via handleTriggerFocus, in the same tick
  // as the dismiss that just set it.
  const suppressNextTriggerFocusRef = useRef(false);

  useEffect(() => {
    try {
      setCleared(readClearedIds().includes(id));
    } catch {
      // localStorage unavailable/corrupted (private browsing, disabled
      // storage, invalid JSON) — treat as never dismissed for this page
      // view; it just won't remember a dismissal across reloads
    }
  }, [id]);

  useEffect(() => {
    const handleRestore = (): void => {
      setCleared(false);
      setForceHidden(false);
    };
    window.addEventListener(TOOLTIP_RESTORE_EVENT, handleRestore);
    return () => window.removeEventListener(TOOLTIP_RESTORE_EVENT, handleRestore);
  }, []);

  useEffect(() => {
    const handleDismissEvent = (event: Event): void => {
      const ids = (event as CustomEvent<{ ids: string[] }>).detail?.ids ?? [];
      if (ids.includes(id)) {
        setCleared(true);
        setForceHidden(true);
      }
    };
    window.addEventListener(TOOLTIP_DISMISS_EVENT, handleDismissEvent);
    return () => window.removeEventListener(TOOLTIP_DISMISS_EVENT, handleDismissEvent);
  }, [id]);

  const handleDismiss = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    setCleared(true);
    setForceHidden(true);
    try {
      const clearedIds = readClearedIds();
      if (!clearedIds.includes(id)) {
        window.localStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify([...clearedIds, id]));
      }
    } catch {
      // localStorage unavailable — dismissal only lasts this page view
    }
    // The × is about to become unreachable (tooltip suppresses again) — send
    // focus back to the trigger rather than letting it fall to <body>. The
    // trigger is always the bubble's previous DOM sibling (Fragment, no
    // wrapper — see "Why a Fragment, not a nested child" in TOOLTIP.md).
    const bubble = event.currentTarget.closest('.tooltip');
    const triggerEl = bubble?.previousElementSibling;
    if (triggerEl instanceof HTMLElement) {
      suppressNextTriggerFocusRef.current = true;
      triggerEl.focus();
    }
    onDismiss?.();
  };

  // A fresh hover/focus on the trigger is what "trying again" looks like —
  // clear the override so the normal (CSS-driven) cleared/long-hover
  // behavior takes back over.
  const handleTriggerMouseEnter = (): void => setForceHidden(false);
  const handleTriggerFocus = (): void => {
    if (suppressNextTriggerFocusRef.current) {
      suppressNextTriggerFocusRef.current = false;
      return;
    }
    setForceHidden(false);
  };

  const trigger = cloneElement(children, {
    className: classNames(children.props.className, 'tooltip-trigger'),
    'aria-describedby': id,
    onMouseEnter: composeHandlers(children.props.onMouseEnter, handleTriggerMouseEnter),
    onFocus: composeHandlers(children.props.onFocus, handleTriggerFocus),
  });

  return (
    <>
      {trigger}
      <span
        role="tooltip"
        id={id}
        className={classNames('tooltip', className, cleared && 'tooltip--cleared')}
        style={forceHidden ? { opacity: 0, visibility: 'hidden', transition: 'none' } : undefined}
      >
        <button
          type="button"
          className="dismiss-button tooltip__dismiss"
          aria-label="Dismiss tooltip"
          onClick={handleDismiss}
        >
          <span aria-hidden="true">&times;</span>
        </button>
        {content}
      </span>
    </>
  );
};

export default Tooltip;
