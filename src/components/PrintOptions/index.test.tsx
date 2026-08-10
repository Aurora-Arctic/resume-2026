import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import PrintOptions from '.';

const openModal = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Choose what to print' }));
};

describe('PrintOptions', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-print-mode');
  });

  // window.print is shared across every test in this file (jsdom's window
  // isn't recreated per test) — without restoring it, a later test's
  // vi.spyOn wraps the *previous* test's still-active mock instead of a
  // clean window.print, inheriting its call count. Also restore the URL
  // after tests that modify window.location.
  afterEach(() => {
    window.history.pushState({}, '', '/');
    vi.restoreAllMocks();
  });

  it('renders a trigger button with the expected aria-label', () => {
    render(<PrintOptions />);

    expect(screen.getByRole('button', { name: 'Choose what to print' })).toBeInTheDocument();
  });

  it('is closed by default', () => {
    render(<PrintOptions />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the modal when the trigger is clicked', () => {
    render(<PrintOptions />);

    openModal();

    expect(screen.getByRole('dialog', { name: 'Choose what to print' })).toBeInTheDocument();
  });

  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Cmd', { metaKey: true }],
  ])('opens the modal and prevents the native print dialog on %s+P', (_label, modifier) => {
    render(<PrintOptions />);

    // A raw window.dispatchEvent isn't wrapped in act() the way fireEvent's
    // own dispatch is, so the resulting setIsOpen(true) can still be
    // pending when the assertions below run — fireEvent(window, event)
    // dispatches this same event object (so defaultPrevented is still
    // readable off it afterwards) while flushing synchronously.
    const event = new KeyboardEvent('keydown', { key: 'p', cancelable: true, ...modifier });
    fireEvent(window, event);

    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not open on a plain "p" keypress without a modifier', () => {
    render(<PrintOptions />);

    fireEvent(window, new KeyboardEvent('keydown', { key: 'p' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes without printing on Escape', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<PrintOptions />);
    openModal();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(printSpy).not.toHaveBeenCalled();
  });

  it('closes without printing on backdrop click', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<PrintOptions />);
    openModal();

    const backdrop = document.querySelector('.print-options__backdrop');
    fireEvent.click(backdrop as Element);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(printSpy).not.toHaveBeenCalled();
  });

  it('does not close when clicking inside the panel itself', () => {
    render(<PrintOptions />);
    openModal();

    fireEvent.click(screen.getByRole('dialog'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on the dismiss button without printing', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<PrintOptions />);
    openModal();

    fireEvent.click(screen.getByRole('button', { name: 'Close print options' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(printSpy).not.toHaveBeenCalled();
  });

  it('defaults to the full-detail tier and prints it when confirmed without changing the selection', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<PrintOptions />);
    openModal();

    expect(screen.getByRole('radio', { name: /^Full/ })).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Print' }));

    expect(document.documentElement.getAttribute('data-print-mode')).toBe('full');
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('sets data-print-mode to the selected tier and prints on confirm', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<PrintOptions />);
    openModal();

    fireEvent.click(screen.getByRole('radio', { name: /^Minimal/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Print' }));

    expect(document.documentElement.getAttribute('data-print-mode')).toBe('minimal');
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each([
    ['All contents.'],
    ['A condensed version, trimmed to the highlights.'],
    ['Just the essentials.'],
    ['Summary details in a plain, linear layout.'],
  ])('shows the description %s', (description) => {
    render(<PrintOptions />);
    openModal();

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('clears data-print-mode once the browser finishes printing', () => {
    vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<PrintOptions />);
    openModal();
    fireEvent.click(screen.getByRole('button', { name: 'Print' }));
    expect(document.documentElement.getAttribute('data-print-mode')).toBe('full');

    fireEvent(window, new Event('afterprint'));

    expect(document.documentElement.getAttribute('data-print-mode')).toBeNull();
  });

  it('returns focus to the trigger button when the modal closes', () => {
    render(<PrintOptions />);
    const trigger = screen.getByRole('button', { name: 'Choose what to print' });

    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(trigger).toHaveFocus();
  });

  it('has aria-haspopup and is marked aria-hidden until opened', () => {
    render(<PrintOptions />);

    expect(screen.getByRole('button', { name: 'Choose what to print' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
    expect(document.querySelector('.print-options__backdrop')).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    openModal();

    expect(document.querySelector('.print-options__backdrop')).toHaveAttribute(
      'aria-hidden',
      'false',
    );
    expect(document.querySelector('.print-options__backdrop')).toHaveClass(
      'print-options__backdrop--open',
    );
  });

  it('traps Tab focus inside the panel, wrapping from the last control back to the first', () => {
    render(<PrintOptions />);
    openModal();

    const dismiss = screen.getByRole('button', { name: 'Close print options' });
    const confirm = screen.getByRole('button', { name: 'Print' });
    confirm.focus();

    fireEvent.keyDown(window, { key: 'Tab' });

    expect(dismiss).toHaveFocus();
  });

  it('traps Shift+Tab focus inside the panel, wrapping from the first control back to the last', () => {
    render(<PrintOptions />);
    openModal();

    const dismiss = screen.getByRole('button', { name: 'Close print options' });
    const confirm = screen.getByRole('button', { name: 'Print' });
    dismiss.focus();

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });

    expect(confirm).toHaveFocus();
  });

  it('removes its window listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<PrintOptions />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('afterprint', expect.any(Function));
  });

  it.each([
    ['summary', 'Summary'],
    ['minimal', 'Minimal'],
    ['application', 'Application'],
  ])(
    'simulates the %s tier via ?printMode=%s query param without printing',
    (tierValue, tierLabel) => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      window.history.pushState({}, '', `/?printMode=${tierValue}`);

      render(<PrintOptions />);

      expect(document.documentElement.getAttribute('data-print-mode')).toBe(tierValue);
      expect(printSpy).not.toHaveBeenCalled();

      openModal();
      expect(screen.getByRole('radio', { name: new RegExp(`^${tierLabel}`) })).toBeChecked();
    },
  );

  it('does not set data-print-mode for an absent ?printMode param', () => {
    render(<PrintOptions />);

    expect(document.documentElement.getAttribute('data-print-mode')).toBeNull();
  });

  it.each(['bogus', 'invalid'])(
    'does not set data-print-mode for invalid ?printMode=%s',
    (invalidValue) => {
      window.history.pushState({}, '', `/?printMode=${invalidValue}`);

      render(<PrintOptions />);

      expect(document.documentElement.getAttribute('data-print-mode')).toBeNull();
    },
  );

  it('simulates the full tier via ?printMode=full query param without printing', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    window.history.pushState({}, '', '/?printMode=full');

    render(<PrintOptions />);

    expect(document.documentElement.getAttribute('data-print-mode')).toBe('full');
    expect(printSpy).not.toHaveBeenCalled();

    openModal();
    expect(screen.getByRole('radio', { name: /^Full/ })).toBeChecked();
  });

  it('shows a simulated tier in the modal radio selection when opened', () => {
    window.history.pushState({}, '', '/?printMode=minimal');
    render(<PrintOptions />);

    openModal();

    expect(screen.getByRole('radio', { name: /^Minimal/ })).toBeChecked();
  });
});
