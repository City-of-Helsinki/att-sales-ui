// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { server } from './test/server';

beforeAll(() => {
  // Enable API mocking before tests.
  server.listen({ onUnhandledRequest: 'error' });
  // Set up enzyme
  Enzyme.configure({ adapter: new Adapter() });
});

beforeEach(() => {
  // Mock localstorage
  const localStorageMock = (() => {
    let store = new Map();
    return {
      getItem(key: string): string {
        return store.get(key);
      },
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      clear: () => {
        store = new Map();
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
  })();
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });

  // Mock sessionstorage
  const sessionStorageMock = (() => {
    let store = new Map();
    return {
      getItem(key: string): string {
        return store.get(key);
      },
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      clear: () => {
        store = new Map();
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
  })();
  Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });
});

afterEach(() => {
  // Reset any runtime request handlers we may add during the tests.
  server.resetHandlers();
  // Clear localstorage values
  window.localStorage.clear();
  // Clear sessionstorage values
  window.sessionStorage.clear();
});

// Disable API mocking after the tests are done.
afterAll(() => server.close());
