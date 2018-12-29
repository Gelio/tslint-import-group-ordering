import { ImportDeclaration, SourceFile } from 'typescript';

import { Options, ImportsGroupType, ImportsGroup } from './types';
import {
  GuardedNodesContainer,
  NodesContainer,
  Predicate
} from '../nodes-containers';
import { getLibraries } from '../utils/get-libraries';
import { removeQuotes } from '../utils/remove-quotes';

const catchAllImportGroup: ImportsGroup = {
  type: ImportsGroupType.Project,
  regExp: /.*/
};

export function createGuardedNodesContainers(
  options: Options,
  sourceFile: SourceFile
): GuardedNodesContainer<ImportDeclaration>[] {
  return options.importsGroups.concat(catchAllImportGroup).map(importsGroup => {
    const nodesContainer = new NodesContainer<ImportDeclaration>(sourceFile);
    const predicate = getImportsGroupPredicate(importsGroup, sourceFile);

    return new GuardedNodesContainer<ImportDeclaration>(
      nodesContainer,
      predicate
    );
  });
}

function getImportsGroupPredicate(
  importsGroup: ImportsGroup,
  sourceFile: SourceFile
): Predicate<ImportDeclaration> {
  if (importsGroup.type === ImportsGroupType.ThirdParty) {
    return isThirdPartyImportDeclaration(sourceFile);
  }

  return importDeclarationMatchesRegExpFactory(sourceFile, importsGroup.regExp);
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
