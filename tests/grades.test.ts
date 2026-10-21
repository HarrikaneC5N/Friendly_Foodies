import { describe, expect, it } from 'vitest';
import { calculateVenueGrade } from '../src/lib/grades';

describe('grades à deux niveaux', () => {
  it('ne surpondère pas un auteur ayant plusieurs visites', () => {
    const result = calculateVenueGrade([
      ...Array.from({ length: 5 }, () => ({ authorId: 'alice', grade: 'S' as const })),
      { authorId: 'bob', grade: 'C' as const },
    ]);
    expect(result?.score).toBe(2.5);
    expect(result?.contributors).toBe(2);
  });
  it('ne génère pas de note quand il n’existe aucune visite', () => {
    expect(calculateVenueGrade([])).toBeNull();
  });
});
