// nom du cookie httpOnly qui porte le jeton de session — partagé entre
// auth.controller.ts (qui le pose/le retire) et jwt.strategy.ts (qui le lit)
export const NOM_COOKIE_SESSION = 'cunicole_session';

// doit rester cohérent avec JWT_EXPIRES_IN (voir auth.module.ts) : le cookie
// ne doit pas expirer avant le jeton qu'il contient
export const DUREE_COOKIE_MS = 3650 * 24 * 60 * 60 * 1000;
