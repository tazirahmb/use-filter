import React from 'react';
import '@codex-by-telkom/component-library.helpers.utils.composition-setup';
import Button from '@codex-by-telkom/component-library.elements.button';
import { Router, Route } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import useFilter from '..';

function Component() {
  const { filterState, updateFilterChange, resetFilterClick } = useFilter();

  const handleNextPage = () =>
    updateFilterChange('page', parseInt(filterState.get('page'), 10) + 1);
  const handlePrevPage = () =>
    updateFilterChange('page', parseInt(filterState.get('page'), 10) - 1);
  return (
    <div>
      <Button
        text="Next Page"
        onClick={handleNextPage}
        style={{ marginRight: '1.6rem' }}
      />
      <Button
        text="Previous Page"
        onClick={handlePrevPage}
        disabled={filterState.get('page') === 1}
        style={{ marginRight: '1.6rem' }}
      />
      <Button text="Reset Filter" onClick={resetFilterClick} />
      <div>
        <p>Current filterState:</p>
        <ul>
          {Object.keys(filterState.toJS()).map((key) => (
            <li key={key}>
              {key}: {filterState.get(key)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function useFilterExample() {
  const history = createMemoryHistory();
  return (
    <Router history={history}>
      <Route path="/">
        <Component />
      </Route>
    </Router>
  );
}
