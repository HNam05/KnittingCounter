import { PROJECT_ICON_OPTIONS, type ProjectIconId } from '../shared/projectIcons'
import b1 from '../../Emoji/b1.jpeg'
import b2 from '../../Emoji/b2.png'
import b3 from '../../Emoji/b3.jpeg'
import c1 from '../../Emoji/c1.png'
import c2 from '../../Emoji/c2.avif'
import f1 from '../../Emoji/F1.jpg'
import f2 from '../../Emoji/f2.jpg'
import f3 from '../../Emoji/f3.png'
import f4 from '../../Emoji/f4.jpg'
import f5 from '../../Emoji/f5.jpg'
import h1 from '../../Emoji/h1.png'
import h2 from '../../Emoji/h2.png'
import h3 from '../../Emoji/h3.png'

const PROJECT_ICON_SRC_BY_ID: Record<ProjectIconId, string> = {
  b1,
  b2,
  b3,
  c1,
  c2,
  f1,
  f2,
  f3,
  f4,
  f5,
  h1,
  h2,
  h3
}

export const PROJECT_ICON_CHOICES = PROJECT_ICON_OPTIONS.map((option) => ({
  ...option,
  src: PROJECT_ICON_SRC_BY_ID[option.id]
}))

export function getProjectIconSrc(iconId: ProjectIconId | null): string | null {
  return iconId ? PROJECT_ICON_SRC_BY_ID[iconId] : null
}
