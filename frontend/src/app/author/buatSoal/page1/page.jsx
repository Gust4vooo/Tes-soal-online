import { Suspense } from 'react';
import MembuatSoal from './MembuatSoal';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MembuatSoal />
    </Suspense>
  );
}

