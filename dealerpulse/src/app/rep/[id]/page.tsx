import { getData } from '@/lib/data';
import RepPage from './RepClient';

const data = getData();

export function generateStaticParams() {
  return data.sales_reps.map((rep) => ({
    id: rep.id,
  }));
}

export default function Page() {
  return <RepPage />;
}
