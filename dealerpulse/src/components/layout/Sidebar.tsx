'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { getData } from '@/lib/data';

const data = getData();

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Overview', icon: '📊' },
    { href: '/pipeline', label: 'Pipeline', icon: '🔄' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>⚡</div>
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>DealerPulse</span>
          <span className={styles.logoSub}>Performance Hub</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navGroup}>
          <div className={styles.navGroupLabel}>Dashboard</div>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className={styles.navGroup}>
          <div className={styles.navGroupLabel}>Branches</div>
          {data.branches.map(branch => (
            <Link
              key={branch.id}
              href={`/branch/${branch.id}`}
              className={`${styles.navItem} ${pathname === `/branch/${branch.id}` ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>🏢</span>
              <span className={styles.navItemText}>{branch.name}</span>
              <span className={styles.navBadge}>{branch.city}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerText}>
          Data: Jun – Dec 2025
        </div>
      </div>
    </aside>
  );
}
