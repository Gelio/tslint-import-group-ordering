import * as ts from 'typescript';

export function isImportDeclaration(
  node: ts.Node
): node is ts.ImportDeclaration {
  return node.kind === ts.SyntaxKind.ImportDeclaration;
}
