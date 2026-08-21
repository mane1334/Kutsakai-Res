package com.example.data.remote

import android.util.Log
import com.example.BuildConfig
import com.example.data.model.ChatMessage
import com.example.data.model.Dish
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class GeminiAiService {
    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private val systemPrompt = """
        Você é o Sommelier e Concierge Virtual inteligente do restaurante gourmet 'Interactive Restaurantes'.
        Seu objetivo é ajudar os clientes na mesa do tablet com recomendações personalizadas do cardápio, harmonizações perfeitas de vinhos e coquetéis, esclarecer dúvidas sobre alergias alimentares (glúten, lactose, nozes, etc.), opções vegetarianas e ingredientes dos pratos.
        
        Cardápio Oficial Disponível:
        1. Fettuccine com Trufas Negras e Parmigiano (MT 78,00) - Massa fresca com manteiga de trufas toscanas, parmesão 24m. Harmoniza com Chianti Classico ou Pinot Noir. (Vegetariano)
        2. Salmão Grelhado com Aspargos e Molho Cítrico (MT 89,00) - Salmão norueguês crocante com limão siciliano. Harmoniza com Sauvignon Blanc ou Chardonnay. (Sem Glúten)
        3. Black Angus Burger Artesanal (MT 62,00) - 200g Black Angus, cheddar inglês, bacon caramelizado, brioche. Harmoniza com Cerveja IPA ou Syrah.
        4. Petit Gâteau Chocolat Grand Cru (MT 38,00) - Chocolate belga 70%, gelato baunilha Madagascar. Harmoniza com Vinho do Porto Tawny 10 Anos. (Vegetariano)
        5. Cocktail Signature Velvet Sunset (MT 42,00) - Gin botânico, hibisco, flor de sabugueiro e laranja sanguínea defumada.
        6. Carpaccio Clássico de Mignon Trufado (MT 54,00) - Mignon cru, azeite trufado, Grana Padano, alcaparras. (Sem Glúten)
        
        Seja sempre cordial, refinado, acolhedor e objetivo. Responda em Português ou Inglês conforme o cliente falar. Destaque os sabores e dê dicas sensoriais.
    """.trimIndent()

    suspend fun sendMessage(prompt: String, availableDishes: List<Dish>, isEnglish: Boolean = false): String = withContext(Dispatchers.IO) {
        val apiKey = try {
            BuildConfig.GEMINI_API_KEY
        } catch (e: Throwable) {
            ""
        }

        if (!apiKey.isNullOrBlank() && apiKey != "MY_GEMINI_API_KEY") {
            try {
                val url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$apiKey"

                val jsonBody = JSONObject().apply {
                    val contentsArray = JSONArray().apply {
                        put(JSONObject().apply {
                            put("role", "user")
                            put("parts", JSONArray().apply {
                                put(JSONObject().apply { put("text", prompt) })
                            })
                        })
                    }
                    put("contents", contentsArray)

                    val systemInst = JSONObject().apply {
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply { put("text", systemPrompt) })
                        })
                    }
                    put("systemInstruction", systemInst)
                }

                val request = Request.Builder()
                    .url(url)
                    .post(jsonBody.toString().toRequestBody("application/json".toMediaType()))
                    .build()

                val response = client.newCall(request).execute()
                val responseString = response.body?.string()

                if (response.isSuccessful && responseString != null) {
                    val root = JSONObject(responseString)
                    val candidates = root.optJSONArray("candidates")
                    if (candidates != null && candidates.length() > 0) {
                        val firstCandidate = candidates.getJSONObject(0)
                        val content = firstCandidate.optJSONObject("content")
                        val parts = content?.optJSONArray("parts")
                        val text = parts?.optJSONObject(0)?.optString("text")
                        if (!text.isNullOrBlank()) {
                            return@withContext text.trim()
                        }
                    }
                }
            } catch (e: Exception) {
                Log.w("GeminiAiService", "Direct API error, falling back to culinary knowledge base: ${e.message}")
            }
        }

        // Intelligent Culinary Knowledge Base Fallback
        return@withContext generateSmartCulinaryResponse(prompt, availableDishes, isEnglish)
    }

    private fun generateSmartCulinaryResponse(prompt: String, dishes: List<Dish>, isEnglish: Boolean): String {
        val p = prompt.lowercase()

        if (p.contains("vinho") || p.contains("wine") || p.contains("harmoniz") || p.contains("pair")) {
            if (p.contains("salmão") || p.contains("salmon") || p.contains("peixe") || p.contains("fish")) {
                return if (isEnglish) {
                    "🍷 **Sommelier's Pairing**: For our crispy **Pan-Seared Salmon**, I highly recommend a crisp New Zealand Sauvignon Blanc or an oaked Chardonnay. The bright acidity cuts through the salmon's rich buttery glaze exquisitely!"
                } else {
                    "🍷 **Harmonização do Sommelier**: Para o nosso **Salmão Grelhado**, recomendo com entusiasmo um Sauvignon Blanc Neozelandês bem fresco ou um Chardonnay amadeirado. A acidez cítrica equilibra com maestria a untuosidade e o molho de manteiga de ervas!"
                }
            }
            if (p.contains("fettuccine") || p.contains("pasta") || p.contains("massa") || p.contains("trufa")) {
                return if (isEnglish) {
                    "🍷 **Sommelier's Pairing**: The **Black Truffle Fettuccine** marries heavenly with a Chianti Classico Riserva DOCG or an earthy Pinot Noir. The delicate mushroom and earth notes elevate the truffle aroma."
                } else {
                    "🍷 **Harmonização do Sommelier**: O **Fettuccine com Trufas Negras** é a combinação sublime para um Chianti Classico Riserva DOCG ou um Pinot Noir elegante. As notas terrosas complementam perfeitamente o perfume das trufas toscanas!"
                }
            }
            if (p.contains("burger") || p.contains("angus") || p.contains("carne") || p.contains("beef")) {
                return if (isEnglish) {
                    "🍺🍷 **Pairing Note**: For the **Black Angus Burger**, pairing it with an artisanal Craft IPA Beer or a robust Syrah with black pepper undertones creates a sensational dining experience."
                } else {
                    "🍺🍷 **Dica de Harmonização**: Para o **Black Angus Burger Artesanal**, você vai adorar acompanhar com uma Cerveja IPA bem lupulada ou um vinho tinto Syrah encorpado, que abraça as notas defumadas do bacon caramelizado."
                }
            }
            return if (isEnglish) {
                "🍷 Our sommelier cellar highlights classic Italian Chiantis, French Burgundies, and refreshing New Zealand whites. Let me know what dish you are selecting for a tailored recommendation!"
            } else {
                "🍷 Nossa adega possui rótulos selecionados de Chianti italiano, Pinot Noir francês, Sauvignon Blanc e excelentes espumantes. Diga-me qual prato você gostaria de saborear para uma recomendação exclusiva!"
            }
        }

        if (p.contains("vegetar") || p.contains("veggie") || p.contains("carne não") || p.contains("sem carne")) {
            return if (isEnglish) {
                "🥬 **Vegetarian Highlights**:\n• **Black Truffle Fettuccine & Parmigiano**: Fresh handcrafted pasta bathed in exquisite black truffle emulsion (MT 78.00).\n• **Grand Cru Molten Lava Cake**: Served with Madagascar vanilla gelato and raspberries (MT 38.00)."
            } else {
                "🥬 **Opções Vegetarianas Especiais**:\n• **Fettuccine com Trufas Negras e Parmigiano**: Nossa massa artesanal fresca com emulsão aveludada de trufas e lascas de parmesão 24 meses (MT 78,00).\n• **Petit Gâteau Grand Cru**: Bolo vulcão de chocolate belga com gelato de baunilha de Madagascar (MT 38,00)."
            }
        }

        if (p.contains("glúten") || p.contains("gluten") || p.contains("celíac") || p.contains("celiac")) {
            return if (isEnglish) {
                "🌾 **Gluten-Free Selections**:\n• **Pan-Seared Norwegian Salmon**: Served with char-grilled asparagus and lemon glaze.\n• **Classic Truffled Beef Carpaccio**: Thin tenderloin slices with microgreens (request without sourdough crostini)."
            } else {
                "🌾 **Opções Sem Glúten**:\n• **Salmão Grelhado com Aspargos**: Filé nobre fresco sobre aspargos na brasa e molho cítrico.\n• **Carpaccio Clássico Trufado**: Lâminas finas de mignon cru com Grana Padano (solicite sem as torradas)."
            }
        }

        if (p.contains("sobremesa") || p.contains("dessert") || p.contains("doce") || p.contains("sweet")) {
            return if (isEnglish) {
                "🍫 **Chef's Irresistible Dessert**: Our **Grand Cru Molten Lava Cake** is made with 70% pure Belgian dark chocolate, overflowing warm ganache, paired with Madagascar vanilla bean gelato! (MT 38.00)"
            } else {
                "🍫 **Sobremesa Imperdível do Chef**: O **Petit Gâteau Chocolat Grand Cru** é preparado com chocolate belga 70% cacau, centro cremoso fumegante e acompanhado do nosso gelato artesanal de baunilha de Madagascar! (MT 38,00)"
            }
        }

        if (p.contains("rápido") || p.contains("quick") || p.contains("pressa") || p.contains("tempo")) {
            return if (isEnglish) {
                "⚡ **Quickest Dishes**:\n• **Classic Truffled Carpaccio**: 10 minutes.\n• **Black Angus Gourmet Burger**: 15 minutes.\n• **Black Truffle Fettuccine**: 18 minutes."
            } else {
                "⚡ **Pratos Mais Rápidos**:\n• **Carpaccio Clássico Trufado**: ~10 minutos.\n• **Petit Gâteau Grand Cru**: ~12 minutos.\n• **Black Angus Burger Artesanal**: ~15 minutos."
            }
        }

        return if (isEnglish) {
            "👨‍🍳 Welcome to **Interactive Restaurantes**! I am your AI Sommelier and Culinary Concierge. I can suggest dishes, tell you about ingredients, recommend wine pairings, or assist with dietary needs. What would you like to explore today?"
        } else {
            "👨‍🍳 Seja bem-vindo ao **Interactive Restaurantes**! Sou seu Sommelier e Concierge Virtual. Posso recomendar os melhores pratos do chef, harmonizações com vinhos nobres, sugerir opções sem glúten/vegetarianas ou esclarecer qualquer dúvida sobre o menu. Como posso ajudá-lo agora?"
        }
    }
}
