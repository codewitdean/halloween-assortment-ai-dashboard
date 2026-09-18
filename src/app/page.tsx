import { loadDashboard } from '@/lib/import/load-dashboard';
import Workbench from '@/components/workbench';
export const dynamic = 'force-dynamic';
function readSource() {
  try {
    return { ...loadDashboard(), error: null };
  } catch (error) {
    return {
      dataset: null,
      error: error instanceof Error ? error.message : 'Unknown import error.',
    };
  }
}
export default function Page() {
  const result = readSource();
  if (result.dataset)
    return <Workbench dataset={result.dataset} modelInputs={result.modelInputs} />;
  return (
    <main className="import-error">
      <span className="eyebrow">HALLOWEEN ASSORTMENT</span>
      <h1>Dataset could not be validated</h1>
      <p>No product records or financial totals have been loaded.</p>
      <pre role="alert">{result.error}</pre>
      <p>
        Check the workbook’s Source data sheet and the import instructions in README.md, then
        reload.
      </p>
      <form action="/">
        <button type="submit">Retry import</button>
      </form>
    </main>
  );
}
