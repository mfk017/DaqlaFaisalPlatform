import sqlite3
import json

db = sqlite3.connect('prisma/dev.db')
db.row_factory = sqlite3.Row
cursor = db.cursor()

tables = ['profiles', 'user_roles', 'branches', 'categories', 'workflow_stages', 'orders', 'order_history']
data = {}

for table in tables:
    cursor.execute(f"SELECT * FROM {table}")
    rows = [dict(row) for row in cursor.fetchall()]
    data[table] = rows

with open('data_dump.json', 'w') as f:
    json.dump(data, f)

print("Dumped all data to data_dump.json")
