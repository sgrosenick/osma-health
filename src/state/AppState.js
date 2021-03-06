import { call, put, takeLatest } from 'redux-saga/effects';
import Api from '../api';

/* Actions */
const COUNTRY_FETCH_FAILED = 'COUNTRY_FETCH_FAILED';
const COUNTRY_FETCH_SUCCEEDED = 'COUNTRY_FETCH_SUCCEEDED';
const BOUNDARY_SELECTED = 'BOUNDARY_SELECTED';
const COUNTRIES_REQUESTED = 'COUNTRIES_REQUESTED';

const STATS_FETCH_FAILED = 'STATS_FETCH_FAILED';
const STATS_FETCH_SUCCEEDED = 'STATS_FETCH_SUCCEEDED';
const STATS_REQUESTED = 'STATS_REQUESTED';

export function countryFetchFailed (message) {
  console.error(COUNTRY_FETCH_FAILED, message);
  return { type: COUNTRY_FETCH_FAILED, message };
}

export function countryFetchSucceeded (countries) {
  return { type: COUNTRY_FETCH_SUCCEEDED, countries };
}

export function selectBoundary (boundary) {
  return { type: BOUNDARY_SELECTED, boundary }
}

export function requestCountries () {
  return { type: COUNTRIES_REQUESTED };
}

export function statsFetchFailed (message) {
  console.error(STATS_FETCH_FAILED, message);
  return { type: STATS_FETCH_FAILED, message };
}

export function statsFetchSucceeded (data) {
  return { type: STATS_FETCH_SUCCEEDED, data };
}

export function requestStats (countries) {
  return { type: STATS_REQUESTED, countries };
}


/* Saga */
export function* fetchGeneralStats (data) {
  try {
    if (data.countries.length > 0) {
      var countries = data.countries.values();
      var entry;
      while (!(entry = countries.next()).done) {
        let data = yield call(Api.fetchGeneralCompletenessStats, entry.value);
        yield put(statsFetchSucceeded(data));
      }
    }
  } catch (e) {
    yield put(statsFetchFailed(e.message));
  }
}

export function* fetchCountries () {
  try {
    const countries = yield call(Api.fetchCountries);
    yield put(countryFetchSucceeded(countries));
  } catch (e) {
    yield put(countryFetchFailed(e.message));
  }
}

export function* appSaga () {
  yield takeLatest (COUNTRIES_REQUESTED, fetchCountries);
  yield takeLatest (STATS_REQUESTED, fetchGeneralStats);
}

/* initialState */
const initialState = {
  countries: {},
  boundaries: [],
  generalStats: {}
}

/* Reducer */
export default function AppState (state = initialState, action) {
  switch (action.type) {
    case COUNTRY_FETCH_SUCCEEDED:
      const countries = action.countries
      const features = Object.keys(countries).map(country => {
        const features = countries[country].features;
        /**
         * Add the country back into the properties of each boundary
         */
        features.forEach(feature => {
          feature.properties['country'] = country;
          return feature;
        });
        return features;
      });
      const boundaries = [].concat.apply([], features); // Flatten array of arrays
      return Object.assign({}, state, {
        countries,
        boundaries
      });

    case STATS_FETCH_SUCCEEDED:
      return Object.assign({}, state, {
        generalStats: Object.assign({}, state.generalStats, action.data),
      });

    default:
      break;
  }

  return state;
}
