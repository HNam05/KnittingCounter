import type { Project } from '../../shared/types'

interface ProjectListProps {
  projects: Project[]
  activeProjectId: string | null
  onSelectProject: (projectId: string) => void
}

export function ProjectList({ projects, activeProjectId, onSelectProject }: ProjectListProps): JSX.Element {
  if (projects.length === 0) {
    return (
      <div className="project-list project-list--empty">
        <p className="empty-copy">No projects yet. Create one to start counting.</p>
      </div>
    )
  }

  return (
    <div className="project-list">
      {projects.map((project) => {
        const isActive = project.id === activeProjectId

        return (
          <button
            key={project.id}
            className={`project-list__item${isActive ? ' project-list__item--active' : ''}`}
            onClick={() => onSelectProject(project.id)}
            type="button"
          >
            <span className="project-list__name">{project.name}</span>
            <span className="project-list__count">{project.count}</span>
          </button>
        )
      })}
    </div>
  )
}
