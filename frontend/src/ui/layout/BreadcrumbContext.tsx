import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface BreadcrumbContextValue {
  dynamicTitle: string | undefined
  setDynamicTitle: (title: string | undefined) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  dynamicTitle: undefined,
  setDynamicTitle: () => {},
})

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [dynamicTitle, setDynamicTitle] = useState<string | undefined>()

  return (
    <BreadcrumbContext.Provider value={{ dynamicTitle, setDynamicTitle }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext)
}

export function useBreadcrumbTitle(title?: string) {
  const { setDynamicTitle } = useBreadcrumbContext()

  useEffect(() => {
    setDynamicTitle(title)
    return () => {
      setDynamicTitle(undefined)
    }
  }, [title, setDynamicTitle])
}
