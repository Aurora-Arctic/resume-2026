import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Tooltip, { TOOLTIP_STORAGE_KEY, TOOLTIP_RESTORE_EVENT } from '.';

describe('Tooltip', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the trigger and associates it with the tooltip via aria-describedby', () => {
    render(
      <Tooltip id="test-tooltip" content="Helpful info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const tooltip = screen.getByRole('tooltip');

    expect(trigger).toHaveAttribute('aria-describedby', 'test-tooltip');
    expect(tooltip).toHaveAttribute('id', 'test-tooltip');
    expect(tooltip).toHaveTextContent('Helpful info');
  });

  it("preserves the trigger's existing children alongside the tooltip", () => {
    render(
      <Tooltip id="icon-tooltip" content="Info">
        <button type="button">
          <span>Icon</span>
        </button>
      </Tooltip>,
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
  });

  it('merges an existing className with the tooltip-trigger hook class', () => {
    render(
      <Tooltip id="classy-tooltip" content="Info">
        <button type="button" className="existing-class">
          Trigger
        </button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    expect(trigger).toHaveClass('existing-class', 'tooltip-trigger');
  });

  it('renders a dismiss button inside the tooltip bubble', () => {
    render(
      <Tooltip id="dismiss-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    const dismissButton = screen.getByRole('button', { name: 'Dismiss tooltip' });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toContainElement(dismissButton);
  });

  it('dismissing persists the id into the shared cleared-ids list and applies the cleared class', () => {
    render(
      <Tooltip id="dismiss-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss tooltip' }));

    const stored: unknown = JSON.parse(window.localStorage.getItem(TOOLTIP_STORAGE_KEY) ?? '[]');
    expect(stored).toEqual(['dismiss-tooltip']);
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveClass('tooltip--cleared');
  });

  it('dismissing a second, unrelated tooltip adds to the list rather than replacing it', () => {
    window.localStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify(['already-cleared']));

    render(
      <Tooltip id="dismiss-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss tooltip' }));

    const stored: unknown = JSON.parse(window.localStorage.getItem(TOOLTIP_STORAGE_KEY) ?? '[]');
    expect(stored).toEqual(['already-cleared', 'dismiss-tooltip']);
  });

  it('starts cleared on mount when a previous dismissal was already persisted', async () => {
    window.localStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify(['seeded-tooltip']));

    render(
      <Tooltip id="seeded-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    expect(await screen.findByRole('tooltip')).toHaveClass('tooltip--cleared');
  });

  it('treats corrupted (non-array) stored JSON as no dismissals rather than throwing', async () => {
    window.localStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify({ not: 'an array' }));

    render(
      <Tooltip id="corrupted-storage-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    expect(await screen.findByRole('tooltip')).not.toHaveClass('tooltip--cleared');
  });

  it('dismissing a tooltip whose id is already in the cleared list does not duplicate it', () => {
    window.localStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify(['dismiss-tooltip']));

    render(
      <Tooltip id="dismiss-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss tooltip' }));

    const stored: unknown = JSON.parse(window.localStorage.getItem(TOOLTIP_STORAGE_KEY) ?? '[]');
    expect(stored).toEqual(['dismiss-tooltip']);
  });

  it('restores a cleared tooltip when the restore event fires', async () => {
    window.localStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify(['restorable-tooltip']));

    render(
      <Tooltip id="restorable-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    expect(await screen.findByRole('tooltip')).toHaveClass('tooltip--cleared');

    fireEvent(window, new Event(TOOLTIP_RESTORE_EVENT));

    expect(screen.getByRole('tooltip')).not.toHaveClass('tooltip--cleared');
  });

  it('skips refocusing when the tooltip bubble has no HTMLElement sibling to return focus to', () => {
    render(
      <Tooltip id="non-html-sibling-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    // Insert a non-HTMLElement (SVGElement) directly before the bubble, so
    // `bubble.previousElementSibling` fails the `instanceof HTMLElement`
    // guard — exercising the branch without disturbing React's own fiber
    // references to the trigger/bubble nodes.
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    trigger.insertAdjacentElement(
      'afterend',
      document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss tooltip' }));

    expect(document.activeElement).not.toBe(trigger);
  });

  it('stops the dismiss click from propagating', () => {
    render(
      <Tooltip id="propagation-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    const dismissButton = screen.getByRole('button', { name: 'Dismiss tooltip' });
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

    dismissButton.dispatchEvent(clickEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('returns focus to the trigger after dismissing', () => {
    render(
      <Tooltip id="focus-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss tooltip' }));

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Trigger' }));
  });

  it('force-hides the tooltip immediately on dismiss, even though it returns focus to the (still-hovered) trigger in the same click', () => {
    render(
      <Tooltip id="force-hide-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss tooltip' }));

    // The refocus-to-trigger side effect of dismiss fires the trigger's own
    // onFocus synchronously; this only stays hidden if that doesn't
    // immediately undo the force-hide (see suppressNextTriggerFocusRef).
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveStyle({
      opacity: 0,
      visibility: 'hidden',
      transition: 'none',
    });
  });

  it('disables the transition on force-hide, so a still-matching transition-delay rule cannot stall the hide', () => {
    // Regression test: jsdom never runs real CSS transitions, so this only
    // asserts the inline style itself, not rendered timing — see
    // TOOLTIP.md's "Force-hide must also kill the transition" for why the
    // transition override is necessary in a real browser. At the instant of
    // dismiss the bubble still matches `.tooltip.tooltip--cleared:hover`
    // (cleared just became true while still hovered), which sets a 1s
    // transition-delay in index.scss; without `transition: 'none'` here,
    // opacity/visibility would still win on value but inherit that rule's
    // delay, leaving the tooltip visibly stuck open for a second.
    render(
      <Tooltip id="force-hide-transition-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss tooltip' }));

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveStyle({ transition: 'none' });
  });

  it('clears the force-hide once the trigger is hovered again', () => {
    render(
      <Tooltip id="force-hide-hover-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss tooltip' }));
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveStyle({
      opacity: 0,
      visibility: 'hidden',
    });

    fireEvent.mouseEnter(trigger);

    expect(screen.getByRole('tooltip')).toHaveAttribute('style', '');
  });

  it('clears the force-hide once the trigger is genuinely refocused (not the dismiss-triggered one)', () => {
    render(
      <Tooltip id="force-hide-focus-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss tooltip' }));
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveStyle({
      opacity: 0,
      visibility: 'hidden',
    });

    fireEvent.blur(trigger);
    fireEvent.focus(trigger);

    expect(screen.getByRole('tooltip')).toHaveAttribute('style', '');
  });

  it('clears the force-hide when the restore event fires', () => {
    render(
      <Tooltip id="force-hide-restore-tooltip" content="Info">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss tooltip' }));
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveStyle({
      opacity: 0,
      visibility: 'hidden',
    });

    fireEvent(window, new Event(TOOLTIP_RESTORE_EVENT));

    expect(screen.getByRole('tooltip')).toHaveAttribute('style', '');
  });
});
