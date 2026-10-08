import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import api, { getToken } from '../api';
import LoginPage from './LoginPage';

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lobby" element={<h1>Lobby</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

async function submit(email, password) {
  await userEvent.type(screen.getByLabelText('Email'), email);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Login' }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('stores the token and goes to the lobby on success', async () => {
    const loginUser = vi.spyOn(api, 'loginUser').mockResolvedValue({ data: { access_token: 'jwt-token' } });
    renderLogin();

    await submit('ana@example.com', 'secret');

    expect(loginUser).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'secret' });
    expect(getToken()).toBe('jwt-token');
    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument();
  });

  it('shows the server error and stays on the page on failure', async () => {
    vi.spyOn(api, 'loginUser').mockRejectedValue({ response: { data: { detail: 'Invalid email or password' } } });
    renderLogin();

    await submit('ana@example.com', 'wrong');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(getToken()).toBeNull();
  });
});
