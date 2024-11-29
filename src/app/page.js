'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './styles/home.module.scss';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('player'); // Default to 'player'
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      // Navigate based on the selected search type
      const path = searchType === 'player' ? `/player/${searchQuery}` : `/outfit/${searchQuery}`;
      router.push(path);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>
          Planetside 2{' '}
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className={styles.inlineDropdown}
            aria-label="Search Type"
          >
            <option value="player">Player</option>
            <option value="outfit">Outfit</option>
          </select>{' '}
          Search
        </h1>
      </header>
      <main className={styles.main}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder={`Enter ${searchType === 'player' ? 'player' : 'outfit'} name`}
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
