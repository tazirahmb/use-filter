import { useEffect, useReducer } from 'react';
import { Map } from 'immutable';
import qs from 'qs';
import { TABLES } from '@codex-by-telkom/component-library.helpers.constants';
import { useHistory, useLocation } from 'react-router-dom';
import { parsedQueryParams } from '@codex-by-telkom/component-library.helpers.utils.pagination';
import { stringToBool } from '@codex-by-telkom/component-library.helpers.utils.converter';

export default function useFilter(options = {}) {
  // init router dan redux hooks helper
  const history = useHistory();
  const { search } = useLocation();
  const params = parsedQueryParams(search);

  // Set initial pagination data, so if filter data is empty
  // The component will load the first page with list of items

  /**
   *
   * defined options argument content:
   * - sort: untuk mengeset bagaimana data dari server di-sort. (default: -_id)
   * - isTable: merupakan opsi apakah key-key untuk pagination (skip, limit, sort, page)
   *      perlu dimasukkan di initData. tujuannya untuk clean code (default: true)
   * - additionalInitParams: opsi untuk memasukkan params default selain dari pagination
   *      agar ketika filter direset, params tersebut tidak ikut tereset.
   *      contoh penggunaan dapat dilihat di talentDTRTableContainer.
   * - resetSearch: Nyalakan options ini untuk membuat functoin reset dapat mereset search juga.
   * - searchName: nama variabel yang dipakai untuk search
   * -
   */

  // variable to fill object keys for filter data that was formatted.abs
  // example: passing grade
  //   - raw object keys: passingGrade
  //   - formatted object keys: passingGradeMin, passingGradeMax
  // example:
  // {
  //   param: ['successRate'],
  //     output: ['successRateMin', 'successRateMax'],
  //     callback: (filterState) => {
  //         // pass value to format filter data

  //       return filterState.merge(hasilOlahan)
  //       }
  // }

  const {
    sort = '-_id',
    isTable = true,
    additionalInitParams = {},
    resetSearch = false,
    specialParams = [],
    searchName = 'title',
  } = options;

  const searchParams = {
    [searchName]: params[searchName] || '',
  };

  const paginationParams = {
    skip: 0,
    limit: TABLES.LIMIT_PER_PAGE,
    sort,
    page: '1',
  };

  const initSearchParams = resetSearch ? {} : searchParams;

  const filterInit = isTable
    ? {
        ...additionalInitParams,
        ...paginationParams,
        ...initSearchParams,
      }
    : {
        ...additionalInitParams,
      };

  const initFilterData = Map(filterInit);

  function formatFilterData(state, filterData) {
    //=======================================
    //=======================================
    let _filterData = filterData;
    let _state = state;

    specialParams.forEach((key) => {
      _state = _state.mergeDeep(key.callback(_filterData));
    });
    //=======================================
    //=======================================
    return _state
      .merge(initFilterData)
      .merge(_filterData)
      .merge(
        Map({
          skip:
            (parseInt(filterData.page, 10) - 1) * TABLES.LIMIT_PER_PAGE || 0,
        })
      );
  }

  function reducer(state, action) {
    switch (action.type) {
      case 'UPDATE_FILTER_DATA':
        return formatFilterData(state, action.filterData);
      case 'RESET_FILTER_DATA':
        return initFilterData;
      default:
        return state;
    }
  }

  const [_filterState, filterDispatch] = useReducer(
    reducer,
    formatFilterData(initFilterData, params)
  );

  const formattedParamsKeys = [];
  const rawParamsKeys = [];

  const fillParamsKeys = (paramsState) => {
    specialParams.forEach((key) => {
      key[paramsState].forEach((params) => {
        if (paramsState === 'param') rawParamsKeys.push(params);
        else formattedParamsKeys.push(params);
      });
    });
  };
  fillParamsKeys('output');
  fillParamsKeys('param');

  // filter state without data formatted
  const rawFilterState = _filterState
    .deleteAll(formattedParamsKeys)
    .deleteAll(['skip', 'limit', 'sort'])
    // to convert boolean string to bool (eg. "true" to true)
    .map(stringToBool)
    // We need to eliminate key that contain empty string here,
    // because some component that use ReactSelect,
    // should provide one option that use empty string as value
    .filter((item) => item !== '');

  const filterState = _filterState
    .deleteAll(rawParamsKeys)
    // to convert boolean string to bool (eg. "true" to true)
    .map(stringToBool)
    // We need to eliminate key that contain empty string here,
    // because some component that use ReactSelect,
    // should provide one option that use empty string as value
    .filter((item) => item !== '');

  const isSearchAndFilterActive = !rawFilterState
    .deleteAll(Object.keys(additionalInitParams))
    .deleteAll(Object.keys(paginationParams))
    .isEmpty();

  // using params so this variable can be used when component loaded
  const isFilterActive = !rawFilterState
    .deleteAll(Object.keys(additionalInitParams))
    .deleteAll(Object.keys(paginationParams))
    .deleteAll(Object.keys(searchParams))
    .isEmpty();

  function updateFilterChange(name, value) {
    let data = {};

    if (isTable) {
      data = {
        page: 1,
      };
    }

    data[name] = value;

    filterDispatch({
      type: 'UPDATE_FILTER_DATA',
      filterData: data,
    });
  }

  function resetFilterClick(e) {
    e.preventDefault();

    filterDispatch({ type: 'RESET_FILTER_DATA' });
  }

  useEffect(() => {
    history.replace({
      search: qs.stringify(rawFilterState.toJS(), {
        ignoreQueryPrefix: true,
        encode: false,
      }),
    });
  }, [_filterState]);

  return {
    filterState,
    rawFilterState,
    isSearchAndFilterActive,
    isFilterActive,
    filterDispatch,
    updateFilterChange,
    resetFilterClick,
  };
}

/**
 *
 * Cara Kerja useFilter:
 *
 * filterState: dipake buat ambil value yang dibaca dan diolah query/filter
 *              contoh: di historyPush (raw), filter.js (raw/formatted), query (formatted)
 * updateFilterChange: untuk lempar var baru (olahnya nanti di dalem useFilter)
 *
 * pemakaian filterState:
 *  - query/rest: formatted
 *  - inputSearch: raw/formatted (sama aja)
 *  - filter comp: raw // yg tampil di params url
 *
 */
