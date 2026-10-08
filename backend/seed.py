import random
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, engine, Base
from backend.app.models.entities import (
    Warehouse, Customer, Order, Vehicle, Route, RouteStop, OptimizationRun, OptimizationMetric
)

# Pune real-world landmarks and localities
PUNE_LOCALITIES = [
    ("Shivajinagar Central Depot", 18.5308, 73.8475, "Depot"),
    ("Hadapsar Hub", 18.5089, 73.9260, "Depot"),
    ("Kothrud Vanaz Corner", 18.5074, 73.8077, "Customer"),
    ("Viman Nagar Phoenix Mall", 18.5679, 73.9143, "Customer"),
    ("Baner High Street", 18.5590, 73.7868, "Customer"),
    ("Aundh D-Mart", 18.5580, 73.8075, "Customer"),
    ("Kalyani Nagar Joggers Park", 18.5476, 73.9038, "Customer"),
    ("Wakad Hinjewadi Road", 18.5987, 73.7688, "Customer"),
    ("Pimpri Chinchwad Link Rd", 18.6279, 73.8009, "Customer"),
    ("Koregaon Park North Main Rd", 18.5362, 73.8940, "Customer"),
    ("Magarpatta Cybercity", 18.5158, 73.9272, "Customer"),
    ("Swargate Bus Stand", 18.5018, 73.8636, "Customer"),
    ("Deccan Gymkhana FC Rd", 18.5186, 73.8415, "Customer"),
    ("Camp MG Road", 18.5167, 73.8792, "Customer"),
    ("Bibwewadi Lake Town", 18.4770, 73.8631, "Customer"),
    ("Katraj Snake Park", 18.4555, 73.8655, "Customer"),
    ("Sinhagad Road Anand Nagar", 18.4831, 73.8188, "Customer"),
    ("Bavdhan Pashan Circle", 18.5146, 73.7744, "Customer"),
    ("Yerawada Golf Club", 18.5529, 73.8824, "Customer"),
    ("Kharadi EON Free Zone", 18.5516, 73.9535, "Customer")
]

CUSTOMER_NAMES = [
    "Aarav Sharma", "Aditi Patel", "Rohan Kulkarni", "Priya Deshmukh",
    "Vikram Joshi", "Sneha Patil", "Rahul Shinde", "Ananya Mehta",
    "Kunal Gokhale", "Tanvi Gaikwad", "Siddharth Nair", "Neha Chitnis",
    "Amit Kadam", "Pooja Jadhav", "Akash More", "Ritu Salunkhe",
    "Nikhil Bhosale", "Divya Pawar", "Varun Sawant", "Isha Apte"
]

def run_seed(db: Session = None):
    close_db = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_db = True

    try:
        # Clear existing demo data
        db.query(RouteStop).delete()
        db.query(Route).delete()
        db.query(OptimizationMetric).delete()
        db.query(OptimizationRun).delete()
        db.query(Order).delete()
        db.query(Vehicle).delete()
        db.query(Customer).delete()
        db.query(Warehouse).delete()
        db.commit()

        print("Cleared previous data. Seeding realistic logistics entities for Pune, India...")

        # 1. Warehouses (2 Depots)
        wh1 = Warehouse(
            name="Central Pune Logistics Depot (DEMO DATA)",
            address="Shivajinagar Goods Terminal, Pune, Maharashtra 411005",
            latitude=18.5308,
            longitude=73.8475
        )
        wh2 = Warehouse(
            name="East Pune Fulfillment Center (DEMO DATA)",
            address="Hadapsar Industrial Estate, Pune, Maharashtra 411028",
            latitude=18.5089,
            longitude=73.9260
        )
        db.add_all([wh1, wh2])
        db.commit()
        db.refresh(wh1)
        db.refresh(wh2)

        # 2. Customers (60 customers)
        customers = []
        cust_locs = [loc for loc in PUNE_LOCALITIES if loc[3] == "Customer"]
        for i in range(60):
            base_loc = cust_locs[i % len(cust_locs)]
            # Slight random offset around locality (within ~1 km)
            lat = base_loc[1] + random.uniform(-0.015, 0.015)
            lon = base_loc[2] + random.uniform(-0.015, 0.015)
            name = f"{random.choice(CUSTOMER_NAMES)} #{i+1}"
            c = Customer(
                name=f"{name} (DEMO DATA)",
                phone=f"+91 982{random.randint(1000000, 9999999)}",
                email=f"cust{i+1}@example.com",
                address=f"{base_loc[0]}, Lane {i % 8 + 1}, Pune",
                latitude=round(lat, 6),
                longitude=round(lon, 6)
            )
            customers.append(c)
        db.add_all(customers)
        db.commit()

        # 3. Vehicles (12 Delivery Vehicles)
        vehicles = []
        v_types = [
            ("Electric Van EV-200", 120.0),
            ("Standard Delivery Van", 150.0),
            ("Heavy Courier Truck", 250.0),
            ("Compact Express Cargo", 80.0)
        ]
        for v in range(12):
            v_type, cap = v_types[v % len(v_types)]
            veh = Vehicle(
                vehicle_number=f"MH-12-DEL-{1001 + v} (DEMO)",
                vehicle_type=v_type,
                max_capacity=cap,
                current_load=0.0,
                current_latitude=wh1.latitude,
                current_longitude=wh1.longitude,
                status="AVAILABLE"
            )
            vehicles.append(veh)
        db.add_all(vehicles)
        db.commit()

        # 4. Orders (120 Delivery Orders)
        orders = []
        priorities = ["NORMAL", "NORMAL", "NORMAL", "HIGH", "URGENT", "LOW"]
        time_windows = [
            (540, 720),   # 09:00 - 12:00 (tight morning)
            (600, 840),   # 10:00 - 14:00 (midday)
            (720, 960),   # 12:00 - 16:00 (afternoon)
            (840, 1080),  # 14:00 - 18:00 (evening)
            (540, 1080)   # 09:00 - 18:00 (all day flexible)
        ]

        for idx in range(120):
            cust = customers[idx % len(customers)]
            prio = random.choice(priorities)
            tw_start, tw_end = random.choice(time_windows)
            weight = round(random.uniform(2.5, 22.0), 1)

            order = Order(
                order_code=f"ORD-PN-{idx+1:04d}",
                customer_id=cust.id,
                warehouse_id=wh1.id,
                customer_name=cust.name,
                address=cust.address,
                latitude=cust.latitude,
                longitude=cust.longitude,
                package_weight=weight,
                priority=prio,
                time_window_start=tw_start,
                time_window_end=tw_end,
                status="PENDING"
            )
            orders.append(order)

        db.add_all(orders)
        db.commit()

        print(f"Successfully seeded:")
        print(f"  - 2 Warehouses")
        print(f"  - {len(customers)} Customers")
        print(f"  - {len(vehicles)} Vehicles")
        print(f"  - {len(orders)} Orders")

        return {
            "status": "success",
            "warehouses_seeded": 2,
            "customers_seeded": len(customers),
            "vehicles_seeded": len(vehicles),
            "orders_seeded": len(orders),
            "city": "Pune, Maharashtra, India"
        }

    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    run_seed()
