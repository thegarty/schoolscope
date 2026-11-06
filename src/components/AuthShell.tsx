import type { ReactNode } from 'react'
import AppFooter from './AppFooter'
import { SchoolScopeBrand } from './SchoolScopeBrand'

export default function AuthShell({ children, title, description }: { children: ReactNode; title: string; description: string }) {
  return <div className="scope-auth"><main><SchoolScopeBrand /><div className="scope-auth-intro"><h1>{title}</h1><p>{description}</p></div>{children}</main><AppFooter /></div>
}
