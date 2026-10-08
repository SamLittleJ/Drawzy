import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import api, { setToken } from './api';
import { AppRoutes } from './App';

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  );
}

describe('routing', () => {
  it('redirects anonymous users from the lobby to the login page', () => {
    renderAt('/lobby');

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('lets logged-in users into the lobby', async () => {
    vi.spyOn(api, 'fetchRooms').mockResolvedValue({ data: [] });
    setToken('jwt-token');

    renderAt('/lobby');

    expect(await screen.findByRole('heading', { name: 'Lobby' })).toBeInTheDocument();
  });

  it('sends unknown paths to the home page', () => {
    renderAt('/does/not/exist');

    expect(screen.getByRole('heading', { name: 'Drawzy' })).toBeInTheDocument();
  });
});
