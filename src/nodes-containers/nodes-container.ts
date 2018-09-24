import { SourceFile, Node, TextRange } from 'typescript';

export interface NodesContainer<TNode extends Node> {
  addNode(node: TNode): void;
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

  public getTextRange(): TextRange {
    if (this.startPosition === undefined || this.endPosition === undefined) {
      throw new Error('No nodes have been added');
    }

    return {
      pos: this.startPosition,
      end: this.endPosition
    };
  }

  public toString() {
    const { nodes, sourceFile } = this;

    return nodes.map(node => node.getText(sourceFile)).join('\n');
  }

  private updatePositions(node: TNode) {
    this.updateImportsStart(node);
    this.updateImportsEnd(node);
  }

  private updateImportsStart(node: TNode) {
    const nodeStart = node.getStart(this.sourceFile);

    if (!this.startPosition) {
      this.startPosition = nodeStart;
    } else {
      this.startPosition = Math.min(this.startPosition, nodeStart);
    }
  }

  private updateImportsEnd(node: TNode) {
    const nodeEnd = node.getEnd();

    if (!this.endPosition) {
      this.endPosition = nodeEnd;
    } else {
      this.endPosition = Math.max(this.endPosition, nodeEnd);
    }
  }
}
