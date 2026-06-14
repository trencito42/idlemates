import { PageIntro } from '@/components/ui/PageIntro'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <main>
        <div className="p-4 sm:p-6 lg:p-8 pt-20">
          <div className="container relative z-10 mx-auto px-6">
            <PageIntro>
              {children}
            </PageIntro>
          </div>
        </div>
      </main>
    </div>
  )
}
