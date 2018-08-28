import * as ts from 'typescript';
import { Replacement } from 'tslint';

import { stringifyNodesGroup } from '../utils/stringify-nodes-group';

export class ImportGroups {
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
