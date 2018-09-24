import { ImportDeclaration } from 'typescript';

import { GuardedNodesContainer } from '../nodes-containers';

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

export interface IOptions {
  importsGroups: ImportsGroup[];
}

export interface IOptionsWithNodesContainers extends IOptions {
  guardedNodesContainers: GuardedNodesContainer<ImportDeclaration>[];
}

export interface IJsonOptions {
  'imports-groups': ImportsGroupConfig[];
}
