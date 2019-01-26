import { SourceFile, ImportDeclaration } from 'typescript';

import {
  RuleConfig,
  ImportsGroupConfig,
  ImportsGroup,
  MatchingRuleConfig,
  MatchingRule,
  ImportsGroupType
} from './types';
import { NodesContainer, Predicate } from '../nodes-containers';
import { getLibraries } from '../utils/get-libraries';
import { removeQuotes } from '../utils/remove-quotes';

export function parseRuleConfig(
  sourceFile: SourceFile,
  ruleConfig: RuleConfig
) {
  const importsGroups = parseImportsGroups(
    sourceFile,
    ruleConfig['imports-groups']
  );

  const matchingRules = parseMatchingRuleConfigs(
    sourceFile,
    importsGroups,
    ruleConfig['matching-rules']
  );

  return {
    importsGroups,
    matchingRules
  };
}

function parseImportsGroups(
  sourceFile: SourceFile,
  importsGroupConfigs: ImportsGroupConfig[]
) {
  if (!importsGroupConfigs) {
    throw new Error('Invalid rule configuration. Imports groups are required.');
  }

  const encounteredImportsGroupsNames: Record<string, string> = {};

  return importsGroupConfigs.map(
    (importsGroupConfig, index): ImportsGroup => {
      if (encounteredImportsGroupsNames[importsGroupConfig.name]) {
        throw new Error(
          `Duplicated imports group. An imports group with the name ${
            importsGroupConfig.name
          } appears at least twice in the config.`
        );
      }

      return {
        name: importsGroupConfig.name,
        nodesContainer: new NodesContainer(sourceFile),
        orderNumber: index + 1
      };
    }
  );
}

function parseMatchingRuleConfigs(
  sourceFile: SourceFile,
  importsGroups: ImportsGroup[],
  matchingRuleConfigs: MatchingRuleConfig[]
) {
  if (!matchingRuleConfigs) {
    throw new Error('Invalid rule configuration. Matching rules are required.');
  }

  return matchingRuleConfigs.map(
    (matchingRuleConfig): MatchingRule => {
      const foundImportsGroup = importsGroups.find(
        importsGroup =>
          importsGroup.name === matchingRuleConfig['imports-group']
      );

      if (!foundImportsGroup) {
        throw new Error(
          `Imports group "${
            matchingRuleConfig['imports-group']
          }" has not been configured, yet a rule that targets that imports group exists.`
        );
      }

      return {
        importsGroup: foundImportsGroup,
        matches: getImportsGroupPredicate(sourceFile, matchingRuleConfig)
      };
    }
  );
}

function getImportsGroupPredicate(
  sourceFile: SourceFile,
  matchingRuleConfig: MatchingRuleConfig
): Predicate<ImportDeclaration> {
  if (matchingRuleConfig.type === ImportsGroupType.Dependencies) {
    return isThirdPartyImportDeclaration(sourceFile);
  }

  return importDeclarationMatchesRegExpFactory(
    sourceFile,
    new RegExp(matchingRuleConfig.matches)
  );
}

const isThirdPartyImportDeclarationFactory = (thirdPartyRegExps: RegExp[]) => (
  sourceFile: SourceFile
): Predicate<ImportDeclaration> => node =>
  thirdPartyRegExps.some(regExp =>
    regExp.test(getModuleSpecifier(sourceFile, node))
  );

const isThirdPartyImportDeclaration = isThirdPartyImportDeclarationFactory(
  getLibraries()
);

const importDeclarationMatchesRegExpFactory = (
  sourceFile: SourceFile,
  regExp: RegExp
): Predicate<ImportDeclaration> => node =>
  regExp.test(getModuleSpecifier(sourceFile, node));

function getModuleSpecifier(sourceFile: SourceFile, node: ImportDeclaration) {
  return removeQuotes(node.moduleSpecifier.getText(sourceFile));
}
