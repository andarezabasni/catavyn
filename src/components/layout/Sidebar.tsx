import { NavLink, useNavigate } from 'react-router'
import { Home, FileText, Tag, Pin, Trash2, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/',        icon: Home,     label: 'Home'   },
  { to: '/notes',   icon: FileText, label: 'Notes'  },
  { to: '/tags',    icon: Tag,      label: 'Tags'   },
  { to: '/pinned',  icon: Pin,      label: 'Pinned' },
  { to: '/trash',   icon: Trash2,   label: 'Trash'  },
]

export default function Sidebar() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Desktop sidebar — fixed left strip */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 flex-col items-center bg-bg-sidebar border-r border-border py-6 z-10">
        <span className="font-display font-bold text-text-primary text-xs tracking-widest mb-8 rotate-0">
          C
        </span>

        <nav className="flex flex-col items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 w-14 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-accent-gold/15 text-accent-gold'
                    : 'text-text-muted hover:text-text-secondary hover:bg-black/5'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.75} />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-1 w-14 py-3 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Sign out"
        >
          <LogOut size={20} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Out</span>
        </button>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-bg-sidebar border-t border-border z-10 py-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive
                  ? 'text-accent-gold'
                  : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.75} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-text-muted hover:text-red-500 transition-colors"
          aria-label="Sign out"
        >
          <LogOut size={20} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Out</span>
        </button>
      </nav>
    </>
  )
}
