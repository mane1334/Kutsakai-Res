package com.example.data.local

import com.example.data.model.Category
import com.example.data.model.DietaryTag
import com.example.data.model.Dish

object SampleData {
    val categories = listOf(
        Category("cat_destaques", "Destaques do Chef", "Chef's Specials", "star", 1),
        Category("cat_entradas", "Entradas & Tapas", "Starters & Tapas", "restaurant", 2),
        Category("cat_principais", "Pratos Principais", "Main Courses", "lunch_dining", 3),
        Category("cat_massas", "Massas Artesanais", "Artisanal Pasta", "ramen_dining", 4),
        Category("cat_sobremesas", "Sobremesas", "Desserts", "cake", 5),
        Category("cat_bebidas", "Bebidas & Vinhos", "Drinks & Wine", "wine_bar", 6)
    )

    val dishes = listOf(
        Dish(
            id = "dish_1",
            name = "Fettuccine com Trufas Negras e Parmigiano",
            nameEn = "Black Truffle Fettuccine & Parmigiano",
            description = "Fettuccine artesanal fresco com emulsão de manteiga de trufas negras da Toscana, lascas de Parmigiano Reggiano 24 meses e ervas finas da horta.",
            descriptionEn = "Handmade fresh fettuccine tossed in Tuscan black truffle butter emulsion, 24-month aged Parmigiano Reggiano shavings, and fresh garden herbs.",
            price = 78.0,
            categoryId = "cat_massas",
            drawableResName = "dish_truffle_pasta",
            prepTimeMinutes = 18,
            calories = 620,
            rating = 4.9,
            reviewCount = 142,
            tags = listOf(DietaryTag.VEGETARIAN, DietaryTag.POPULAR, DietaryTag.CHEF_SPECIAL),
            ingredientsPt = listOf("Massa artesanal", "Trufas negras", "Manteiga francesa", "Parmesão 24 meses", "Tomilho fresco"),
            ingredientsEn = listOf("Artisanal pasta", "Black truffles", "French butter", "24mo Parmesan", "Fresh thyme"),
            winePairingPt = "Chianti Classico Riserva DOCG ou Pinot Noir",
            winePairingEn = "Chianti Classico Riserva DOCG or Pinot Noir",
            isFeatured = true
        ),
        Dish(
            id = "dish_2",
            name = "Salmão Grelhado com Aspargos e Molho Cítrico",
            nameEn = "Pan-Seared Salmon with Asparagus & Citrus Glaze",
            description = "Filé de salmão norueguês com pele crocante, servido sobre aspargos grelhados na brasa e emulsão aveludada de limão siciliano e manteiga de ervas.",
            descriptionEn = "Crispy skin Norwegian salmon fillet served over charcoal-grilled asparagus with a velvety Sicilian lemon and herb butter reduction.",
            price = 89.0,
            categoryId = "cat_principais",
            drawableResName = "dish_salmon_fillet",
            prepTimeMinutes = 20,
            calories = 510,
            rating = 4.8,
            reviewCount = 98,
            tags = listOf(DietaryTag.GLUTEN_FREE, DietaryTag.POPULAR),
            ingredientsPt = listOf("Salmão norueguês", "Aspargos verdes", "Limão siciliano", "Azeite extravirgem", "Flor de sal"),
            ingredientsEn = listOf("Norwegian salmon", "Green asparagus", "Sicilian lemon", "Extra virgin olive oil", "Fleur de sel"),
            winePairingPt = "Sauvignon Blanc Neozelandês ou Chardonnay Amadeirado",
            winePairingEn = "New Zealand Sauvignon Blanc or Oaked Chardonnay",
            isFeatured = true
        ),
        Dish(
            id = "dish_3",
            name = "Black Angus Burger Artesanal com Bacon Glaciado",
            nameEn = "Artisanal Black Angus Burger with Maple Bacon",
            description = "200g de blend Black Angus grelhado no ponto perfeito, queijo cheddar inglês fundido, bacon caramelizado, cebola crispy em pão brioche amanteigado, com batatas rústicas.",
            descriptionEn = "200g prime Black Angus beef patty, melted English cheddar, maple-glazed crispy bacon, and crispy onions on a toasted brioche bun, served with rustic fries.",
            price = 62.0,
            categoryId = "cat_principais",
            drawableResName = "dish_gourmet_burger",
            prepTimeMinutes = 15,
            calories = 840,
            rating = 4.9,
            reviewCount = 215,
            tags = listOf(DietaryTag.POPULAR, DietaryTag.NEW),
            ingredientsPt = listOf("Blend Black Angus 200g", "Queijo Cheddar", "Bacon caramelizado", "Pão Brioche", "Batatas rústicas"),
            ingredientsEn = listOf("200g Black Angus blend", "Cheddar cheese", "Maple bacon", "Brioche bun", "Rustic fries"),
            winePairingPt = "Cerveja IPA Artesanal ou Syrah Encorpado",
            winePairingEn = "Craft IPA Beer or Bold Syrah",
            isFeatured = true
        ),
        Dish(
            id = "dish_4",
            name = "Petit Gâteau Chocolat Grand Cru com Gelato",
            nameEn = "Grand Cru Molten Lava Cake with Gelato",
            description = "Bolo vulcão de chocolate belga 70% cacau com coração cremoso fumegante, acompanhado de gelato artesanal de baunilha de Madagascar e framboesas frescas.",
            descriptionEn = "Belgian 70% dark chocolate lava cake with a warm melting ganache core, paired with Madagascar vanilla bean gelato and tart fresh raspberries.",
            price = 38.0,
            categoryId = "cat_sobremesas",
            drawableResName = "dish_chocolate_dessert",
            prepTimeMinutes = 12,
            calories = 490,
            rating = 5.0,
            reviewCount = 310,
            tags = listOf(DietaryTag.VEGETARIAN, DietaryTag.POPULAR, DietaryTag.CHEF_SPECIAL),
            ingredientsPt = listOf("Chocolate Belga 70%", "Baunilha de Madagascar", "Ovos caipiras", "Manteiga", "Framboesas frescas"),
            ingredientsEn = listOf("70% Belgian chocolate", "Madagascar vanilla", "Free-range eggs", "Butter", "Fresh raspberries"),
            winePairingPt = "Vinho do Porto Tawny 10 Anos ou Espresso Duplo",
            winePairingEn = "Tawny Port 10 Years or Double Espresso",
            isFeatured = true
        ),
        Dish(
            id = "dish_5",
            name = "Cocktail Signature 'Velvet Sunset'",
            nameEn = "Signature 'Velvet Sunset' Cocktail",
            description = "Gin botânico premium infusionado com hibisco, xarope artesanal de laranja sanguínea, licor de flor de sabugueiro e ramo defumado de alecrim.",
            descriptionEn = "Premium botanical gin infused with hibiscus, artisanal blood orange reduction, elderflower liqueur, and a smoked rosemary sprig.",
            price = 42.0,
            categoryId = "cat_bebidas",
            drawableResName = "dish_signature_drink",
            prepTimeMinutes = 6,
            calories = 180,
            rating = 4.9,
            reviewCount = 85,
            tags = listOf(DietaryTag.GLUTEN_FREE, DietaryTag.NEW),
            ingredientsPt = listOf("Gin premium", "Laranja sanguínea", "Flor de sabugueiro", "Hibisco", "Alecrim fresco"),
            ingredientsEn = listOf("Premium gin", "Blood orange", "Elderflower", "Hibiscus", "Fresh rosemary"),
            winePairingPt = "Harmoniza com entradas e tapas",
            winePairingEn = "Pairs nicely with starters and tapas",
            isFeatured = true
        ),
        Dish(
            id = "dish_6",
            name = "Carpaccio Clássico de Mignon Trufado",
            nameEn = "Classic Truffled Beef Carpaccio",
            description = "Finas lâminas de filé mignon cru, azeite trufado, alcaparras crocantes, lascas de Grana Padano e brotos orgânicos com torradas de fermentação natural.",
            descriptionEn = "Thinly sliced raw tenderloin, truffle olive oil, crispy capers, Grana Padano shavings, and microgreens with artisanal sourdough crostini.",
            price = 54.0,
            categoryId = "cat_entradas",
            drawableResName = "hero_restaurant_banner",
            prepTimeMinutes = 10,
            calories = 340,
            rating = 4.7,
            reviewCount = 64,
            tags = listOf(DietaryTag.GLUTEN_FREE, DietaryTag.POPULAR),
            ingredientsPt = listOf("Filé mignon", "Azeite trufado", "Alcaparras", "Grana Padano", "Crostini"),
            ingredientsEn = listOf("Beef tenderloin", "Truffle oil", "Capers", "Grana Padano", "Crostini"),
            winePairingPt = "Prosecco Valdobbiadene DOCG",
            winePairingEn = "Prosecco Valdobbiadene DOCG",
            isFeatured = false
        )
    )
}
