import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const releaseDirectory = path.resolve(process.cwd(), 'release')
const checksumFilePath = path.join(releaseDirectory, 'SHA256SUMS.txt')

async function collectArtifacts(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectArtifacts(entryPath)))
      continue
    }

    if (/\.(zip|exe)$/i.test(entry.name)) {
      files.push(entryPath)
    }
  }

  return files
}

async function sha256(filePath) {
  const buffer = await readFile(filePath)
  return createHash('sha256').update(buffer).digest('hex')
}

async function main() {
  const artifacts = (await collectArtifacts(releaseDirectory)).sort()

  if (artifacts.length === 0) {
    throw new Error(`No release artifacts were found under ${releaseDirectory}.`)
  }

  const lines = await Promise.all(
    artifacts.map(async (artifactPath) => {
      const hash = await sha256(artifactPath)
      const relativePath = path.relative(releaseDirectory, artifactPath).replace(/\\/g, '/')
      return `${hash} *${relativePath}`
    })
  )

  await writeFile(checksumFilePath, `${lines.join('\n')}\n`, 'utf8')
  console.log(`Wrote ${checksumFilePath}`)
}

await main()
