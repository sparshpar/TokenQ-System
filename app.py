from flask import Flask, jsonify, request, render_template, session
import time
import uuid

app = Flask(__name__)
app.secret_key = "hackathon-demo-secret"  # replace before any real deployment

CATEGORY_IMAGES = {
    "Beverages": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300",
    "Snacks": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300",
    "South Indian": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300",
    "Chinese (Veg)": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300",
    "Chinese (Non-Veg)": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300",
    "Chicken Items": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=300",
    "Paneer": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300",
    "Lunch": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300",
    "Egg Items": "https://images.unsplash.com/photo-1607690424560-35d967d6ad7c?w=300",
    "Frankie": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300",
    "Other Items": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300",
    "Shwarma": "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300",
    "Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300",
    "Burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300",
    "Chaat Items": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300",
    "Juices": "https://images.unsplash.com/photo-1546173159-315724a31696?w=300",
    "Milk Shakes": "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=300",
}
DEFAULT_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300"

# (name, category, price) — extracted from the Laxmi Balaji Hospitality board.
# '/'-priced items are split into separate orderable entries.
RAW_ITEMS = [
    ("Tea (Cutting)","Beverages",8),("Tea (Full)","Beverages",14),("Coffee","Beverages",20),
    ("Milk / Butter Milk","Beverages",20),("Lime Juice / Kokam Juice","Beverages",20),("Special Tea","Beverages",20),

    ("Upma","Snacks",35),("Poha","Snacks",30),("Masala Pav","Snacks",20),("Samosa (2 Pc)","Snacks",30),
    ("Batata Wada (1 Pc)","Snacks",30),("Pav Bhaji","Snacks",60),("Chhole Bhature","Snacks",60),
    ("Bread Butter","Snacks",20),("Bread Jam","Snacks",20),("Cheese Pav Bhaji","Snacks",60),
    ("Bread Butter Toast (2 Slice)","Snacks",25),("Veg. Sandwich","Snacks",40),("Toast Sandwich","Snacks",50),
    ("Veg. Grill Sandwich","Snacks",100),("Veg. Grill Cheese Sandwich","Snacks",100),
    ("Veg Cheese Toast","Snacks",120),("Veg Grilled Toast","Snacks",120),
    ("Sheera Pineapple","Snacks",30),("Dabeli","Snacks",20),("Pav Single","Snacks",5),

    ("Sada Dosa","South Indian",30),("Uthappa","South Indian",40),("Idli Sambar","South Indian",35),
    ("Masala Dosa","South Indian",50),("Schezwan Sada Dosa","South Indian",45),
    ("Schezwan Masala Dosa","South Indian",55),("Mysore Masala Dosa","South Indian",70),
    ("Onion Uthappa","South Indian",50),("Tomato Uthappa","South Indian",50),("Masala Uthappa","South Indian",50),
    ("Cheese Sada Dosa","South Indian",60),("Set Dosa","South Indian",40),("Cheese Masala Dosa","South Indian",70),

    ("Fried Rice (Half)","Chinese (Veg)",60),("Hakka Noodles (Half)","Chinese (Veg)",60),
    ("Schezwan Fried Rice (Half)","Chinese (Veg)",70),("Schezwan Noodles (Half)","Chinese (Veg)",70),
    ("Manchurian Dry","Chinese (Veg)",80),("Manchurian Gravy","Chinese (Veg)",80),
    ("Combo Rice","Chinese (Veg)",80),("Manchurian Fried Rice","Chinese (Veg)",80),
    ("Manchurian Noodles","Chinese (Veg)",80),("Paneer Chilly (6 Pcs)","Chinese (Veg)",90),

    ("Chicken Chilly","Chinese (Non-Veg)",110),("Chicken 65","Chinese (Non-Veg)",90),
    ("Chicken Crispy","Chinese (Non-Veg)",90),("Chicken Manchurian","Chinese (Non-Veg)",110),
    ("Chicken Lollipop","Chinese (Non-Veg)",100),("Chicken Lollipop Masala","Chinese (Non-Veg)",120),
    ("Chicken Fried Rice","Chinese (Non-Veg)",80),("Chicken Noodles","Chinese (Non-Veg)",80),
    ("Chicken Manchurian Rice","Chinese (Non-Veg)",100),("Chicken Manchurian Noodles","Chinese (Non-Veg)",100),
    ("Chicken Schezwan Rice","Chinese (Non-Veg)",90),("Chicken Schezwan Noodles","Chinese (Non-Veg)",90),
    ("Chicken TRPL Schezwan","Chinese (Non-Veg)",120),

    ("Chicken Masala","Chicken Items",70),("Chicken Fry","Chicken Items",90),
    ("Chicken Thali (Full)","Chicken Items",120),("Chicken Kolhapuri (Half)","Chicken Items",80),
    ("Chicken Kolhapuri (Full)","Chicken Items",90),("Chicken Hyderabadi (Half)","Chicken Items",80),
    ("Chicken Hyderabadi (Full)","Chicken Items",100),("Chicken Sukka South (Half)","Chicken Items",80),
    ("Chicken Sukka South (Full)","Chicken Items",100),("Chicken Butter (Half)","Chicken Items",100),
    ("Chicken Butter (Full)","Chicken Items",110),("Chicken Biryani (Full)","Chicken Items",120),

    ("Paneer Masala","Paneer",100),("Paneer Matar","Paneer",100),
    ("Paneer Kolhapuri","Paneer",100),("Veg Kolhapuri","Paneer",90),

    ("Full Lunch (Veg. Thaali)","Lunch",80),("Mini Lunch","Lunch",60),("Dal Rice & Papad","Lunch",40),
    ("Special Bhaaji","Lunch",70),("Veg. Pulao","Lunch",100),("Veg. Biryani","Lunch",100),
    ("Paneer Pulao","Lunch",100),("Jeera Rice","Lunch",50),("Chapati (1 Pc)","Lunch",6),
    ("Plain Rice (Half)","Lunch",20),("Plain Rice (Full)","Lunch",40),("Papad (1 Pc)","Lunch",5),
    ("Dal Watti","Lunch",20),("Veg Bhaaji","Lunch",30),("Dal Khichdi","Lunch",65),
    ("Dal Khichdi with Tadka","Lunch",75),("Sweet","Lunch",25),

    ("Egg Omlet (Single)","Egg Items",20),("Egg Omlet (Double)","Egg Items",40),
    ("Egg Bhurji (Single)","Egg Items",30),("Egg Bhurji (Double)","Egg Items",60),
    ("Egg Half Fry","Egg Items",40),("Boiled Egg (with masala)","Egg Items",15),
    ("Egg Fried Rice","Egg Items",70),("Egg Hakka Noodles","Egg Items",70),
    ("Egg Schezwan Rice","Egg Items",75),("Egg Schezwan Noodles","Egg Items",75),
    ("Egg Masala (Single)","Egg Items",30),("Egg Masala (Double)","Egg Items",60),
    ("Egg Biryani (Full)","Egg Items",80),

    ("Veg Frankie","Frankie",50),("Cheese Frankie","Frankie",90),("Paneer Frankie","Frankie",90),
    ("Paneer Cheese Frankie","Frankie",120),("Noodle Frankie","Frankie",70),
    ("Noodle Cheese Frankie","Frankie",90),("Manchurian Frankie","Frankie",90),
    ("Crispy Cheese Frankie","Frankie",100),("Manchurian Cheese Frankie","Frankie",120),
    ("Noodle Paneer Cheese Frankie","Frankie",130),("Mayo Manchurian Frankie","Frankie",110),

    ("Curd (Dahi Watti)","Other Items",25),("Samosa Chat","Other Items",30),
    ("Samosa Ragda","Other Items",40),("Buns (1 Pc)","Other Items",20),
    ("Batata Wada Sambar (2 Pc)","Other Items",40),("Veg Cutlet (1 Pc)","Other Items",25),

    ("Chicken Shwarma","Shwarma",70),("Chicken Cheese Shwarma","Shwarma",90),("Open Chicken Shwarma","Shwarma",130),

    ("Mumbai Local Pizza","Pizza",130),("Mix Veg Pizza","Pizza",160),
    ("Corn Pizza","Pizza",170),("Paneer Cheese Pizza","Pizza",190),

    ("Crispy King Burger","Burger",80),("Paneer King Burger","Burger",90),
    ("Crispy King Burger Cheese","Burger",100),("Paneer King Burger Cheese","Burger",100),

    ("Sev Puri (6 Pc)","Chaat Items",30),("Corn Chaat","Chaat Items",30),
    ("Dahi Sev Puri (6 Pc)","Chaat Items",40),("Sukka Bhel","Chaat Items",25),
    ("Pani Puri","Chaat Items",25),("Samosa Dahi Chat","Chaat Items",40),
    ("Papdi Chaat","Chaat Items",40),("Dahi Chaat","Chaat Items",40),
    ("Ragda Pattice","Chaat Items",40),("Dahi Puri","Chaat Items",40),
    ("Sprouted Chaat","Chaat Items",40),("Peanut Chaat","Chaat Items",40),("Gila Bhel Puri","Chaat Items",30),

    ("Watermelon Juice","Juices",40),("Pineapple Juice","Juices",40),("Mosambi Juice","Juices",40),
    ("Cold Drink","Juices",20),("Mineral Water","Juices",20),  # MRP items — placeholder price, edit as needed

    ("Mango Shake","Milk Shakes",50),("Chickoo Shake","Milk Shakes",50),("Chocolate Shake","Milk Shakes",50),
    ("Banana Shake","Milk Shakes",40),("Sweet Lassi","Milk Shakes",40),("Strawberry Shake","Milk Shakes",50),
    ("Rose Shake","Milk Shakes",50),("Oreo Shake","Milk Shakes",50),("Cocktail Shake","Milk Shakes",50),
    ("Cold Coffee","Milk Shakes",50),("Gulab Jamun (2pc)","Milk Shakes",30),
]

