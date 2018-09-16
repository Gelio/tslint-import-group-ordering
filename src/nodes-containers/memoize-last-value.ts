export const memoizeLastValue = <TArg, TVal>(fn: (arg: TArg) => TVal) => {
  let hasMemoizedValue = false;
  let prevArgument: TArg | null = null;
  let prevReturnValue: TVal | null = null;

  return (argument: TArg): TVal => {
    if (hasMemoizedValue && prevArgument === argument) {
      return prevReturnValue as TVal;
    }

    hasMemoizedValue = true;
    prevArgument = argument;
    prevReturnValue = fn(argument);

    return prevReturnValue;
  };
};
