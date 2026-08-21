export interface Dish {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    image_urls?: string[] | string;
    category_name?: string;
    average_rating?: number;
    preparation_time?: number;
    calories?: number;
    [key: string]: any;
}

export interface CartItem extends Dish {
    quantity: number;
}

export interface AdItem {
    id: number;
    image_url: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    [k: string]: any;
}

export type OrderStatus = 'pending' | 'preparing' | 'completed' | 'cancelled';

export interface Order {
    id: number;
    prepSeconds: number;
    cancelUntil?: string;
    preparingCancelUntil?: string;
    status?: OrderStatus;
}

export interface Settings {
    restaurant_name?: string;
    restaurant_logo_url?: string;
    opening_hours?: string;
    closing_hours?: string;
    inactivity_timeout_minutes?: number;
    menu_theme?: string;
    primary_color?: string;
    currency_symbol?: string;
    default_language?: string;
    enable_ai_chat?: boolean;
    enable_customer_ratings?: boolean;
    enable_ads_module?: boolean;
    screen_lock_enabled?: boolean;
    screen_lock_pin?: string;
    tables_count?: number;
    default_prep_time?: number;
    cancellation_window?: number;
    [key: string]: any;
}

