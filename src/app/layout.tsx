import './globals.css'
import Sidebar from '../components/Sidebar'
import ViewTransition from '../components/ViewTransition'

export const metadata = {
  title: 'srm-new',
  description: 'amoCRM-like platform'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 bg-slate-950 overflow-y-auto p-6">
            <ViewTransition>
              {children}
            </ViewTransition>
          </main>
        </div>
      </body>
    </html>
  )
}
