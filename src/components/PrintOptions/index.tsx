import React, { type ReactElement, useEffect, useRef, useState } from 'react';
import Tooltip from '../Tooltip';
import './index.scss';

type PrintMode = 'full' | 'summary' | 'minimal' | 'application';

interface PrintModeOption {
  value: PrintMode;
  label: string;
  description?: string;
}

const SIMULATABLE_PRINT_MODES: PrintMode[] = ['full', 'summary', 'minimal', 'application'];

const PRINT_MODES: PrintModeOption[] = [
  { value: 'full', label: 'Full', description: 'All contents.' },
  {
    value: 'summary',
    label: 'Summary',
    description: 'A condensed version, trimmed to the highlights.',
  },
  { value: 'minimal', label: 'Minimal', description: 'Just the essentials.' },
  {
    value: 'application',
    label: 'Application',
    description: 'Summary details in a plain, linear layout.',
  },
];

// Transcribed from node_modules/@fortawesome/fontawesome-free/svgs/solid/print.svg
// (installed as a devDependency purely as the source for this path — see
// claude-docs/components/PRINT-OPTIONS.md). Kept as a plain inline SVG,
// fill="currentColor", same convention as ThemeToggle's icons, rather than
// pulling in Font Awesome's webfont/CSS bundle for one glyph.
const PrintIcon = (): ReactElement => (
  <svg className="print-options-trigger__icon" viewBox="0 0 512 512" aria-hidden="true">
    <path
      fill="currentColor"
      d="M64 64C64 28.7 92.7 0 128 0L341.5 0c17 0 33.3 6.7 45.3 18.7l42.5 42.5c12 12 18.7 28.3 18.7 45.3l0 37.5-384 0 0-80zM0 256c0-35.3 28.7-64 64-64l384 0c35.3 0 64 28.7 64 64l0 96c0 17.7-14.3 32-32 32l-32 0 0 64c0 35.3-28.7 64-64 64l-256 0c-35.3 0-64-28.7-64-64l0-64-32 0c-17.7 0-32-14.3-32-32l0-96zM128 416l0 32 256 0 0-96-256 0 0 64zM456 272a24 24 0 1 0 -48 0 24 24 0 1 0 48 0z"
    />
  </svg>
);

const PrintOptions = (): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<PrintMode>('full');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Tracks the open->closed transition specifically, so focus only returns
  // to the trigger on an actual close — not on initial mount, when the
  // trigger has never had focus taken from it in the first place.
  const wasOpenRef = useRef(false);

  // Mounted once, regardless of isOpen — Ctrl/Cmd+P must open the modal from
  // anywhere on the page, not just while it's already open.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clears the attribute once the browser's own print flow finishes —
  // inert either way (every rule reading it lives inside @media print), but
  // keeps a later devtools inspection from finding a stale value.
  useEffect(() => {
    const handleAfterPrint = (): void => {
      document.documentElement.removeAttribute('data-print-mode');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Lets a query param simulate a tier's content directly on screen (the
  // attribute alone now drives the tier-content rules — see
  // claude-docs/components/PRINT-OPTIONS.md), without going through the modal
  // or calling window.print().
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('printMode');
    const isSimulatable = (value: string | null): value is PrintMode =>
      SIMULATABLE_PRINT_MODES.includes(value as PrintMode);
    if (!isSimulatable(requested)) return;
    document.documentElement.setAttribute('data-print-mode', requested);
    setSelectedMode(requested);
  }, []);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      panelRef.current?.focus();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Escape-to-close and a Tab focus trap, both only wired up while the
  // dialog is actually open — keeps focus (and Tab/Shift+Tab cycling)
  // inside the panel, matching the WAI-ARIA dialog pattern's expectation
  // that content behind an open modal is unreachable via keyboard.
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePrint = (): void => {
    document.documentElement.setAttribute('data-print-mode', selectedMode);
    window.print();
    setIsOpen(false);
  };

  return (
    <>
      <div className="print-options-trigger">
        <Tooltip
          id="print-options-tooltip"
          className="print-options-tooltip"
          content="Choose what to print."
        >
          <button
            ref={triggerRef}
            type="button"
            className="print-options-trigger__button"
            aria-label="Choose what to print"
            aria-haspopup="dialog"
            onClick={() => setIsOpen(true)}
          >
            <PrintIcon />
          </button>
        </Tooltip>
      </div>
      <div
        className={['print-options__backdrop', isOpen && 'print-options__backdrop--open']
          .filter(Boolean)
          .join(' ')}
        aria-hidden={!isOpen}
        role="presentation"
        // Light-dismiss: a click only closes when it lands on the backdrop
        // itself (currentTarget), not when it bubbles up from something
        // inside the panel — so no separate click handler (and matching
        // jsx-a11y warnings) is needed on the panel just to stop it.
        onClick={(event) => {
          if (event.target === event.currentTarget) setIsOpen(false);
        }}
      >
        {/* A real <dialog> can't be faded on close without @starting-style —
            see index.scss's opacity/visibility transition — so this stays a
            styled div with an explicit ARIA dialog role instead. */}
        <div
          ref={panelRef}
          className="print-options__panel"
          role="dialog" // oxlint-disable-line jsx-a11y/prefer-tag-over-role
          aria-modal="true"
          aria-labelledby="print-options-title"
          tabIndex={-1}
        >
          <button
            type="button"
            className="dismiss-button print-options__dismiss"
            aria-label="Close print options"
            onClick={() => setIsOpen(false)}
          >
            <span aria-hidden="true">&times;</span>
          </button>
          <h2 id="print-options-title" className="print-options__title">
            Choose what to print
          </h2>
          <fieldset className="print-options__fieldset">
            <legend className="print-options__legend">Print detail level</legend>
            {PRINT_MODES.map((mode) => (
              <label key={mode.value} className="print-options__option">
                <input
                  type="radio"
                  name="print-mode"
                  className="print-options__option-input"
                  value={mode.value}
                  checked={selectedMode === mode.value}
                  onChange={() => setSelectedMode(mode.value)}
                />
                <span className="print-options__option-text">
                  <span className="print-options__option-label">{mode.label}</span>
                  {mode.description && (
                    <span className="print-options__option-description">{mode.description}</span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
          <button type="button" className="print-options__confirm" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>
    </>
  );
};

export default PrintOptions;
