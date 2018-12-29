import {
  Options,
  JsonOptions,
  ImportsGroupConfig,
  ImportsGroup,
  ImportsGroupType
} from './types';

export function parseOptions(ruleArguments: JsonOptions[]): Options {
  const optionSet = ruleArguments[0];

  return {
    importsGroups: parseImportsGroups(optionSet['imports-groups'])
  };
}

const parseImportsGroups = (importsGroups: ImportsGroupConfig[]) =>
  importsGroups.map(parseImportsGroupConfig);

function parseImportsGroupConfig(
  importsGroupConfig: ImportsGroupConfig
): ImportsGroup {
  if (importsGroupConfig.type === ImportsGroupType.ThirdParty) {
    return {
      type: ImportsGroupType.ThirdParty
    };
  }

  return {
    type: ImportsGroupType.Project,
    regExp: new RegExp(importsGroupConfig.regExp)
  };
}
