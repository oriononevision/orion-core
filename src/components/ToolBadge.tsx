import { getTool } from '../data/tools'

export default function ToolBadge({
  id,
  size = 'md',
}: {
  id: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const tool = getTool(id)
  if (!tool) return null

  const lightLogo =
    tool.color.toLowerCase() === '#ffffff' ||
    tool.color.toLowerCase() === '#f0f6fc' ||
    tool.id === 'notion' ||
    tool.id === 'github'

  return (
    <span
      className={`tool-badge tool-badge--${size}${lightLogo ? ' tool-badge--dark' : ''}`}
      style={{ ['--tool-color' as string]: tool.color }}
      title={tool.name}
    >
      <img src={tool.logo} alt="" className="tool-badge__logo" />
    </span>
  )
}

export function ToolBadgeRow({ ids }: { ids: string[] }) {
  return (
    <span className="tool-badge-row">
      {ids.map((id) => (
        <ToolBadge key={id} id={id} size="sm" />
      ))}
    </span>
  )
}
