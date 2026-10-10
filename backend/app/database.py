from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_migrations():
    """
    Safely adds area, pincode, geocoding_status, geocoding_error columns
    to the orders table and ensures latitude/longitude can be NULL,
    preserving all existing data.
    """
    with engine.connect() as conn:
        try:
            from sqlalchemy import text
            res = conn.execute(text("PRAGMA table_info(orders)")).fetchall()
            if res:
                cols = {row[1]: row for row in res}
                lat_info = cols.get("latitude")
                lat_notnull = lat_info[3] if lat_info is not None else 0

                if lat_notnull == 1:
                    # SQLite table recreation pattern to remove NOT NULL constraint
                    conn.execute(text("PRAGMA foreign_keys=off;"))
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS orders_v2 (
                            id INTEGER PRIMARY KEY,
                            order_code VARCHAR(50) UNIQUE,
                            customer_id INTEGER,
                            warehouse_id INTEGER,
                            customer_name VARCHAR(100) NOT NULL,
                            address VARCHAR(255) NOT NULL,
                            area VARCHAR(100),
                            pincode VARCHAR(10),
                            latitude FLOAT,
                            longitude FLOAT,
                            geocoding_status VARCHAR(20) DEFAULT 'PENDING',
                            geocoding_error VARCHAR(255),
                            package_weight FLOAT DEFAULT 5.0,
                            priority VARCHAR(20) DEFAULT 'NORMAL',
                            time_window_start INTEGER DEFAULT 540,
                            time_window_end INTEGER DEFAULT 1080,
                            status VARCHAR(30) DEFAULT 'PENDING',
                            assigned_vehicle_id INTEGER,
                            created_at DATETIME,
                            updated_at DATETIME
                        );
                    """))
                    has_area = "area" in cols
                    has_status = "geocoding_status" in cols
                    sel_area = "area" if has_area else "NULL"
                    sel_pincode = "pincode" if "pincode" in cols else "NULL"
                    sel_gstatus = "geocoding_status" if has_status else "'SUCCESS'"
                    sel_gerr = "geocoding_error" if "geocoding_error" in cols else "NULL"

                    conn.execute(text(f"""
                        INSERT INTO orders_v2 (
                            id, order_code, customer_id, warehouse_id, customer_name, address,
                            area, pincode, latitude, longitude, geocoding_status, geocoding_error,
                            package_weight, priority, time_window_start, time_window_end, status,
                            assigned_vehicle_id, created_at, updated_at
                        )
                        SELECT
                            id, order_code, customer_id, warehouse_id, customer_name, address,
                            {sel_area}, {sel_pincode}, latitude, longitude, {sel_gstatus}, {sel_gerr},
                            package_weight, priority, time_window_start, time_window_end, status,
                            assigned_vehicle_id, created_at, updated_at
                        FROM orders;
                    """))
                    conn.execute(text("DROP TABLE orders;"))
                    conn.execute(text("ALTER TABLE orders_v2 RENAME TO orders;"))
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_orders_id ON orders(id);"))
                    conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_orders_order_code ON orders(order_code);"))
                    conn.execute(text("PRAGMA foreign_keys=on;"))
                    conn.commit()
                else:
                    if "area" not in cols:
                        conn.execute(text("ALTER TABLE orders ADD COLUMN area VARCHAR(100)"))
                    if "pincode" not in cols:
                        conn.execute(text("ALTER TABLE orders ADD COLUMN pincode VARCHAR(10)"))
                    if "geocoding_status" not in cols:
                        conn.execute(text("ALTER TABLE orders ADD COLUMN geocoding_status VARCHAR(20) DEFAULT 'PENDING'"))
                    if "geocoding_error" not in cols:
                        conn.execute(text("ALTER TABLE orders ADD COLUMN geocoding_error VARCHAR(255)"))
                    conn.execute(text("UPDATE orders SET geocoding_status = 'SUCCESS' WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND (geocoding_status IS NULL OR geocoding_status = 'PENDING')"))
                    conn.commit()
        except Exception as e:
            pass


