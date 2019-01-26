import * as Lint from 'tslint';
import * as ts from 'typescript';

import {
  getBoundingTextRange,
  stringifyNodesContainers
} from '../nodes-containers/nodes-containers-utils';
import { NodesContainer } from '../nodes-containers';
import { WalkerOptions } from './walker-options';
import { ImportsGroup } from '../options/types';

export class ImportGroupsOrderingWalker extends Lint.AbstractWalker<
  WalkerOptions
> {
  private currentImportsGroupOrderNumber = 1;
  private allowNextImportsGroup = true;
  private hasEncounteredImportStatement = false;
  private foundUnmatchedImportDeclaration = false;

  private possiblyMisplacedNonImportStatements = new NodesContainer<
    ts.Statement
  >(this.getSourceFile());

  public walk(sourceFile: ts.SourceFile) {
    for (const statement of sourceFile.statements) {
      this.checkStatement(statement);
    }

    if (this.failures.length > 0 && !this.foundUnmatchedImportDeclaration) {
      this.addFailureWithAutoFix();
    }
  }

  private checkStatement(statement: ts.Statement) {
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
      // NOTE: Ignore grammar error
      return;
    }

    const { matchingRules } = this.options;
    const foundMatchingRule = matchingRules.find(matchingRule =>
      matchingRule.matches(node)
    );

    if (!foundMatchingRule) {
      this.addFailureAtNode(
        node,
        'The import declaration does not match any configured import groups'
      );
      this.foundUnmatchedImportDeclaration = true;

      return;
    }

    const matchingImportsGroup = foundMatchingRule.importsGroup;
    matchingImportsGroup.nodesContainer.addNode(node);

    this.verifyImportsGroupOrder(matchingImportsGroup, node);
  }

  private verifyImportsGroupOrder(
    { orderNumber, name }: ImportsGroup,
    node: ts.ImportDeclaration
  ) {
    if (orderNumber < this.currentImportsGroupOrderNumber) {
      this.addFailureAtNode(
        node,
        `This import declaration should appear in an earlier group ("${name}", number ${orderNumber})`
      );
    } else if (orderNumber > this.currentImportsGroupOrderNumber) {
      if (!this.allowNextImportsGroup) {
        this.addFailureAtNode(
          node,
          `This import declaration should appear in a later group ("${name}", number ${orderNumber})`
        );
      }

      this.currentImportsGroupOrderNumber = orderNumber;
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

  private addFailureWithAutoFix() {
    const {
      importsGroups,
      misplacedNonImportStatementsContainer
    } = this.options;

    const allNodesContainers = [
      ...importsGroups.map(importsGroup => importsGroup.nodesContainer),
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
