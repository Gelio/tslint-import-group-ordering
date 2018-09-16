import * as Lint from 'tslint';
import * as ts from 'typescript';

import { removeQuotes } from '../utils/remove-quotes';
import { IOptions, IOptionsWithNodesContainers } from '../options/types';
import { getLibraries } from '../utils/get-libraries';

/**
 * TODO:
 * 1. Construct GuardedNodesContainers from options
 * 2. Use it (this should simplify the checking logic)
 */

export class ImportGroupsOrderingWalker extends Lint.AbstractWalker<
  IOptionsWithNodesContainers
> {
  private readonly libraries = getLibraries();
  private projectModuleImported = false;
  private currentImportOrderGroupIndex = 0;
  private allowNextImportsGroup = true;

  public walk(sourceFile: ts.SourceFile): void {
    for (const statement of sourceFile.statements) {
      this.checkStatement(statement);
    }

    if (this.failures.length > 0) {
      const importsStart = this.importGroups.getImportsStart();
      const importsEnd = this.importGroups.getImportsEnd();

      this.addFailure(
        importsStart,
        importsEnd,
        'Invalid import groups order',
        this.importGroups.getFix()
      );
    }
  }

  private checkStatement(statement: ts.Statement): void {
    if (
      /\r?\n\r?\n/.test(
        this.sourceFile.text.slice(
          statement.getFullStart(),
          statement.getStart(this.sourceFile)
        )
      )
    ) {
      this.endBlock();
    }

    if (ts.isImportDeclaration(statement)) {
      this.checkImportDeclaration(statement);
      this.allowNextImportsGroup = false;
    }
  }

  private checkImportDeclaration(node: ts.ImportDeclaration) {
    if (!ts.isStringLiteral(node.moduleSpecifier)) {
      // Ignore grammar error
      return;
    }

    const strippedModuleSpecifier = removeQuotes(node.moduleSpecifier.text);

    if (this.isLibrary(strippedModuleSpecifier)) {
      if (this.projectModuleImported) {
        this.addFailureAtNode(
          node,
          'Library imports should appear in the first imports group'
        );
      }
      this.importGroups.addLibraryImport(node);
    } else {
      this.checkProjectImportDeclaration(node, strippedModuleSpecifier);
    }
  }

  private isLibrary(moduleSpecifier: string) {
    return this.libraries.some(regex => regex.test(moduleSpecifier));
  }

  private checkProjectImportDeclaration(
    node: ts.ImportDeclaration,
    moduleSpecifier: string
  ) {
    this.projectModuleImported = true;
    const { groupsOrder } = this.options;

    const importOrderGroupIndex = groupsOrder.findIndex(regex =>
      regex.test(moduleSpecifier)
    );
    this.importGroups.addProjectImport(node, importOrderGroupIndex);
    const matchingRegExp = groupsOrder[importOrderGroupIndex];

    if (importOrderGroupIndex < this.currentImportOrderGroupIndex) {
      return this.addFailureAtNode(
        node,
        `This import statement should appear in an earlier group. It belongs to the group matching ${matchingRegExp}`
      );
    }

    if (importOrderGroupIndex === this.currentImportOrderGroupIndex) {
      return;
    }

    if (importOrderGroupIndex > this.currentImportOrderGroupIndex) {
      this.currentImportOrderGroupIndex = importOrderGroupIndex;

      if (this.allowNextImportsGroup) {
        return;
      }

      this.addFailureAtNode(
        node,
        `This import statement should appear in a later group. It belongs to the group matching ${matchingRegExp}`
      );
    }
  }

  private endBlock(): void {
    this.allowNextImportsGroup = true;
  }
}
