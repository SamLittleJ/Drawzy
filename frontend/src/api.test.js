import { describe, expect, it } from 'vitest';

import { clearToken, getErrorMessage, isLoggedIn, setToken } from './api';

describe('getErrorMessage', () => {
  it('returns the detail string of an HTTP error', () => {
    const error = { response: { data: { detail: 'Invalid email or password' } } };

    expect(getErrorMessage(error)).toBe('Invalid email or password');
  });

  it('joins the issues of a validation error', () => {
    const error = {
      response: { data: { detail: [{ msg: 'value is not a valid email address' }, { msg: 'Field required' }] } },
    };

    expect(getErrorMessage(error)).toBe('value is not a valid email address; Field required');
  });

  it('falls back when the server gave no usable detail', () => {
    expect(getErrorMessage(new Error('Network Error'), 'Login failed')).toBe('Login failed');
    expect(getErrorMessage({ response: { data: { detail: [] } } }, 'Login failed')).toBe('Login failed');
  });
});

describe('token storage', () => {
  it('tracks whether the user is logged in', () => {
    expect(isLoggedIn()).toBe(false);

    setToken('abc');
    expect(isLoggedIn()).toBe(true);

    clearToken();
    expect(isLoggedIn()).toBe(false);
  });
});
