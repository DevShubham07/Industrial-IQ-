import { getData } from '@/lib/data';
import BranchPage from './BranchClient';

const data = getData();

export function generateStaticParams() {
  return data.branches.map((branch) => ({
    id: branch.id,
  }));
}

export default function Page() {
  return <BranchPage />;
}
