import { readdirSync, existsSync, readFileSync } from 'fs';

import { nodejsModules } from './nodejs-modules';

const nodeModulesPath = 'node_modules';
const packageJsonPath = 'package.json';

// `node:` can't start an npm package name, so every `node:` import is a
// Node.js built-in, including the ones that exist only with the prefix
// (such as `node:test`).
const nodePrefixedModulesRegExp = /^node:/;

export const getNodeJsModulesRegExps = () => [
  ...nodejsModules.map(regExpMatchingPrefixFactory),
  nodePrefixedModulesRegExp,
];

export const getNodeModulesRegExps = () =>
  getNodeModules().map(regExpMatchingPrefixFactory);

export const getPackageJsonDependenciesRegExps = () =>
  readDependenciesFromPackageJson().map(regExpMatchingPrefixFactory);

function getNodeModules() {
  if (!existsSync(nodeModulesPath)) {
    return [];
  }

  return readdirSync(nodeModulesPath);
}

function readDependenciesFromPackageJson() {
  if (!existsSync(packageJsonPath)) {
    return [];
  }

  const packageJsonContents = readFileSync(packageJsonPath, 'utf8');

  try {
    const parsedPackageJson = JSON.parse(packageJsonContents);

    const dependencies = Object.keys(parsedPackageJson.dependencies || {});
    const devDependencies = Object.keys(
      parsedPackageJson.devDependencies || {},
    );

    return [...dependencies, ...devDependencies];
  } catch (error) {
    return [];
  }
}

const regExpMatchingPrefixFactory = (prefix: string) =>
  new RegExp(`^${prefix}`);
