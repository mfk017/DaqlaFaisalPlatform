import sqlite3
import json
import datetime

db = sqlite3.connect('prisma/dev.db')
db.row_factory = sqlite3.Row
cursor = db.cursor()

tables = ['profiles', 'user_roles', 'branches', 'categories', 'workflow_stages', 'orders', 'order_history']
sql_statements = []

# Truncate tables to ensure clean import
sql_statements.append("TRUNCATE TABLE order_history, orders, workflow_stages, categories, branches, user_roles, profiles CASCADE;")
sql_statements.append("")

boolean_columns = ['approved', 'is_active', 'is_archived', 'is_quality', 'is_final']
date_columns = ['created_at', 'updated_at', 'canceled_at', 'due_date']

# Read all data into memory to check foreign keys
data = {}
for table in tables:
    cursor.execute(f"SELECT * FROM {table}")
    data[table] = [dict(row) for row in cursor.fetchall()]

valid_profile_ids = {row['id'] for row in data['profiles']}
valid_branch_ids = {row['id'] for row in data['branches']}
valid_category_ids = {row['id'] for row in data['categories']}
valid_order_ids = {row['id'] for row in data['orders']}

for table in tables:
    for row in data[table]:
        # Filter out orphaned records
        if table == 'user_roles' and row['profile_id'] not in valid_profile_ids:
            continue
        if table == 'orders':
            if row['branch_id'] not in valid_branch_ids or row['category_id'] not in valid_category_ids:
                continue
        if table == 'order_history' and row['order_id'] not in valid_order_ids:
            continue
        if table == 'workflow_stages' and row['category_id'] not in valid_category_ids:
            continue
            
        columns = ', '.join(row.keys())
        values = []
        for key in row.keys():
            val = row[key]
            
            if val is None:
                values.append('NULL')
            elif key in boolean_columns:
                values.append('TRUE' if val == 1 else 'FALSE')
            elif key in date_columns:
                if isinstance(val, (int, float)):
                    dt = datetime.datetime.fromtimestamp(val / 1000.0, tz=datetime.timezone.utc)
                    values.append(f"'{dt.strftime('%Y-%m-%d %H:%M:%S.%f')}'")
                else:
                    values.append(f"'{str(val)}'")
            elif isinstance(val, (int, float)):
                values.append(str(val))
            else:
                escaped_val = str(val).replace("'", "''")
                values.append(f"'{escaped_val}'")
        
        values_str = ', '.join(values)
        sql_statements.append(f"INSERT INTO {table} ({columns}) VALUES ({values_str});")

with open('import_data.sql', 'w') as f:
    f.write('\n'.join(sql_statements))

print("Generated import_data.sql")
