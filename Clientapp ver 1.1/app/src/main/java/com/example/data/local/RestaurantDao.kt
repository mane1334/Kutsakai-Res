package com.example.data.local

import androidx.room.*
import com.example.data.model.*
import kotlinx.coroutines.flow.Flow

@Dao
interface RestaurantDao {

    // Dishes
    @Query("SELECT * FROM dishes")
    fun getAllDishes(): Flow<List<Dish>>

    @Query("SELECT COUNT(*) FROM dishes")
    suspend fun getDishCount(): Int

    @Query("SELECT * FROM dishes WHERE categoryId = :categoryId")
    fun getDishesByCategory(categoryId: String): Flow<List<Dish>>

    @Query("SELECT * FROM dishes WHERE isFeatured = 1")
    fun getFeaturedDishes(): Flow<List<Dish>>

    @Query("SELECT * FROM dishes WHERE id = :id")
    suspend fun getDishById(id: String): Dish?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDishes(dishes: List<Dish>)

    @Query("DELETE FROM dishes")
    suspend fun clearDishes()

    // Advertisements (Ads Module)
    @Query("SELECT * FROM advertisements ORDER BY priority DESC, id ASC")
    fun getAllAds(): Flow<List<Advertisement>>

    @Query("SELECT * FROM advertisements WHERE isActive = 1 ORDER BY priority DESC, id ASC")
    fun getActiveAds(): Flow<List<Advertisement>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAds(ads: List<Advertisement>)

    @Query("DELETE FROM advertisements")
    suspend fun clearAds()

    // Categories
    @Query("SELECT * FROM categories ORDER BY sortOrder ASC")
    fun getAllCategories(): Flow<List<Category>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategories(categories: List<Category>)

    @Query("DELETE FROM categories")
    suspend fun clearCategories()

    // Cart
    @Query("SELECT * FROM cart_items")
    fun getCartItems(): Flow<List<CartItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCartItem(item: CartItem)

    @Update
    suspend fun updateCartItem(item: CartItem)

    @Delete
    suspend fun deleteCartItem(item: CartItem)

    @Query("DELETE FROM cart_items WHERE localId = :id")
    suspend fun deleteCartItemById(id: Long)

    @Query("DELETE FROM cart_items")
    suspend fun clearCart()

    // Orders
    @Query("SELECT * FROM orders ORDER BY createdAtTimestamp DESC")
    fun getAllOrders(): Flow<List<Order>>

    @Query("SELECT * FROM orders WHERE status != 'DELIVERED' AND status != 'CANCELLED' ORDER BY createdAtTimestamp DESC LIMIT 1")
    fun getActiveOrder(): Flow<Order?>

    @Query("SELECT * FROM orders WHERE orderId = :orderId")
    suspend fun getOrderById(orderId: String): Order?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: Order)

    @Update
    suspend fun updateOrder(order: Order)

    @Query("DELETE FROM orders")
    suspend fun clearOrders()

    @Query("UPDATE orders SET status = :status WHERE orderId = :orderId")
    suspend fun updateOrderStatus(orderId: String, status: OrderStatus)

    // Waiter Calls
    @Query("SELECT * FROM waiter_calls ORDER BY timestamp DESC")
    fun getAllWaiterCalls(): Flow<List<WaiterCall>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWaiterCall(call: WaiterCall)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWaiterCalls(calls: List<WaiterCall>)

    @Update
    suspend fun updateWaiterCall(call: WaiterCall)

    @Query("DELETE FROM waiter_calls")
    suspend fun clearWaiterCalls()

    // Ratings
    @Query("SELECT * FROM ratings ORDER BY timestamp DESC")
    fun getAllRatings(): Flow<List<RatingRecord>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRating(rating: RatingRecord)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRatings(ratings: List<RatingRecord>)

    @Query("DELETE FROM ratings")
    suspend fun clearRatings()
}
