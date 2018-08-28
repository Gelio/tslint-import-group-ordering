import * as ts from 'typescript';
import * as Lint from 'tslint';
import * as fs from 'fs';
import { Replacement } from 'tslint';

/**
 * Inspired by
 *
 * https://github.com/palantir/tslint/blob/master/src/rules/orderedImportsRule.ts
 */

// NOTE: NodeJS module names taken from @types/node
const nodejsModules = [
  '_debugger',
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'module',
  'net',
  'os',
  'path',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'zlib'
];
// NOTE: libraries are computed once
const libraries = getLibraries();

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

class ImportGroups {
  private readonly libraryImports: ts.ImportDeclaration[] = [];
  private readonly projectImportGroups: ts.ImportDeclaration[][] = [];
  private readonly sourceFile: ts.SourceFile;

  private importsStart?: number;
  private importsEnd?: number;

  constructor(sourceFile: ts.SourceFile) {
    this.sourceFile = sourceFile;
  }

  public addLibraryImport(node: ts.ImportDeclaration) {
    this.libraryImports.push(node);
    this.updateImportsPlacement(node);
  }

  public addProjectImport(node: ts.ImportDeclaration, groupIndex: number) {
    while (this.projectImportGroups.length <= groupIndex) {
      this.projectImportGroups.push([]);
    }

    this.projectImportGroups[groupIndex].push(node);
    this.updateImportsPlacement(node);
  }

  public getFix() {
    if (this.importsStart === undefined || this.importsEnd === undefined) {
      throw new Error('No imports have been added');
    }

    const stringifiedLibraryImportsGroup = stringifyNodesGroup(
      this.libraryImports,
      this.sourceFile
    );
    const stringifiedProjectImportGroups = this.projectImportGroups.map(
      importsGroup => stringifyNodesGroup(importsGroup, this.sourceFile)
    );

    const stringifiedImportGroups = [
      stringifiedLibraryImportsGroup,
      ...stringifiedProjectImportGroups
    ]
      .filter(importGroup => importGroup.length > 0)
      .join('\n\n');

    return new Replacement(
      this.importsStart,
      this.importsEnd - this.importsStart,
      stringifiedImportGroups
    );
  }

  public getImportsStart() {
    if (this.importsStart === undefined) {
      throw new Error('No imports have been added');
    }

    return this.importsStart;
  }

  public getImportsEnd() {
    if (this.importsEnd === undefined) {
      throw new Error('No imports have been added');
    }

    return this.importsEnd;
  }

  private updateImportsPlacement(node: ts.Node) {
    this.updateImportsStart(node);
    this.updateImportsEnd(node);
  }

  private updateImportsStart(node: ts.Node) {
    if (!this.importsStart) {
      this.importsStart = node.getStart(this.sourceFile);
    }
  }

  private updateImportsEnd(node: ts.Node) {
    this.importsEnd = node.getEnd();
  }
}

class Walker extends Lint.AbstractWalker<IOptions> {
  private readonly libraries = libraries;
  private projectModuleImported = false;
  private currentImportOrderGroupIndex = 0;
  private allowNextImportsGroup = true;

  private readonly importGroups = new ImportGroups(this.sourceFile);

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

function stringifyNodesGroup(nodes: ts.Node[], sourceFile?: ts.SourceFile) {
  return nodes.map(node => node.getText(sourceFile)).join('\n');
}
