'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles.module.scss';
import Logo from '../../../public/logos/planetside-gg-logo.svg';
import { useTheme } from 'next-themes'
import Link from 'next/link';
import { FaMagnifyingGlass } from "react-icons/fa6";

export default function NavBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('player'); // Default to 'player'
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      const path = searchType === 'player' ? `/player/${searchQuery}` : `/outfit/${searchQuery}`;
      router.push(path);
    }
  };

  function ThemeSwitch(){
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()
  
    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
      setMounted(true)
    }, [])
  
    if (!mounted) {
      return null
    }
  
    return (
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        <option value="system">System</option>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
    )
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <Link href="/">
          <Logo />
        </Link>
      </div>
      {/* <div className={styles.searchBar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className={styles.inlineDropdown}
            aria-label="Search Type"
          >
            <option value="player">Player</option>
            <option value="outfit">Outfit</option>
          </select>
          <input
            type="text"
            placeholder={`Search ${searchType === 'player' ? 'player' : 'outfit'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
          <FaMagnifyingGlass />
          </button>
        </form>
      </div> */}
      <ThemeSwitch />
    </nav>
  );
}
