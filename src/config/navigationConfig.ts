export type NavTabId = 'HOME' | 'PRODUCTS' | 'PROJECTS' | 'ABOUT' | 'CONTACT' | 'FUN';

export interface NavItem {
  id: NavTabId;
  label: string;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'HOME', label: 'home', path: '/' },
  { id: 'PRODUCTS', label: 'products', path: '/products' },
  { id: 'PROJECTS', label: 'projects', path: '/projects' },
  { id: 'ABOUT', label: 'about me', path: '/about' },
  { id: 'CONTACT', label: 'contact', path: '/contact' },
  { id: 'FUN', label: 'fun', path: '/fun' },
];
