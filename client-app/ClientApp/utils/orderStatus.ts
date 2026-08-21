import type { OrderStatus } from '../types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Aguardando confirmacao',
  preparing: 'Em preparo',
  completed: 'Pronto',
  cancelled: 'Cancelado',
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'A cozinha recebeu o pedido e vai confirmar o preparo.',
  preparing: 'A cozinha esta preparando o seu pedido.',
  completed: 'O pedido esta pronto e sera levado ate a mesa.',
  cancelled: 'O pedido foi cancelado.',
};

export const normalizeOrderStatus = (status?: string | null): OrderStatus => {
  if (status === 'preparing' || status === 'completed' || status === 'cancelled') {
    return status;
  }
  return 'pending';
};

export const getOrderStatusLabel = (status?: string | null) => ORDER_STATUS_LABELS[normalizeOrderStatus(status)];

export const getOrderStatusDescription = (status?: string | null) => ORDER_STATUS_DESCRIPTIONS[normalizeOrderStatus(status)];
