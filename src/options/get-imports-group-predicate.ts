import { SourceFile, ImportDeclaration } from 'typescript';

import {
  MatchingRuleConfig,
  ImportsGroupType,
  DependenciesMatchingRuleConfig,
  ProjectMatchingRuleConfig
} from './types';
import { Predicate } from '../nodes-containers';
import {
  getNodeJsModulesRegExps,
  getNodeModulesRegExps,
  getPackageJsonDependenciesRegExps
} from '../utils/get-dependencies-reg-exps';
import { removeQuotes } from '../utils/remove-quotes';

export function getImportsGroupPredicate(
  sourceFile: SourceFile,
  matchingRuleConfig: MatchingRuleConfig
): Predicate<ImportDeclaration> {
  if (matchingRuleConfig.type === ImportsGroupType.Dependencies) {
    return getDependenciesImportsGroupPredicate(sourceFile, matchingRuleConfig);
  }

  return getProjectImportsGroupPredicate(sourceFile, matchingRuleConfig);
}

const getProjectImportsGroupPredicate = (
  sourceFile: SourceFile,
  matchingRuleConfig: ProjectMatchingRuleConfig
) =>
  importDeclarationMatchesRegExpsFactory(sourceFile, [
    new RegExp(matchingRuleConfig.matches)
  ]);

function getDependenciesImportsGroupPredicate(
  sourceFile: SourceFile,
  matchingRuleConfig: DependenciesMatchingRuleConfig
) {
  const regExps = matchingRuleConfig['from-package.json']
    ? getPackageJsonDependenciesRegExps()
    : getNodeModulesRegExps();

  if (!matchingRuleConfig['disable-native-nodejs-modules']) {
    regExps.push(...getNodeJsModulesRegExps());
  }

  return importDeclarationMatchesRegExpsFactory(sourceFile, regExps);
}

const importDeclarationMatchesRegExpsFactory = (
  sourceFile: SourceFile,
  regExps: RegExp[]
): Predicate<ImportDeclaration> => node =>
  regExps.some(regExp => regExp.test(getModuleSpecifier(sourceFile, node)));

function getModuleSpecifier(sourceFile: SourceFile, node: ImportDeclaration) {
  return removeQuotes(node.moduleSpecifier.getText(sourceFile));
}
