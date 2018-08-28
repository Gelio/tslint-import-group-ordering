import { IOptions, IJsonOptions } from './interfaces';

export function parseOptions(ruleArguments: any[]): IOptions {
  const optionSet = (ruleArguments as IJsonOptions[])[0];

  return {
    groupsOrder: optionSet['groups-order']
      .map(value => new RegExp(value))
      .concat([/.*/])
  };
}
