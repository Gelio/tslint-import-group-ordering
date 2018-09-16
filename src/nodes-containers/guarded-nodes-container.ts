import { Node } from 'typescript';

import { memoizeLastValue } from './memoize-last-value';
import { Predicate } from './types';
import { NodesContainer } from './nodes-container';

export interface GuardedNodesContainer<TNode extends Node>
  extends NodesContainer<TNode> {
  matches: Predicate<TNode>;
}

export class GuardedNodesContainer<TNode extends Node>
  implements GuardedNodesContainer<TNode> {
  private readonly nodesContainer: NodesContainer<TNode>;

  constructor(
    nodesContainer: NodesContainer<TNode>,
    predicate: Predicate<TNode>
  ) {
    this.nodesContainer = nodesContainer;
    this.matches = memoizeLastValue(predicate);
  }

  public addNode(node: TNode) {
    if (!this.matches(node)) {
      throw new Error('The node does not match the predicate');
    }

    this.nodesContainer.addNode(node);
  }

  public getTextRange() {
    return this.nodesContainer.getTextRange();
  }

  public toString() {
    return this.nodesContainer.toString();
  }
}
