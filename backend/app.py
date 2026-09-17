from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
DB_PATH = 'transactions.db'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                type TEXT NOT NULL,
                qty INTEGER NOT NULL,
                price REAL NOT NULL,
                status TEXT NOT NULL,
                time TEXT NOT NULL
            )
        ''')
        conn.commit()

init_db()

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM orders ORDER BY id DESC')
        rows = cursor.fetchall()
        orders = [dict(row) for row in rows]
    return jsonify(orders), 200

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json()
    symbol = data.get('symbol', '').upper()
    order_type = data.get('type')
    qty = data.get('qty')
    price = data.get('price')
    status = 'Executed'
    time_str = datetime.now().strftime('%I:%M %p')

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO orders (symbol, type, qty, price, status, time)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (symbol, order_type, qty, price, status, time_str))
        conn.commit()
        order_id = cursor.lastrowid

    new_order = {
        'id': order_id,
        'symbol': symbol,
        'type': order_type,
        'qty': qty,
        'price': price,
        'status': status,
        'time': time_str
    }
    return jsonify(new_order), 201

if __name__ == '__main__':
    app.run(port=5000, debug=True)