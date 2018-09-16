import { ImportDeclaration, SourceFile } from 'typescript';

import { IOptions, ImportsGroupType, ImportsGroup } from './types';
import {
  GuardedNodesContainer,
  NodesContainer,
  Predicate
} from '../nodes-containers';
import { getLibraries } from '../utils/get-libraries';

export function createGuardedNodesContainers(
  options: IOptions,
  sourceFile: SourceFile
): GuardedNodesContainer<ImportDeclaration>[] {
  return options.importsGroups.map(importsGroup => {
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
    regExp.test(node.moduleSpecifier.getText(sourceFile))
  );

const isThirdPartyImportDeclaration = isThirdPartyImportDeclarationFactory(
  getLibraries()
);

const importDeclarationMatchesRegExpFactory = (
  sourceFile: SourceFile,
  regExp: RegExp
): Predicate<ImportDeclaration> => node =>
  regExp.test(node.getText(sourceFile));
