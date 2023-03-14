export const regExp = {
  onlyNumber: /^[0-9]+$/,
  onlyNumberWithCalc: /^[+-][0-9]+$/,
  onlyActionVariable: /\$(.*?)\$/g,
  onlyActionRange: /\[(.*?)\]/g,
  onlyWhitespace: /\s+/g,
}
