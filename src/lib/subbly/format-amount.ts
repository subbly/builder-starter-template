const formatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
})

export const formatAmount = (amount: number): string => {
  if (!amount) {
    return '0.00'
  }

  return `${formatter.format(amount / 100)}`
}
