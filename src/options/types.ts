import { ImportDeclaration } from 'typescript';

import { NodesContainer, Predicate } from '../nodes-containers';

export enum ImportsGroupType {
  Dependencies = 'dependencies',
  Project = 'project'
}

export interface ImportsGroupConfig {
  name: string;
}

interface SharedMatchingRuleConfig {
  'imports-group': string;
}

interface DependenciesMatchingRuleConfig extends SharedMatchingRuleConfig {
  // TODO: allow enabling/disabling nodejs modules
  type: ImportsGroupType.Dependencies;
}

interface ProjectMatchingRuleConfig extends SharedMatchingRuleConfig {
  type: ImportsGroupType.Project;
  matches: string;
}

export type MatchingRuleConfig =
  | DependenciesMatchingRuleConfig
  | ProjectMatchingRuleConfig;

export interface RuleConfig {
  'imports-groups': ImportsGroupConfig[];
  'matching-rules': MatchingRuleConfig[];
}

export interface ImportsGroup {
  name: string;
  nodesContainer: NodesContainer<ImportDeclaration>;
  orderNumber: number;
}

export interface MatchingRule {
  importsGroup: ImportsGroup;
  matches: Predicate<ImportDeclaration>;
}
