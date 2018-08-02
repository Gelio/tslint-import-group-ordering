/**
 * Copyright (c) 2018 Juniper Networks, Inc. All rights reserved.
 */

import * as ts from 'typescript';
import * as Lint from 'tslint';
import * as fs from 'fs';

/**
 * Inspired by
 *
 * https://github.com/palantir/tslint/blob/master/src/rules/orderedImportsRule.ts
 */

// TODO: fill all NodeJS modules
const nodejsModules = ['fs'];

export class Rule extends Lint.Rules.AbstractRule {
  public static metadata: Lint.IRuleMetadata = {
    ruleName: 'import-group-ordering',
    description:
      'Requires specific ordering of import groups. Requires third party import to be in the first group.',
    optionsDescription: Lint.Utils.dedent`
      The "groups-order" options should contain strings with regular expressions that describe module
      specifiers (paths) allowed in consecutive import groups.

      Imports from libraries (from "node_modules") will always be in the first group.

      The last group will contain the rest of the import statements.
    `,
    hasFix: false,
    options: {
      type: 'object',
      properties: {
        'groups-order': {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      },
      required: ['group-order'],
      additionalProperties: false
    },
    optionExamples: [
      [
        true,
        {
          'groups-order': ['/^(fabric|common)/', '/^products/']
        }
      ]
    ],
    type: 'style',
    typescriptOnly: false
  };

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(
      new Walker(sourceFile, this.ruleName, parseOptions(this.ruleArguments))
    );
  }
}

interface IOptions {
  groupsOrder: RegExp[];
}

interface IJsonOptions {
  'groups-order': string[];
}

function parseOptions(ruleArguments: any[]): IOptions {
  const optionSet = (ruleArguments as IJsonOptions[])[0];

  return {
    groupsOrder: optionSet['groups-order']
      .map(value => new RegExp(value))
      .concat([/.*/])
  };
}

class Walker extends Lint.AbstractWalker<IOptions> {
  private readonly libraries = getLibraries();
  private projectModuleImported = false;
  private currentImportOrderGroupIndex = 0;
  private allowNextImportsGroup = true;

  public walk(sourceFile: ts.SourceFile): void {
    for (const statement of sourceFile.statements) {
      this.checkStatement(statement);
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

    if (isImportDeclaration(statement)) {
      this.checkImportDeclaration(statement);
      this.allowNextImportsGroup = false;
    }
  }

  private checkImportDeclaration(node: ts.ImportDeclaration) {
    if (!isStringLiteral(node.moduleSpecifier)) {
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
    const matchingRegExp = groupsOrder[importOrderGroupIndex];

    console.log(moduleSpecifier, matchingRegExp, this.allowNextImportsGroup);

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
    console.log('ending block');
    this.allowNextImportsGroup = true;
  }
}

function isImportDeclaration(node: ts.Node): node is ts.ImportDeclaration {
  return node.kind === ts.SyntaxKind.ImportDeclaration;
}

function isStringLiteral(node: ts.Node): node is ts.StringLiteral {
  return node.kind === ts.SyntaxKind.StringLiteral;
}

function removeQuotes(value: string): string {
  if (value.length > 1 && (value[0] === "'" || value[0] === '"')) {
    return value.substr(1, value.length - 2);
  }

  return value;
}

function getLibraries() {
  return [...fs.readdirSync('node_modules'), ...nodejsModules].map(
    name => new RegExp(`^${name}`)
  );
}
