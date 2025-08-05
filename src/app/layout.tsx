import { Inter, Poppins } from 'next/font/google'
import '../styles/globals.css'
import LayoutWrapper from '@/components/LayoutWrapper'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter'
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins'
})

export const metadata = {
  title: 'Safe Rental Calculator - Калькулятор оренди сейфу',
  description: 'Розрахунок вартості оренди індивідуального сейфу з динамічними тарифами',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} ${poppins.variable}`}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  )
}
