import { SourceFile, Node, TextRange } from 'typescript';

/**
 * A container for syntax nodes.
 *
 * Keeps track of the bounding text range of nodes.
 */
export interface NodesContainer<TNode extends Node> {
  addNode(node: TNode): void;
  copyNodesFrom(otherNodesContainer: NodesContainer<TNode>): void;
  isEmpty(): boolean;
  getTextRange(): TextRange;
  toString(): string;
}

export class NodesContainer<TNode extends Node>
  implements NodesContainer<TNode> {
  private readonly nodes: TNode[] = [];
  private readonly sourceFile: SourceFile;

  constructor(sourceFile: SourceFile) {
    this.sourceFile = sourceFile;
  }

  /**
   * Nodes should be added in the order they appear in the source file.
   * @param node
   */
  public addNode(node: TNode) {
    this.nodes.push(node);
  }

  public copyNodesFrom(otherNodesContainer: NodesContainer<TNode>) {
    this.nodes.push(...otherNodesContainer.nodes);
    this.sortNodesByAscendingPosition();
  }

  public getTextRange(): TextRange {
    if (this.isEmpty()) {
      throw new Error('No nodes have been added');
    }

    const firstNode = this.nodes[0];
    const lastNode = this.nodes[this.nodes.length - 1];

    return {
      pos: firstNode.getFullStart(),
      end: lastNode.getEnd()
    };
  }

  public isEmpty() {
    return this.nodes.length === 0;
  }

  public toString() {
    const { nodes, sourceFile } = this;

    /**
     * NOTE: using `getFullText` preserves comments. It also preserves all the whitespace.
     * That is why multiple newlines have to be collapsed and the output has to be trimmed.
     */
    const rawOutput = nodes
      .map(node => node.getFullText(sourceFile))
      .join('\n');

    return trimAndCollapseNewLines(rawOutput);
  }

  private sortNodesByAscendingPosition() {
    this.nodes.sort(
      (a, b) => a.getStart(this.sourceFile) - b.getStart(this.sourceFile)
    );
  }
}

const trimAndCollapseNewLines = (text: string) =>
  text.replace(/(\r?\n)+/g, '\n').trim();
