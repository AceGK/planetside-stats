'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles/Home.module.scss';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      // Navigate to the player's profile page
      router.push(`/${searchQuery}`);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Planetside 2 Character Search</h1>
        <p>Search for your favorite players and view their stats!</p>
      </header>
      <main className={styles.main}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Enter player name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>
      </main>
    </div>
  );
}
