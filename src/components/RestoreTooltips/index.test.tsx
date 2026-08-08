import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import RestoreTooltips from '.';
import Tooltip, { TOOLTIP_STORAGE_KEY } from '../Tooltip';

describe('RestoreTooltips', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders a button with the expected label', () => {
    render(<RestoreTooltips />);

    expect(screen.getByRole('button', { name: 'I Need Tooltips' })).toBeInTheDocument();
  });

  it('removes the cleared-tooltips key on click but leaves unrelated keys untouched', () => {
    window.localStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify(['some-tooltip']));
    window.localStorage.setItem('theme', 'light');

    render(<RestoreTooltips />);
    fireEvent.click(screen.getByRole('button', { name: 'I Need Tooltips' }));

    expect(window.localStorage.getItem(TOOLTIP_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem('theme')).toBe('light');
  });

  it('restores an already-mounted cleared tooltip without a reload', async () => {
    window.localStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify(['restore-me']));

    render(
      <>
        <Tooltip id="restore-me" content="Info">
          <button type="button">Trigger</button>
        </Tooltip>
        <RestoreTooltips />
      </>,
    );

    expect(await screen.findByRole('tooltip')).toHaveClass('tooltip--cleared');

    fireEvent.click(screen.getByRole('button', { name: 'I Need Tooltips' }));

    expect(screen.getByRole('tooltip')).not.toHaveClass('tooltip--cleared');
  });
});
