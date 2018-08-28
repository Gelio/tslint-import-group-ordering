import * as ts from 'typescript';

export function stringifyNodesGroup(
  nodes: ts.Node[],
  sourceFile?: ts.SourceFile
) {
  return nodes.map(node => node.getText(sourceFile)).join('\n');
}
