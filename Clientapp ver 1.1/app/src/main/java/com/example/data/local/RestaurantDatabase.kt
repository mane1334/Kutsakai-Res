package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.data.model.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        Dish::class,
        Category::class,
        CartItem::class,
        Order::class,
        WaiterCall::class,
        RatingRecord::class,
        Advertisement::class
    ],
    version = 2,
    exportSchema = false
)
@TypeConverters(RestaurantTypeConverters::class)
abstract class RestaurantDatabase : RoomDatabase() {
    abstract fun restaurantDao(): RestaurantDao

    companion object {
        @Volatile
        private var INSTANCE: RestaurantDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): RestaurantDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    RestaurantDatabase::class.java,
                    "interactive_restaurantes_db"
                )
                    .addCallback(DatabaseCallback(scope))
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback(
            private val scope: CoroutineScope
        ) : Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        populateInitialDataIfEmpty(database.restaurantDao())
                    }
                }
            }

            suspend fun populateInitialDataIfEmpty(dao: RestaurantDao) {
                if (dao.getDishCount() == 0) {
                    dao.insertCategories(SampleData.categories)
                    dao.insertDishes(SampleData.dishes)
                }
            }
        }
    }
}
