export type CardsType = {
  title: string
  count: string
  icon: string
  series: number[]
}

export const cardsData: CardsType[] = [
  {
    title: 'Total Income',
    count: '$78.8k',
    icon: 'solar:globus-outline',
    series: [25, 28, 32, 38, 43, 55, 60, 48, 42, 51, 35],
  },
  {
    title: 'New Users',
    count: '2,150',
    icon: 'solar:users-group-two-rounded-broken',
    series: [87, 54, 4, 76, 31, 95, 70, 92, 53, 9, 6],
  },
  {
    title: 'Orders',
    count: '1,784',
    icon: 'solar:cart-5-broken',
    series: [41, 42, 35, 42, 6, 12, 13, 22, 42, 94, 95],
  },
  {
    title: 'Conversion Rate',
    count: '12.3%',
    icon: 'solar:pie-chart-2-broken',
    series: [8, 41, 40, 48, 77, 35, 0, 77, 63, 100, 71],
  },
]
