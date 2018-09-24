import * as Lint from 'tslint';
import * as ts from 'typescript';

import { IOptionsWithNodesContainers } from '../options/types';
import {
  getTextRange,
  stringifyNodesContainers
} from '../nodes-containers/nodes-containers-utils';

export class ImportGroupsOrderingWalker extends Lint.AbstractWalker<
  IOptionsWithNodesContainers
> {
  private currentImportGroupIndex = 0;
  private allowNextImportsGroup = true;

  public walk(sourceFile: ts.SourceFile): void {
    for (const statement of sourceFile.statements) {
      this.checkStatement(statement);
    }

    if (this.failures.length > 0) {
      const { guardedNodesContainers } = this.options;
      const { pos, end } = getTextRange(guardedNodesContainers);
      const orderedImportGroups = stringifyNodesContainers(
        guardedNodesContainers
      );

      this.addFailure(
        pos,
        end,
        'I1nvalid import groups order',
        new Lint.Replacement(pos, end - pos, orderedImportGroups)
      );
    }
  }

  private checkStatement(statement: ts.Statement): void {
    if (this.isStatementAfterEmptyLine(statement)) {
      this.endBlock();
    }

    if (ts.isImportDeclaration(statement)) {
      this.checkImportDeclaration(statement);
      this.allowNextImportsGroup = false;
    }
  }

  private isStatementAfterEmptyLine(statement: ts.Statement) {
    const { sourceFile } = this;

    return /\r?\n\r?\n/.test(
      sourceFile.text.slice(
        statement.getFullStart(),
        statement.getStart(sourceFile)
      )
    );
  }

  private checkImportDeclaration(node: ts.ImportDeclaration) {
    if (!ts.isStringLiteral(node.moduleSpecifier)) {
      // Ignore grammar error
      return;
    }

    const { guardedNodesContainers } = this.options;
    const matchingContainerIndex = guardedNodesContainers.findIndex(
      nodesContainer => nodesContainer.matches(node)
    );

    if (matchingContainerIndex === -1) {
      // NOTE: this should never happen as the last group should accept every import statement
      return;
    }

    const matchingContainer = guardedNodesContainers[matchingContainerIndex];
    matchingContainer.addNode(node);

    this.verifyImportGroupIndex(matchingContainerIndex, node);
  }

  private verifyImportGroupIndex(
    importGroupIndex: number,
    node: ts.ImportDeclaration
  ) {
    // TODO: show the RegExp (and/or the index) of the matching import group
    const importGroupNumber = importGroupIndex + 1;

    if (importGroupIndex < this.currentImportGroupIndex) {
      this.addFailureAtNode(
        node,
        `This import declaration should appear in an earlier group (number ${importGroupNumber})`
      );
    } else if (importGroupIndex > this.currentImportGroupIndex) {
      if (!this.allowNextImportsGroup) {
        this.addFailureAtNode(
          node,
          `This import declaration should appear in a later group (number ${importGroupNumber})`
        );
      }
      this.currentImportGroupIndex = importGroupIndex;
    }
  }

  private endBlock(): void {
    this.allowNextImportsGroup = true;
  }
}
