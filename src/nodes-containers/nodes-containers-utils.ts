import { Node, TextRange } from 'typescript';

import { NodesContainer } from './nodes-container';
import { Predicate } from './types';

export function getTextRange<TNode extends Node>(
  nodesContainers: NodesContainer<TNode>[]
): TextRange {
  const containerRanges = nodesContainers.map(container =>
    container.getTextRange()
  );

  const startPosition = containerRanges.reduce(
    (min, textRange) => Math.min(min, textRange.pos),
    Number.MAX_SAFE_INTEGER
  );
  const endPosition = containerRanges.reduce(
    (max, textRange) => Math.max(max, textRange.end),
    Number.MIN_SAFE_INTEGER
  );

  return {
    pos: startPosition,
    end: endPosition
  };
}

const notEmpty: Predicate<{ length: number }> = ({ length }) => length > 0;

export function stringifyNodesContainers<TNode extends Node>(
  nodesContainers: NodesContainer<TNode>[]
) {
  return nodesContainers
    .map(container => container.toString())
    .filter(notEmpty)
    .join('\n\n');
}
