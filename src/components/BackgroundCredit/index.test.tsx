import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BackgroundCredit from '.';

describe('BackgroundCredit', () => {
  it('opts its attribution link out of the print URL reveal', () => {
    render(<BackgroundCredit />);

    expect(screen.getByRole('link', { name: 'Subtle Patterns' })).toHaveClass('print-hide-url');
  });
});
