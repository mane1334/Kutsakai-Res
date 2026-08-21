package com.example.data.local

import androidx.room.TypeConverter
import com.example.data.model.DietaryTag
import com.example.data.model.OrderStatus
import com.example.data.model.WaiterCallStatus
import com.example.data.model.WaiterCallType

class RestaurantTypeConverters {
    @TypeConverter
    fun fromDietaryTagList(tags: List<DietaryTag>?): String {
        return tags?.joinToString(",") { it.name } ?: ""
    }

    @TypeConverter
    fun toDietaryTagList(data: String?): List<DietaryTag> {
        if (data.isNullOrEmpty()) return emptyList()
        return data.split(",").mapNotNull {
            try {
                DietaryTag.valueOf(it.trim())
            } catch (e: Exception) {
                null
            }
        }
    }

    @TypeConverter
    fun fromStringList(list: List<String>?): String {
        return list?.joinToString(";;") ?: ""
    }

    @TypeConverter
    fun toStringList(data: String?): List<String> {
        if (data.isNullOrEmpty()) return emptyList()
        return data.split(";;").map { it.trim() }
    }

    @TypeConverter
    fun fromOrderStatus(status: OrderStatus): String = status.name

    @TypeConverter
    fun toOrderStatus(name: String): OrderStatus = try {
        OrderStatus.valueOf(name)
    } catch (e: Exception) {
        OrderStatus.RECEIVED
    }

    @TypeConverter
    fun fromWaiterCallType(type: WaiterCallType): String = type.name

    @TypeConverter
    fun toWaiterCallType(name: String): WaiterCallType = try {
        WaiterCallType.valueOf(name)
    } catch (e: Exception) {
        WaiterCallType.WAITER
    }

    @TypeConverter
    fun fromWaiterCallStatus(status: WaiterCallStatus): String = status.name

    @TypeConverter
    fun toWaiterCallStatus(name: String): WaiterCallStatus = try {
        WaiterCallStatus.valueOf(name)
    } catch (e: Exception) {
        WaiterCallStatus.PENDING
    }
}
