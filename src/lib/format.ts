export const money = (n: number) => '$' + n.toFixed(2);

/** "Choose 2 dips" before any are picked, then "Choose 1 more dip"; "Choose a dip" when only one is needed. */
export const chooseLabel = (noun: string, need: number, have: number): string => {
  const left = need - have;
  if (have === 0) return need === 1 ? 'Choose a ' + noun : 'Choose ' + need + ' ' + noun + 's';
  return 'Choose ' + left + ' more ' + noun + (left === 1 ? '' : 's');
};
