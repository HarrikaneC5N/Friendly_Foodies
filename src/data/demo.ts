import type { Grade } from '../lib/grades';

/** Jeu de données fictif pour la maquette interactive ; ne représente aucun avis réel. */
export interface DemoPost {
  id: string;
  authorId: string;
  author: string;
  grade: Grade;
  text: string;
  visit: string;
  visibility: 'public' | 'friends';
  visual: number;
}
export interface DemoPlace {
  id: string;
  name: string;
  subtitle: string;
  categories: string[];
  coordinates: [number, number];
  posts: DemoPost[];
  visual: number;
}
export const places: DemoPlace[] = [
  { id: 'cafe-loustic-demo', name: 'Café des Amis', subtitle: 'Le Marais · Paris', categories: ['Café', 'Pâtisserie'], coordinates: [2.3539, 48.8625], visual: 0, posts: [
    { id: 'p1', authorId: 'lucie', author: 'Lucie', grade: 'S', text: 'Le meilleur moment de notre balade gourmande, et les desserts sont magnifiques !', visit: 'Octobre 2026', visibility: 'public', visual: 0 },
    { id: 'p2', authorId: 'thomas', author: 'Thomas', grade: 'A', text: 'Très belle pause et super accueil.', visit: 'Juin 2026', visibility: 'public', visual: 1 },
    { id: 'p3', authorId: 'lucie', author: 'Lucie', grade: 'B', text: 'C’était sympa, un peu plus de monde cette fois.', visit: 'Février 2026', visibility: 'friends', visual: 2 },
  ] },
  { id: 'osteria-demo', name: 'Osteria Verde', subtitle: 'Saint-Germain · Paris', categories: ['Restaurant', 'Italien'], coordinates: [2.3362, 48.8501], visual: 1, posts: [
    { id: 'p4', authorId: 'marie', author: 'Marie', grade: 'S', text: 'De magnifiques assiettes, des produits frais et une ambiance chaleureuse.', visit: 'Septembre 2026', visibility: 'public', visual: 3 },
    { id: 'p5', authorId: 'tom', author: 'Tom', grade: 'A', text: 'Un très bon dîner.', visit: 'Avril 2026', visibility: 'public', visual: 1 },
  ] },
  { id: 'banh-mi-demo', name: 'Bánh Mì Atelier', subtitle: 'République · Paris', categories: ['Street-food', 'Asiatique'], coordinates: [2.3634, 48.8691], visual: 2, posts: [
    { id: 'p6', authorId: 'thomas', author: 'Thomas', grade: 'A', text: 'Un super déjeuner sur le pouce.', visit: 'Août 2026', visibility: 'public', visual: 2 },
  ] },
  { id: 'boulangerie-demo', name: 'Le Fournil Fleuri', subtitle: 'Montmartre · Paris', categories: ['Boulangerie', 'Pâtisserie'], coordinates: [2.3403, 48.8834], visual: 3, posts: [
    { id: 'p7', authorId: 'tom', author: 'Tom', grade: 'B', text: 'Une boulangerie agréable et de bons croissants.', visit: 'Juillet 2026', visibility: 'public', visual: 3 },
  ] },
  { id: 'marche-demo', name: 'Le Marché Gourmand', subtitle: 'Bastille · Paris', categories: ['Marché', 'Street-food'], coordinates: [2.3739, 48.8535], visual: 4, posts: [
    { id: 'p8', authorId: 'lucie', author: 'Lucie', grade: 'S', text: 'Une adresse pleine de surprises.', visit: 'Mars 2026', visibility: 'public', visual: 4 },
  ] },
];
