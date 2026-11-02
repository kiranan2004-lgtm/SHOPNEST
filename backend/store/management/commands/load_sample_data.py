from django.core.management.base import BaseCommand
from decimal import Decimal
from store.models import Category, Product


SAMPLE_CATEGORIES = [
    {
        'name': 'Electronics',
        'slug': 'electronics',
        'description': 'Latest gadgets, audio gear, smartphones, and cutting-edge tech accessories.'
    },
    {
        'name': 'Fashion',
        'slug': 'fashion',
        'description': 'Trendy clothing, luxury watches, stylish footwear, and premium everyday wear.'
    },
    {
        'name': 'Home & Kitchen',
        'slug': 'home-kitchen',
        'description': 'Modern home appliances, cookware, aesthetic lighting, and comfort living.'
    },
    {
        'name': 'Books & Stationery',
        'slug': 'books-stationery',
        'description': 'Bestselling books, planners, minimalist notebooks, and fine writing instruments.'
    },
    {
        'name': 'Sports & Fitness',
        'slug': 'sports-fitness',
        'description': 'Gym gear, yoga accessories, durable water bottles, and workout essentials.'
    },
]

SAMPLE_PRODUCTS = [
    # Electronics
    {
        'category_slug': 'electronics',
        'name': 'AeroSound Pro Wireless Headphones',
        'slug': 'aerosound-pro-wireless-headphones',
        'description': 'Active noise-cancelling over-ear headphones with 40-hour battery life, high-res spatial audio, and memory foam ear cushions.',
        'price': Decimal('4999.00'),
        'stock': 25,
        'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    },
    {
        'category_slug': 'electronics',
        'name': 'PulseFit Active Smartwatch',
        'slug': 'pulsefit-active-smartwatch',
        'description': 'Vibrant AMOLED display with 24/7 heart rate, SpO2 monitoring, GPS tracking, and 12-day battery life.',
        'price': Decimal('2999.00'),
        'stock': 18,
        'image_url': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    },
    {
        'category_slug': 'electronics',
        'name': 'NovaSound Portable Bluetooth Speaker',
        'slug': 'novasound-portable-bluetooth-speaker',
        'description': 'Waterproof IPX7 outdoor speaker featuring 360-degree punchy bass, 20W output, and 16 hours of continuous playtime.',
        'price': Decimal('1999.00'),
        'stock': 30,
        'image_url': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80',
    },
    {
        'category_slug': 'electronics',
        'name': 'Precision Mechanical Gaming Keyboard',
        'slug': 'precision-mechanical-gaming-keyboard',
        'description': 'RGB backlit mechanical keyboard with hot-swappable tactile brown switches, aircraft-grade aluminum frame, and detachable USB-C cable.',
        'price': Decimal('3499.00'),
        'stock': 12,
        'image_url': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    },

    # Fashion
    {
        'category_slug': 'fashion',
        'name': 'Classic Oxford Cotton Button-Down Shirt',
        'slug': 'classic-oxford-cotton-shirt',
        'description': 'Tailored fit 100% breathable Egyptian cotton shirt designed for effortless business casual and weekend wear.',
        'price': Decimal('1499.00'),
        'stock': 40,
        'image_url': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
    },
    {
        'category_slug': 'fashion',
        'name': 'Urban Minimalist Leather Backpack',
        'slug': 'urban-minimalist-leather-backpack',
        'description': 'Handcrafted water-resistant vegan leather bag featuring dedicated 15.6-inch padded laptop sleeve and hidden anti-theft pockets.',
        'price': Decimal('2799.00'),
        'stock': 15,
        'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    },
    {
        'category_slug': 'fashion',
        'name': 'Heritage Chronograph Wristwatch',
        'slug': 'heritage-chronograph-wristwatch',
        'description': 'Elegant sapphire crystal dial with genuine brown Italian leather strap and Japanese quartz movement.',
        'price': Decimal('3999.00'),
        'stock': 10,
        'image_url': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
    },
    {
        'category_slug': 'fashion',
        'name': 'Strider Cloudfoam Running Sneakers',
        'slug': 'strider-cloudfoam-running-sneakers',
        'description': 'Ultra-lightweight shock-absorbing sole with breathable knit mesh upper engineered for all-day running comfort.',
        'price': Decimal('2499.00'),
        'stock': 22,
        'image_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    },

    # Home & Kitchen
    {
        'category_slug': 'home-kitchen',
        'name': 'Barista Touch Stainless Steel French Press',
        'slug': 'barista-touch-french-press',
        'description': 'Double-walled insulated coffee maker retaining heat for 4 hours while delivering rich, sediment-free aromatic coffee.',
        'price': Decimal('1299.00'),
        'stock': 35,
        'image_url': 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
    },
    {
        'category_slug': 'home-kitchen',
        'name': 'AromaGlow Ceramic Essential Oil Diffuser',
        'slug': 'aromaglow-ceramic-diffuser',
        'description': 'Ultrasonic quiet cool-mist diffuser with ambient warm LED light and automatic shut-off safety protection.',
        'price': Decimal('1199.00'),
        'stock': 20,
        'image_url': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
    },

    # Books & Stationery
    {
        'category_slug': 'books-stationery',
        'name': 'Artisan Hardbound Dotted Journal',
        'slug': 'artisan-hardbound-dotted-journal',
        'description': 'Premium 160 GSM bleed-resistant ivory paper with lay-flat binding, pen loop, and dual ribbon bookmarks.',
        'price': Decimal('699.00'),
        'stock': 50,
        'image_url': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    },

    # Sports & Fitness
    {
        'category_slug': 'sports-fitness',
        'name': 'EcoGrip Pro Non-Slip Yoga Mat',
        'slug': 'ecogrip-pro-yoga-mat',
        'description': '6mm high-density eco-friendly TPE foam with dual-sided textured grip for superior joint cushioning and balance.',
        'price': Decimal('1599.00'),
        'stock': 28,
        'image_url': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80',
    },
]


class Command(BaseCommand):
    help = 'Loads realistic sample categories and products for SHOPNEST demonstration.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Loading SHOPNEST sample catalog data..."))

        # 1. Create categories
        categories_map = {}
        for cat_data in SAMPLE_CATEGORIES:
            cat, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={
                    'name': cat_data['name'],
                    'description': cat_data['description'],
                }
            )
            categories_map[cat.slug] = cat
            status_text = "Created" if created else "Existing"
            self.stdout.write(f"  Category [{status_text}]: {cat.name}")

        # 2. Create products
        for prod_data in SAMPLE_PRODUCTS:
            category = categories_map.get(prod_data['category_slug'])
            if not category:
                continue

            product, created = Product.objects.get_or_create(
                slug=prod_data['slug'],
                defaults={
                    'category': category,
                    'name': prod_data['name'],
                    'description': prod_data['description'],
                    'price': prod_data['price'],
                    'stock': prod_data['stock'],
                    'image_url': prod_data['image_url'],
                    'is_active': True,
                }
            )
            status_text = "Created" if created else "Existing"
            self.stdout.write(f"  Product [{status_text}]: {product.name} (Stock: {product.stock})")

        self.stdout.write(self.style.SUCCESS("Successfully loaded sample catalog data for SHOPNEST."))
