package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import com.squareup.moshi.JsonClass
import com.squareup.moshi.Moshi
import com.squareup.moshi.Types

enum class AppThemeType(val displayName: String, val primaryHex: String, val bgHex: String) {
    LIGHT("Claro (Bistrô)", "#6D2430", "#FFF7ED"),
    DARK("Escuro (Wine)", "#FF6B9D", "#121212"),
    OCEAN("Ocean (Azul)", "#0277BD", "#E0F7FF"),
    SUNSET("Sunset (Laranja)", "#E65100", "#FFF3E0"),
    FOREST("Forest (Verde)", "#1B5E20", "#E8F5E9"),
    LUXURY("Luxury (Ouro)", "#D4AF37", "#1A1A1A")
}

enum class Language(val code: String, val displayName: String, val flag: String) {
    PT("pt", "Português", "🇧🇷"),
    EN("en", "English", "🇺🇸")
}

enum class DietaryTag(val labelPt: String, val labelEn: String, val icon: String) {
    SPICY("Picante", "Spicy", "🌶️"),
    VEGETARIAN("Vegetariano", "Vegetarian", "🥬"),
    GLUTEN_FREE("Sem Glúten", "Gluten Free", "🌾"),
    POPULAR("Popular", "Popular", "⭐"),
    CHEF_SPECIAL("Especial do Chef", "Chef's Special", "👨‍🍳"),
    NEW("Novo", "New", "🔥")
}

@Entity(tableName = "dishes")
@JsonClass(generateAdapter = true)
data class Dish(
    @PrimaryKey val id: String,
    val name: String,
    val nameEn: String,
    val description: String,
    val descriptionEn: String,
    val price: Double,
    val categoryId: String,
    val drawableResName: String = "hero_restaurant_banner",
    val prepTimeMinutes: Int = 15,
    val calories: Int = 0,
    val rating: Double = 5.0,
    val reviewCount: Int = 0,
    val tags: List<DietaryTag> = emptyList(),
    val ingredientsPt: List<String> = emptyList(),
    val ingredientsEn: List<String> = emptyList(),
    val winePairingPt: String? = null,
    val winePairingEn: String? = null,
    val isFeatured: Boolean = false,
    val imageUrl: String? = null
)

@Entity(tableName = "advertisements")
@JsonClass(generateAdapter = true)
data class Advertisement(
    @PrimaryKey val id: String,
    val title: String,
    val content: String = "",
    val imageUrl: String? = null,
    val startDate: String? = null,
    val endDate: String? = null,
    val isActive: Boolean = true,
    val priority: Int = 0
)

@Entity(tableName = "categories")
@JsonClass(generateAdapter = true)
data class Category(
    @PrimaryKey val id: String,
    val namePt: String,
    val nameEn: String,
    val iconName: String,
    val sortOrder: Int
)

@Entity(tableName = "cart_items")
@JsonClass(generateAdapter = true)
data class CartItem(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val dishId: String,
    val dishName: String,
    val dishNameEn: String,
    val unitPrice: Double,
    val quantity: Int,
    val notes: String = "",
    val drawableResName: String = "hero_restaurant_banner",
    val imageUrl: String? = null
)

enum class OrderStatus(val labelPt: String, val labelEn: String, val stepIndex: Int) {
    RECEIVED("Recebido", "Received", 0),
    PREPARING("Preparando", "Preparing", 1),
    READY("Pronto", "Ready", 2),
    DELIVERED("Entregue", "Delivered", 3),
    CANCELLED("Cancelado", "Cancelled", -1)
}

@Entity(tableName = "orders")
@JsonClass(generateAdapter = true)
data class Order(
    @PrimaryKey val orderId: String,
    val tableNumber: String,
    val itemsSummary: String,
    val totalAmount: Double,
    val status: OrderStatus,
    val createdAtTimestamp: Long = System.currentTimeMillis(),
    val estimatedMinutesRemaining: Int = 20,
    val kitchenNotes: String = ""
)

enum class WaiterCallType(val labelPt: String, val labelEn: String, val icon: String) {
    WAITER("Garçom", "Waiter", "🙋‍♂️"),
    KITCHEN("Cozinha", "Kitchen", "🍳"),
    MANAGER("Gerente", "Manager", "👔"),
    BILL("Conta / Pagamento", "Bill / Payment", "💳"),
    CLEAN_TABLE("Limpeza da Mesa", "Clean Table", "🧹")
}

enum class WaiterCallStatus(val labelPt: String, val labelEn: String) {
    PENDING("Pendente", "Pending"),
    IN_PROGRESS("A caminho", "On the way"),
    RESOLVED("Atendido", "Resolved")
}

@Entity(tableName = "waiter_calls")
@JsonClass(generateAdapter = true)
data class WaiterCall(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val type: WaiterCallType,
    val description: String,
    val tableNumber: String,
    val timestamp: Long = System.currentTimeMillis(),
    val status: WaiterCallStatus = WaiterCallStatus.PENDING
)

@Entity(tableName = "ratings")
@JsonClass(generateAdapter = true)
data class RatingRecord(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val overallStars: Int,
    val dishId: String? = null,
    val dishName: String? = null,
    val comment: String = "",
    val serviceRating: Int = 5,
    val ambianceRating: Int = 5,
    val foodRating: Int = 5,
    val timestamp: Long = System.currentTimeMillis()
)

data class ChatMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val text: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis(),
    val isAudio: Boolean = false,
    val recommendedDishId: String? = null
)