PREP_OVERRIDES = {
    "Tea (Cutting)": 2, "Tea (Full)": 3, "Coffee": 4, "Masala Dosa": 7,
    "Chicken Biryani (Full)": 12, "Chicken Thali (Full)": 14,
    "Mumbai Local Pizza": 12, "Mix Veg Pizza": 14, "Paneer Cheese Pizza": 15,
    "Crispy King Burger": 8, "Paneer King Burger": 9,
}


def prep_time_for(name, category, price):
    """Return a stable item-level estimate, never a single category default."""
    if name in PREP_OVERRIDES:
        return PREP_OVERRIDES[name]
    category_offset = {
        "Beverages": 2, "Juices": 3, "Milk Shakes": 5, "Snacks": 5,
        "South Indian": 7, "Chinese (Veg)": 8, "Chinese (Non-Veg)": 10,
        "Chicken Items": 11, "Paneer": 9, "Lunch": 10, "Egg Items": 7,
        "Frankie": 8, "Other Items": 5, "Shwarma": 8, "Pizza": 12,
        "Burger": 8, "Chaat Items": 4,
    }.get(category, 6)
    return max(2, min(16, category_offset + (price // 80) + (len(name) % 3) - 1))


def build_menu():
    menu = []
    for idx, (name, category, price) in enumerate(RAW_ITEMS, start=1):
        token_cost = max(2, round(price * 0.15))
        menu.append({
            "id": idx, "name": name, "category": category, "price": price,
            "token_cost": token_cost, "prep_minutes": prep_time_for(name, category, price),
            "img": CATEGORY_IMAGES.get(category, DEFAULT_IMG),
        })
    return menu

MENU = build_menu()
ORDERS = {}          # token -> order dict, in-memory demo store
ORDERS_BY_ID = {}
NEXT_ORDER_NUMBER = 1
USERS = {}           # session uid -> {"wallet_tokens": int}
TOKEN_PACKS = [
    {"id": "pack_50", "tokens": 50, "price": 40},
    {"id": "pack_120", "tokens": 120, "price": 90},
    {"id": "pack_300", "tokens": 300, "price": 200},
]
PROFILE = {
    "name": "Aarav Patil", "college": "Laxmi Balaji College", "roll_number": "LBH-24-017",
    "department": "Computer Engineering", "year": "Second Year", "email": "aarav.patil@example.edu",
}


def current_user():
    uid = session.setdefault("uid", str(uuid.uuid4()))
    return USERS.setdefault(uid, {"wallet_tokens": 100})


def calculate_order(cart):
    menu_by_id = {str(item["id"]): item for item in MENU}
    items = []
    total_price = 0
    total_tokens = 0
    total_quantity = 0
    prep_minutes = 0
    for raw_id, raw_quantity in (cart or {}).items():
        item = menu_by_id.get(str(raw_id))
        try:
            quantity = int(raw_quantity)
        except (TypeError, ValueError):
            quantity = 0
        if not item or quantity <= 0:
            raise ValueError(f"Invalid item or quantity: {raw_id}")
        item_total = item["price"] * quantity
        item_tokens = item["token_cost"] * quantity
        item_prep = item["prep_minutes"] * quantity
        items.append({
            "id": item["id"], "name": item["name"], "qty": quantity, "quantity": quantity,
            "price": item["price"], "token_cost": item["token_cost"],
            "prep_minutes": item["prep_minutes"], "line_total": item_total,
            "line_tokens": item_tokens, "line_prep_minutes": item_prep,
        })
        total_price += item_total
        total_tokens += item_tokens
        total_quantity += quantity
        prep_minutes += item_prep
    return {
        "items": items, "total_price": total_price, "total_tokens": total_tokens,
        "total_quantity": total_quantity, "prep_minutes": prep_minutes,
    }


def generate_order_token():
    global NEXT_ORDER_NUMBER
    while True:
        token = f"T-{NEXT_ORDER_NUMBER:03d}"
        NEXT_ORDER_NUMBER += 1
        if token not in ORDERS:
            return token


def create_order(preview, payment_method="tokens_only"):
    user = current_user()
    if user["wallet_tokens"] < preview["total_tokens"]:
        return None, {"error": "Not enough tokens", "required": preview["total_tokens"], "available": user["wallet_tokens"]}, 402
    user["wallet_tokens"] -= preview["total_tokens"]
    token = generate_order_token()
    order_id = f"ord_{uuid.uuid4().hex[:8]}"
    placed_at = time.time()
    order = {
        "id": order_id,
        "token": token,
        **preview,
        "total": preview["total_price"],
        "tokensSpent": preview["total_tokens"],
        "payment_method": payment_method,
        "seconds_left": preview["prep_minutes"] * 60,
        "counter": 1 + (len(ORDERS_BY_ID) % 2),
        "placed_at": placed_at,
        "ready_at": placed_at + preview["prep_minutes"] * 60,
        "status": "preparing",
    }
    ORDERS[token] = order
    ORDERS_BY_ID[order_id] = order
    return order, {"order": order, "wallet_tokens": user["wallet_tokens"]}, 200


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/staff")
def staff():
    return render_template("staff.html")


@app.route("/api/menu")
def get_menu():
    return jsonify({"items": MENU, "combos": []})


@app.route("/api/wallet")
def get_wallet():
    return jsonify({"wallet_tokens": current_user()["wallet_tokens"]})


@app.route("/api/profile")
def get_profile():
    return jsonify({**PROFILE, "wallet_tokens": current_user()["wallet_tokens"]})


@app.route("/api/token-packs")
def get_token_packs():
    return jsonify({"packs": TOKEN_PACKS, "wallet_tokens": current_user()["wallet_tokens"]})


@app.route("/api/buy-tokens", methods=["POST"])
def buy_tokens():
    body = request.get_json(silent=True) or {}
    pack = next((entry for entry in TOKEN_PACKS if entry["id"] == body.get("pack_id")), None)
    if not pack:
        return jsonify({"error": "Unknown token pack"}), 400
    user = current_user()
    user["wallet_tokens"] += pack["tokens"]
    return jsonify({"demo": True, "message": "Demo purchase recorded; no payment was charged.", "wallet_tokens": user["wallet_tokens"]})


def order_preview_response(cart):
    try:
        return calculate_order(cart), None
    except ValueError as error:
        return None, str(error)


@app.route("/api/order-preview", methods=["POST"])
def order_preview():
    body = request.get_json(silent=True) or {}
    preview, error = order_preview_response(body.get("cart", {}))
    if error:
        return jsonify({"error": error}), 400
    return jsonify({**preview, "available_tokens": current_user()["wallet_tokens"]})


@app.route("/api/order", methods=["POST"])
def create_direct_order():
    body = request.get_json(silent=True) or {}
    raw_items = body.get("items", [])
    cart = {}
    for entry in raw_items:
        if not isinstance(entry, dict):
            return jsonify({"success": False, "error": "Invalid item"}), 400
        item_id = entry.get("id")
        quantity = entry.get("quantity", 0)
        cart[str(item_id)] = quantity
    preview, error = order_preview_response(cart)
    if error or not preview["items"]:
        return jsonify({"success": False, "error": error or "Order is empty"}), 400
    payment_method = body.get("payment_method", "tokens_only")
    if payment_method not in {"tokens_only", "cash_at_counter"}:
        return jsonify({"success": False, "error": "Invalid payment method"}), 400
    order, response, status = create_order(preview, payment_method)
    if not order:
        return jsonify({"success": False, **response}), status
    return jsonify({"success": True, **response}), status


@app.route("/api/place-order", methods=["POST"])
def place_order():
    body = request.get_json(silent=True) or {}
    preview, error = order_preview_response(body.get("cart", {}))
    if error:
        return jsonify({"error": error}), 400
    if not preview["items"]:
        return jsonify({"error": "Cart is empty"}), 400
    payment_method = body.get("payment_method", "tokens_only")
    if payment_method not in {"tokens_only", "cash_at_counter"}:
        return jsonify({"error": "Invalid payment method"}), 400
    order, response, status = create_order(preview, payment_method)
    if not order:
        return jsonify(response), status
    return jsonify(response), status


@app.route("/api/order/<token>")
def get_order(token):
    order = ORDERS.get(token)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(order)


@app.route("/api/queue")
def get_queue():
    return jsonify(list(ORDERS_BY_ID.values()))


@app.route("/api/orders/<order_id>/advance", methods=["POST"])
def advance_order(order_id):
    order = ORDERS_BY_ID.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    order["status"] = {"queued": "preparing", "preparing": "ready", "ready": "picked_up"}.get(order["status"], order["status"])
    return jsonify(order)


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5000)