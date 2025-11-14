import './globals.css'
import Sidebar from '../components/Sidebar'

export const metadata = {
  title: 'srm-new',
  description: 'amoCRM-like platform'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 bg-slate-950 min-h-screen p-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
