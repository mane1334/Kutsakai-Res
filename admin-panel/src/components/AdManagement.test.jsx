import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import AdManagement from './AdManagement';

describe('AdManagement', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
  });

  test('renders AdManagement component', async () => {
    render(<AdManagement />);
    expect(await screen.findByText(/Gerencie campanhas e comunicados/i)).toBeInTheDocument();
  });
});

