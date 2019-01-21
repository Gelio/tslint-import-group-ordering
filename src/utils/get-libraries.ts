import { readdirSync, existsSync } from 'fs';

import { nodejsModules } from './nodejs-modules';

const nodeModulesPath = 'node_modules';

export function getLibraries() {
  return [...getNodeModules(), ...nodejsModules].map(
    name => new RegExp(`^${name}`)
  );
}

function getNodeModules() {
  if (!existsSync(nodeModulesPath)) {
    return [];
  }

  return readdirSync(nodeModulesPath);
}
