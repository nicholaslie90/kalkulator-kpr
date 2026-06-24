// Generate a short, unique-enough id for client-side records (banks, tiers, etc.).
// Lives in a plain util (not a component/hook) so the impure Date.now()/Math.random()
// calls are isolated from React's purity rules.
export const genId = (prefix = ''): string =>
  prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
