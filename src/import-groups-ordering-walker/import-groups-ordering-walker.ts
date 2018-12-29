import * as Lint from 'tslint';
import * as ts from 'typescript';

import { WalkerOptions } from '../options/types';
import {
  getBoundingTextRange,
  stringifyNodesContainers
} from '../nodes-containers/nodes-containers-utils';
import { NodesContainer } from '../nodes-containers';

export class ImportGroupsOrderingWalker extends Lint.AbstractWalker<
  WalkerOptions
> {
  private currentImportGroupIndex = 0;
  private allowNextImportsGroup = true;
  private hasEncounteredImportStatement = false;

  private possiblyMisplacedNonImportStatements = new NodesContainer<
    ts.Statement
  >(this.getSourceFile());

  public walk(sourceFile: ts.SourceFile): void {
    for (const statement of sourceFile.statements) {
      this.checkStatement(statement);
    }

    if (this.failures.length > 0) {
      const {
        guardedNodesContainers,
        misplacedNonImportStatementsContainer
      } = this.options;
      const allNodesContainers = [
        ...guardedNodesContainers,
        misplacedNonImportStatementsContainer
      ];

      const { pos, end } = getBoundingTextRange(allNodesContainers);
      const orderedImportGroups = stringifyNodesContainers(allNodesContainers);

      this.addFailure(
        pos,
        end,
        'Invalid import groups order',
        new Lint.Replacement(pos, end - pos, orderedImportGroups)
      );
    }
  }

  private checkStatement(statement: ts.Statement): void {
    if (this.isStatementAfterEmptyLine(statement)) {
      this.endBlock();
    }

    if (ts.isImportDeclaration(statement)) {
      if (!this.possiblyMisplacedNonImportStatements.isEmpty()) {
        this.handleMisplacedNonImportStatements();
      }
      this.checkImportDeclaration(statement);
      this.allowNextImportsGroup = false;
      this.hasEncounteredImportStatement = true;
    } else {
      // console.log(statement);
      // this.possiblyMisplacedNonImportStatements.addNode(statement);
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
    // TODO: display names of import groups in the error messages
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

  private endBlock() {
    this.allowNextImportsGroup = true;
  }

  private handleMisplacedNonImportStatements() {
    if (this.hasEncounteredImportStatement) {
      const {
        pos,
        end
      } = this.possiblyMisplacedNonImportStatements.getTextRange();
      this.addFailureAt(
        pos,
        end - pos,
        'Non-import statements should not appear between import groups'
      );

      this.options.misplacedNonImportStatementsContainer.copyNodesFrom(
        this.possiblyMisplacedNonImportStatements
      );
    }

    this.possiblyMisplacedNonImportStatements = new NodesContainer(
      this.getSourceFile()
    );
  }
}
