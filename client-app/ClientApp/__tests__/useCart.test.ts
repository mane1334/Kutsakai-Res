import { renderHook, act } from '@testing-library/react-native';
import { useCart } from '../hooks/useCart';

describe('useCart', () => {
    const mockDish = { id: 1, name: 'Pizza', description: 'Delicious', price: 25.0 };
    const mockDish2 = { id: 2, name: 'Burger', description: 'Juicy', price: 18.5 };

    it('starts with empty cart', () => {
        const { result } = renderHook(() => useCart());
        expect(result.current.cart).toEqual([]);
        expect(result.current.total).toBe(0);
        expect(result.current.itemCount).toBe(0);
    });

    it('adds item to cart', () => {
        const { result } = renderHook(() => useCart());
        act(() => { result.current.addToCart(mockDish); });

        expect(result.current.cart).toHaveLength(1);
        expect(result.current.cart[0].name).toBe('Pizza');
        expect(result.current.cart[0].quantity).toBe(1);
        expect(result.current.itemCount).toBe(1);
        expect(result.current.total).toBe(25.0);
    });

    it('adds item with custom quantity', () => {
        const { result } = renderHook(() => useCart());
        act(() => { result.current.addToCart(mockDish, 3); });

        expect(result.current.cart[0].quantity).toBe(3);
        expect(result.current.itemCount).toBe(3);
        expect(result.current.total).toBe(75.0);
    });

    it('increments quantity for existing item', () => {
        const { result } = renderHook(() => useCart());
        act(() => { result.current.addToCart(mockDish); });
        act(() => { result.current.addToCart(mockDish); });

        expect(result.current.cart).toHaveLength(1);
        expect(result.current.cart[0].quantity).toBe(2);
        expect(result.current.total).toBe(50.0);
    });

    it('removes item from cart', () => {
        const { result } = renderHook(() => useCart());
        act(() => { result.current.addToCart(mockDish); });
        act(() => { result.current.addToCart(mockDish2); });
        act(() => { result.current.removeFromCart(1); });

        expect(result.current.cart).toHaveLength(1);
        expect(result.current.cart[0].name).toBe('Burger');
    });

    it('changes quantity', () => {
        const { result } = renderHook(() => useCart());
        act(() => { result.current.addToCart(mockDish); });
        act(() => { result.current.changeQuantity(1, 5); });

        expect(result.current.cart[0].quantity).toBe(5);
        expect(result.current.total).toBe(125.0);
    });

    it('does not allow quantity below 1', () => {
        const { result } = renderHook(() => useCart());
        act(() => { result.current.addToCart(mockDish); });
        act(() => { result.current.changeQuantity(1, 0); });

        expect(result.current.cart[0].quantity).toBe(1);
    });

    it('clears cart', () => {
        const { result } = renderHook(() => useCart());
        act(() => { result.current.addToCart(mockDish); });
        act(() => { result.current.addToCart(mockDish2); });
        act(() => { result.current.clearCart(); });

        expect(result.current.cart).toEqual([]);
        expect(result.current.total).toBe(0);
        expect(result.current.itemCount).toBe(0);
    });

    it('calls onItemAdded callback', () => {
        const onItemAdded = jest.fn();
        const { result } = renderHook(() => useCart({ onItemAdded }));
        act(() => { result.current.addToCart(mockDish, 2); });

        expect(onItemAdded).toHaveBeenCalledWith('Pizza', 2);
    });

    it('calculates total with multiple items', () => {
        const { result } = renderHook(() => useCart());
        act(() => { result.current.addToCart(mockDish, 2); });
        act(() => { result.current.addToCart(mockDish2, 3); });

        expect(result.current.total).toBe(2 * 25.0 + 3 * 18.5);
        expect(result.current.itemCount).toBe(5);
    });
});
