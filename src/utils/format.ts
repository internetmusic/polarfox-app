const enUSNumberFormatter = new Intl.NumberFormat('en-US')

export function numberWithCommas(x: number) {
  return enUSNumberFormatter.format(x)
}
