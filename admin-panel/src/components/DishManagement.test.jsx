import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import DishManagement from './DishManagement';

vi.mock('../services/api', () => ({
  getDishes: vi.fn(() => Promise.resolve([])),
  createDish: vi.fn(),
  updateDish: vi.fn(),
  deleteDish: vi.fn(),
}));

describe('DishManagement', () => {
  test('renders DishManagement component', async () => {
    render(<DishManagement />);
    expect(await screen.findByText(/Gerencie pratos e disponibilidade/i)).toBeInTheDocument();
  });
});

