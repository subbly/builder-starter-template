import { useFormatter } from 'next-intl'

export const useFormatAmount = () => {
  const format = useFormatter()

  const formatAmount = (amount: number, currencyCode?: string) => {
    return format.number(amount / 100, {
      style: 'currency',
      currency: process.env.NEXT_PUBLIC_SHOP_CURRENCY || currencyCode || 'USD',
    })
  }

  return {
    formatAmount,
  }
}
