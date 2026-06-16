import { describe, expect, it } from 'vitest';

import { getAge } from '../../src/utils/get-age.js';

describe('getAge', () => {
  it('returns 0 for a baby born today', () => {
    const age = getAge(new Date());
    expect(age).toBe(0);
  });

  it('returns correct age when birthday has already passed this year', () => {
    const birth = new Date(2000, 0, 15);
    const age = getAge(birth);
    const expected = new Date().getFullYear() - 2000;
    expect(age).toBe(expected);
  });

  it('returns correct age when birthday is later this year', () => {
    const birth = new Date(2000, 11, 31);
    const age = getAge(birth);
    const today = new Date();
    const expected =
      today.getMonth() > 11 || (today.getMonth() === 11 && today.getDate() >= 31)
        ? today.getFullYear() - 2000
        : today.getFullYear() - 2000 - 1;
    expect(age).toBe(expected);
  });

  it('returns correct age on the birthday itself', () => {
    const today = new Date();
    const birth = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    const age = getAge(birth);
    expect(age).toBe(25);
  });

  it('returns correct age the day before birthday', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const birth = new Date(today.getFullYear() - 30, yesterday.getMonth(), yesterday.getDate());
    const age = getAge(birth);
    expect(age).toBe(30);
  });
});
