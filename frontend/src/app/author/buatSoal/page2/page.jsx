import { Suspense } from 'react';
import MembuatSoalCPNS from './MembuatSoalCPNS';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MembuatSoalCPNS />
    </Suspense>
  );
}