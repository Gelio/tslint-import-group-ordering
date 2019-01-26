import { ImportsGroup, MatchingRule } from '../options/types';
import { Statement } from 'typescript';

import { NodesContainer } from '../nodes-containers';

export interface WalkerOptions {
  importsGroups: ImportsGroup[];
  matchingRules: MatchingRule[];

  /**
   * A container for non-import statements that appear between import groups.
   *
   * Those should appear after all import groups.
   */
  misplacedNonImportStatementsContainer: NodesContainer<Statement>;
}
