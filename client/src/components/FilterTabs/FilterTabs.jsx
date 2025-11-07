import React from 'react';
import styles from './FilterTabs.module.css';

export default function FilterTabs({
  activeFilter,
  onFilterChange,
  filters = []
}) {
  return (
    <div className={styles.filterTabs}>
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          className={`${styles.filterTab} ${
            activeFilter === filter.value ? styles.active : ''
          }`}
          onClick={() => onFilterChange(filter.value)}
          aria-pressed={activeFilter === filter.value}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
