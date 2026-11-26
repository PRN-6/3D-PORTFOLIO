import type { NavTabId } from './config/navigationConfig';
import type { DestinationId } from './components/Scene/Transitions/explodedConfig';
import type { WorldState } from './components/Scene/Scene';

export interface RouteConfig {
  path: string;
  tabId: NavTabId;
  destination: DestinationId;
  worldState: WorldState;
  title: string;
  description: string;
  isModal?: boolean;
}

export const ROUTES: Record<NavTabId, RouteConfig> = {
  HOME: {
    path: '/',
    tabId: 'HOME',
    destination: 'HOME',
    worldState: 'HOME_IDLE',
    title: "PRINSON — Hero's Home & 3D Portfolio",
    description: "An interactive 3D fantasy RPG portfolio featuring the Hero's Home floating island.",
  },
  PRODUCTS: {
    path: '/products',
    tabId: 'PRODUCTS',
    destination: 'WORKSHOP',
    worldState: 'WORKSHOP_WORLD',
    title: "Products — Rune Workshop | PRINSON",
    description: "Explore interactive 3D products and digital artifacts crafted in the Rune Workshop.",
  },
  PROJECTS: {
    path: '/projects',
    tabId: 'PROJECTS',
    destination: 'ARCHIVE',
    worldState: 'ARCHIVE_WORLD',
    title: "Projects — Grand Mage's Archive | PRINSON",
    description: "Browse software engineering projects, web applications, and technical innovations by Prinson.",
  },
  ABOUT: {
    path: '/about',
    tabId: 'ABOUT',
    destination: 'FOREST',
    worldState: 'FOREST_WORLD',
    title: "About Me — Blue Flower Garden | PRINSON",
    description: "Explore the eternal blue flower meadow with Himmel & Frieren, celebrating memory, companionship, and craftsmanship.",
  },
  CONTACT: {
    path: '/contact',
    tabId: 'CONTACT',
    destination: 'HOME',
    worldState: 'HOME_IDLE',
    title: "Contact — Get In Touch | PRINSON",
    description: "Reach out to Prinson for software engineering, design, and collaborations.",
    isModal: true,
  },
  FUN: {
    path: '/fun',
    tabId: 'FUN',
    destination: 'HOME',
    worldState: 'HOME_IDLE',
    title: "The Scales of Battle | PRINSON",
    description: "Frieren, Himmel, Heiter and Eisen face a horned demon in an animated miniature fantasy battlefield.",
    isModal: true,
  },
};

export const PATH_TO_TAB: Record<string, NavTabId> = {
  '/': 'HOME',
  '/products': 'PRODUCTS',
  '/projects': 'PROJECTS',
  '/about': 'ABOUT',
  '/contact': 'CONTACT',
  '/fun': 'FUN',
};

export function getRouteFromPath(pathname: string): RouteConfig {
  const normalized = (pathname.replace(/\/+$/, '') || '/').toLowerCase();
  const tabId = PATH_TO_TAB[normalized];
  if (tabId && ROUTES[tabId]) {
    return ROUTES[tabId];
  }
  return ROUTES.HOME;
}

export function updatePageSEO(route: RouteConfig) {
  if (typeof document === 'undefined') return;
  document.title = route.title;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', route.description);
}

