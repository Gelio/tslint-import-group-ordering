import { readdirSync, existsSync } from 'fs';

import { nodejsModules } from './nodejs-modules';

const nodeModulesPath = 'node_modules';

export const getNodeJsModulesRegExps = () =>
  nodejsModules.map(regExpMatchingPrefixFactory);

export const getNodeModulesRegExps = () =>
  getNodeModules().map(regExpMatchingPrefixFactory);

function getNodeModules() {
  if (!existsSync(nodeModulesPath)) {
    return [];
  }

  return readdirSync(nodeModulesPath);
}

const regExpMatchingPrefixFactory = (prefix: string) =>
  new RegExp(`^${prefix}`);
