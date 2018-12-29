import { ImportDeclaration, Statement } from 'typescript';

import { GuardedNodesContainer, NodesContainer } from '../nodes-containers';

export enum ImportsGroupType {
  ThirdParty = 'third-party',
  Project = 'project'
}

export interface ThirdPartyImportsGroupConfig {
  type: ImportsGroupType.ThirdParty;
}

export interface ProjectImportsGroupConfig {
  type: ImportsGroupType.Project;
  regExp: string;
}

export type ImportsGroupConfig =
  | ThirdPartyImportsGroupConfig
  | ProjectImportsGroupConfig;

export type ThirdPartyImportsGroup = ThirdPartyImportsGroupConfig;

export interface ProjectImportsGroup {
  type: ImportsGroupType.Project;
  regExp: RegExp;
}

export type ImportsGroup = ThirdPartyImportsGroup | ProjectImportsGroup;

export interface Options {
  importsGroups: ImportsGroup[];
}

export interface WalkerOptions extends Options {
  guardedNodesContainers: GuardedNodesContainer<ImportDeclaration>[];

  /**
   * A container for non-import statements that appear between import groups.
   *
   * Those should appear after all import groups.
   */
  misplacedNonImportStatementsContainer: NodesContainer<Statement>;
}

export interface JsonOptions {
  'imports-groups': ImportsGroupConfig[];
}
