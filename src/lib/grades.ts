export const GRADES = ['C', 'B', 'A', 'S'] as const;
export type Grade = (typeof GRADES)[number];
export const gradeValue: Record<Grade, number> = { C: 1, B: 2, A: 3, S: 4 };
export const gradeLabels: Record<Grade, string> = {
  C: 'Décevant', B: 'Correct', A: 'Excellent', S: 'Exceptionnel',
};

/**
 * PROVISOIRE : échelle et arrondi à confirmer avant mise en production.
 * Chaque auteur compte pour UN vote par établissement, même s'il publie 20 fois.
 * Pour l'agrégat visible par un visiteur, ne considérer que les posts publics.
 */
export function calculateVenueGrade(posts: { authorId: string; grade: Grade }[]) {
  if (posts.length === 0) return null;
  const perAuthor = new Map<string, number[]>();
  for (const post of posts) {
    const grades = perAuthor.get(post.authorId) ?? [];
    grades.push(gradeValue[post.grade]);
    perAuthor.set(post.authorId, grades);
  }
  const averages = [...perAuthor.values()].map((values) =>
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
  const score = averages.reduce((sum, value) => sum + value, 0) / averages.length;
  return { score, grade: GRADES[Math.max(0, Math.min(3, Math.round(score) - 1))], contributors: averages.length };
}
