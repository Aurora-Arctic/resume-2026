import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Tooltip from '.';

describe('Tooltip', () => {
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
});
