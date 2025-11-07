import React from 'react';
import { FiSearch } from 'react-icons/fi';
import styles from './SearchBar.module.css';

export default function SearchBar({
  searchTerm,
  onSearchChange,
  placeholder = "Search...",
  className = ''
}) {
  return (
    <div className={`${styles.searchBox} ${className}`}>
      <FiSearch className={styles.searchIcon} />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className={styles.searchInput}
        aria-label="Search"
      />
    </div>
  );
}
