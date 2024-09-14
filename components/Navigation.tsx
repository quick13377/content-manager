import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navigation() {
  return (
    <nav>
      <h1>Content System</h1>
      <div>
        <Link href="/manage">
          <Button>Manage Content</Button>
        </Link>
        <Link href="/view">
          <Button>View Content</Button>
        </Link>
      </div>
    </nav>
  );
}