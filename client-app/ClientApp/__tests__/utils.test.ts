import { buildApiUrl, buildBaseUrl, buildWsUrl, normalizeServerHost } from '../utils/network';
import { resolveImageUrl } from '../utils/urlUtils';
import { isRestaurantOpen } from '../utils/openingHours';

describe('normalizeServerHost', () => {
    it('returns IP as-is', () => {
        expect(normalizeServerHost('192.168.1.10')).toBe('192.168.1.10');
    });

    it('strips http:// prefix', () => {
        expect(normalizeServerHost('http://192.168.1.10')).toBe('192.168.1.10');
    });

    it('strips https:// prefix', () => {
        expect(normalizeServerHost('https://192.168.1.10')).toBe('192.168.1.10');
    });

    it('strips trailing slash', () => {
        expect(normalizeServerHost('192.168.1.10/')).toBe('192.168.1.10');
    });

    it('strips :3000 port', () => {
        expect(normalizeServerHost('192.168.1.10:3000')).toBe('192.168.1.10');
    });

    it('handles empty string', () => {
        expect(normalizeServerHost('')).toBe('');
    });

    it('handles full URL with path and port', () => {
        expect(normalizeServerHost('http://192.168.1.10:3000/api')).toBe('192.168.1.10');
    });

    it('strips websocket protocols', () => {
        expect(normalizeServerHost('wss://example.com:3000')).toBe('example.com');
    });

    it('builds backend URLs from host values', () => {
        expect(buildBaseUrl('http://192.168.1.10:3000/api')).toBe('http://192.168.1.10:3000');
        expect(buildApiUrl('192.168.1.10')).toBe('http://192.168.1.10:3000/api');
        expect(buildWsUrl('192.168.1.10')).toBe('ws://192.168.1.10:3000');
    });
});

describe('resolveImageUrl', () => {
    const baseUrl = 'http://192.168.1.10:3000';

    it('returns placeholder for undefined', () => {
        const result = resolveImageUrl(undefined, baseUrl);
        expect(result).toContain('placeholder');
    });

    it('returns full URL as-is', () => {
        const url = 'https://example.com/image.jpg';
        expect(resolveImageUrl(url, baseUrl)).toBe(url);
    });

    it('resolves absolute path', () => {
        const result = resolveImageUrl('/uploads/img.jpg', baseUrl);
        expect(result).toBe(`${baseUrl}/uploads/img.jpg`);
    });

    it('resolves relative path', () => {
        const result = resolveImageUrl('uploads/img.jpg', baseUrl);
        expect(result).toBe(`${baseUrl}/uploads/img.jpg`);
    });
});

describe('isRestaurantOpen', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('returns true when within hours', () => {
        jest.setSystemTime(new Date('2026-03-26T14:00:00'));
        expect(isRestaurantOpen('08:00', '22:00')).toBe(true);
    });

    it('returns false when outside hours', () => {
        jest.setSystemTime(new Date('2026-03-26T23:30:00'));
        expect(isRestaurantOpen('08:00', '22:00')).toBe(false);
    });

    it('returns true when no hours specified', () => {
        expect(isRestaurantOpen(undefined, undefined)).toBe(true);
    });

    it('returns true on exact opening time', () => {
        jest.setSystemTime(new Date('2026-03-26T08:00:00'));
        expect(isRestaurantOpen('08:00', '22:00')).toBe(true);
    });
});
