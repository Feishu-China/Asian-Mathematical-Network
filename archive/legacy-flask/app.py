from flask import Flask, render_template, request, jsonify, g
import sqlite3
import os

# Initialize Flask app
app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'asiamath.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'schema.sql')

# --------------------------
# Database Helpers
# --------------------------
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        with open(SCHEMA_PATH, mode='r', encoding='utf-8') as f:
            db.cursor().executescript(f.read())
        db.commit()

# --------------------------
# Public Portal (M1)
# --------------------------
@app.route('/')
def index():
    # Get institutions + events for homepage
    db = get_db()
    institutions = db.execute('SELECT * FROM institutions').fetchall()
    events = db.execute('SELECT * FROM events').fetchall()
    experts = db.execute('SELECT * FROM users WHERE verified = 1').fetchall()
    return render_template('index.html', institutions=institutions, events=events, experts=experts)

# --------------------------
# Academic Directory (M4)
# --------------------------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    db = get_db()
    try:
        db.execute(
            '''INSERT INTO users (orcid, name, affiliation, msc_codes, email, verified)
               VALUES (?, ?, ?, ?, ?, 1)''',
            (data['orcid'], data['name'], data['affiliation'], data['msc_codes'], data['email'])
        )
        db.commit()
        return jsonify({"status": "success", "message": "Profile created"})
    except:
        return jsonify({"status": "error", "message": "ORCID already exists"}), 400

@app.route('/api/search-experts', methods=['GET'])
def search_experts():
    query = request.args.get('q', '')
    db = get_db()
    experts = db.execute(
        '''SELECT * FROM users WHERE verified = 1 AND
           (msc_codes LIKE ? OR name LIKE ? OR affiliation LIKE ?)''',
        (f'%{query}%', f'%{query}%', f'%{query}%')
    ).fetchall()
    return jsonify([dict(row) for row in experts])

# --------------------------
# Run App
# --------------------------
if __name__ == '__main__':
    if not os.path.exists(DATABASE):
        init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
