import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import OrderManagement from './OrderManagement';

vi.mock('../services/api', () => ({
  getOrders: vi.fn(() => Promise.resolve({ orders: [] })),
  updateOrderStatus: vi.fn(),
  updateOrderPrepTime: vi.fn(),
}));

vi.mock('../services/socket', () => ({
  subscribeToEvent: vi.fn(() => () => {}),
}));

describe('OrderManagement', () => {
  test('renders OrderManagement component', async () => {
    render(<OrderManagement />);
    expect(await screen.findByText(/Fila de producao em tempo real/i)).toBeInTheDocument();
  });
});

