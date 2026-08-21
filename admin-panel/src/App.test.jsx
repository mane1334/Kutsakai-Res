import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders admin login link or text', async () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );
  const titleElement = await screen.findByText(/Gestão Pro/i);
  expect(titleElement).toBeInTheDocument();
});

