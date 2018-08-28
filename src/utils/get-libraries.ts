import { readdirSync } from 'fs';

import { nodejsModules } from './nodejs-modules';

export function getLibraries() {
  return [...readdirSync('node_modules'), ...nodejsModules].map(
    name => new RegExp(`^${name}`)
  );
}
