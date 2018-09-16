import {
  IOptions,
  IJsonOptions,
  ImportsGroupConfig,
  ImportsGroup,
  ImportsGroupType
} from './types';

export function parseOptions(ruleArguments: any[]): IOptions {
  const optionSet = (ruleArguments as IJsonOptions[])[0];

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
