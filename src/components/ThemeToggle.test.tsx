import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    window.localStorage.clear();
  });

  it('renders an accessible toggle button', () => {
    render(<ThemeToggle />);

    expect(
      screen.getByRole('button', { name: 'Toggle light and dark mode for the paper' }),
    ).toBeInTheDocument();
  });

  it('switches to light mode on click, setting the attribute and storage', () => {
    render(<ThemeToggle />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle light and dark mode for the paper' }),
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(window.localStorage.getItem('theme')).toBe('light');
  });

  it('switches back to dark mode on a second click, clearing the attribute', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Toggle light and dark mode for the paper' });

    fireEvent.click(button);
    fireEvent.click(button);

    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    expect(window.localStorage.getItem('theme')).toBe('dark');
  });

  it('updates aria-pressed to reflect the current mode', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Toggle light and dark mode for the paper' });

    expect(button).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });
});
