'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MobileNav.module.css';
import { getData } from '@/lib/data';

const data = getData();

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className={styles.header}>
        <button className={styles.menuBtn} onClick={() => setOpen(!open)}>
          {open ? '✕' : '☰'}
        </button>
        <div className={styles.headerLogo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoTitle}>DealerPulse</span>
        </div>
      </header>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <nav className={styles.nav} onClick={e => e.stopPropagation()}>
            <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`} onClick={() => setOpen(false)}>
              📊 Overview
            </Link>
            <Link href="/pipeline" className={`${styles.navItem} ${pathname === '/pipeline' ? styles.active : ''}`} onClick={() => setOpen(false)}>
              🔄 Pipeline
            </Link>
            <div className={styles.divider} />
            {data.branches.map(branch => (
              <Link
                key={branch.id}
                href={`/branch/${branch.id}`}
                className={`${styles.navItem} ${pathname === `/branch/${branch.id}` ? styles.active : ''}`}
                onClick={() => setOpen(false)}
              >
                🏢 {branch.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
