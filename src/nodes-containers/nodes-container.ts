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

  private startPosition?: number;
  private endPosition?: number;

  constructor(sourceFile: SourceFile) {
    this.sourceFile = sourceFile;
  }

  public addNode(node: TNode) {
    this.nodes.push(node);
    this.updatePositions(node);
  }

  public copyNodesFrom(otherNodesContainer: NodesContainer<TNode>) {
    this.nodes.push(...otherNodesContainer.nodes);

    const otherNodesTextRange = otherNodesContainer.getTextRange();

    this.updateImportsStart(otherNodesTextRange.pos);
    this.updateImportsEnd(otherNodesTextRange.end);
  }

  public getTextRange(): TextRange {
    if (this.startPosition === undefined || this.endPosition === undefined) {
      throw new Error('No nodes have been added');
    }

    return {
      pos: this.startPosition,
      end: this.endPosition
    };
  }

  public isEmpty() {
    return this.nodes.length === 0;
  }

  public toString() {
    const { nodes, sourceFile } = this;

    return nodes.map(node => node.getText(sourceFile)).join('\n');
  }

  private updatePositions(node: TNode) {
    const nodeStart = node.getStart(this.sourceFile);
    const nodeEnd = node.getEnd();

    this.updateImportsStart(nodeStart);
    this.updateImportsEnd(nodeEnd);
  }

  private updateImportsStart(nodeStart: number) {
    if (this.startPosition === undefined) {
      this.startPosition = nodeStart;
    } else {
      this.startPosition = Math.min(this.startPosition, nodeStart);
    }
  }

  private updateImportsEnd(nodeEnd: number) {
    if (this.endPosition === undefined) {
      this.endPosition = nodeEnd;
    } else {
      this.endPosition = Math.max(this.endPosition, nodeEnd);
    }
  }
}
