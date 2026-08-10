import { describe, it, expect } from 'vitest';
import { classNames } from './classNames';

describe('classNames', () => {
  it('returns empty string for all-falsy values', () => {
    expect(classNames(false, null, undefined)).toBe('');
  });

  it('returns single class for one truthy value', () => {
    expect(classNames('a')).toBe('a');
  });

  it('joins multiple truthy values with single space', () => {
    expect(classNames('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values and joins remaining', () => {
    expect(classNames('a', false, 'b', null, 'c', undefined)).toBe('a b c');
  });

  it('handles mixed empty and non-empty strings', () => {
    expect(classNames('active', '', 'focus')).toBe('active focus');
  });

  it('handles all truthy values (no falsy entries)', () => {
    expect(classNames('a', 'b', 'c')).toBe('a b c');
  });
});
