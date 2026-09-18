import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const stagingRoot = path.join(root, '.pages-build');
await fs.mkdir(stagingRoot, { recursive: true });
const staging = await fs.mkdtemp(path.join(stagingRoot, 'export-'));
try {
  // Only public build inputs enter staging. Local env files and rationale records stay outside.
  for (const name of [
    'src',
    'data',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'postcss.config.mjs',
  ]) {
    await fs.cp(path.join(root, name), path.join(staging, name), { recursive: true });
  }
  await fs.symlink(path.join(root, 'node_modules'), path.join(staging, 'node_modules'), 'dir');
  await fs.rm(path.join(staging, 'src/app/api'), { recursive: true });
  await fs.writeFile(
    path.join(staging, 'src/app/page.tsx'),
    `import { loadDashboard } from '@/lib/import/load-dashboard';
import Workbench from '@/components/workbench';
export const dynamic = 'force-static';
export default function Page() {
  const { dataset, modelInputs } = loadDashboard();
  return <Workbench dataset={dataset} modelInputs={modelInputs} />;
}
`,
  );
  await fs.writeFile(
    path.join(staging, 'next.config.mjs'),
    `export default {
    output: 'export',
    basePath: '/halloween-assortment-ai-dashboard',
    trailingSlash: true,
    devIndicators: false,
    images: { unoptimized: true },
  };\n`,
  );
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'node_modules/next/dist/bin/next'), 'build', '--webpack'],
    {
      cwd: staging,
      stdio: 'inherit',
      env: {
        ...process.env,
        NEXT_PUBLIC_STATIC_EXPORT: 'true',
        OPENAI_API_KEY: '',
        OPENAI_MODEL: '',
        RATIONALE_DATA_DIR: '',
      },
    },
  );
  if (result.status !== 0) throw new Error(`Pages build failed (${result.status}).`);
  await fs.rm(path.join(root, 'out'), { recursive: true, force: true });
  await fs.cp(path.join(staging, 'out'), path.join(root, 'out'), { recursive: true });
  await fs.writeFile(path.join(root, 'out/.nojekyll'), '');
} finally {
  await fs.rm(staging, { recursive: true, force: true });
}
