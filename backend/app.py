from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import random

app = Flask(__name__)
CORS(app)

# MySQL Configuration
MYSQL_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'Gyx84181240.',
    'database': 'classroom_system',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db_connection():
    print("  Connecting to MySQL...", flush=True)
    conn = pymysql.connect(**MYSQL_CONFIG)
    print("  Connected!", flush=True)
    return conn

def init_db():
    print("  Getting DB connection...", flush=True)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("  Creating students table if needed...", flush=True)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            student_id VARCHAR(50),
            score INT DEFAULT 0,
            selection_count INT DEFAULT 0,
            status VARCHAR(20) DEFAULT 'present'
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    ''')
    conn.commit()
    print("  Done, closing...", flush=True)
    cursor.close()
    conn.close()

@app.route('/api/students', methods=['GET', 'POST'])
def handle_students():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if request.method == 'GET':
        cursor.execute('SELECT * FROM students')
        students = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(students)
    elif request.method == 'POST':
        new_student = request.json
        name = new_student.get('name')
        student_id = new_student.get('student_id')
        
        cursor.execute('INSERT INTO students (name, student_id, status) VALUES (%s, %s, %s)', 
                     (name, student_id, 'present'))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Student added'}), 201

@app.route('/api/students/batch', methods=['POST'])
def batch_add_students():
    data = request.json
    students_to_add = []
    
    if 'students' in data:
        students_to_add = data['students']
    elif 'names' in data:
        students_to_add = [{'name': n, 'student_id': None} for n in data['names']]
        
    if not students_to_add:
        return jsonify({'error': 'No students provided'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    valid_students = [s for s in students_to_add if s.get('name') and s['name'].strip()]
    
    if valid_students:
        for s in valid_students:
            cursor.execute('INSERT INTO students (name, student_id, status) VALUES (%s, %s, %s)',
                          (s['name'], s.get('student_id'), 'present'))
        conn.commit()
    
    cursor.close()
    conn.close()
    return jsonify({'message': f'Added {len(valid_students)} students'}), 201

@app.route('/api/students/all', methods=['DELETE'])
def delete_all_students():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM students')
    cursor.execute('ALTER TABLE students AUTO_INCREMENT = 1')  # Reset auto-increment
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'All students deleted'}), 200

@app.route('/api/students/<int:id>', methods=['DELETE'])
def delete_student(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM students WHERE id = %s', (id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Student deleted'}), 200

@app.route('/api/students/<int:id>/status', methods=['PUT'])
def update_status(id):
    status = request.json.get('status')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE students SET status = %s WHERE id = %s', (status, id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Status updated'}), 200

@app.route('/api/students/<int:id>/score', methods=['PUT'])
def update_score(id):
    delta = request.json.get('delta', 0)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE students SET score = score + %s WHERE id = %s', (delta, id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Score updated'}), 200

@app.route('/api/spin', methods=['POST'])
def spin_wheel():
    mode = request.json.get('mode', 'random') 
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Only select from students who are 'present'
    cursor.execute("SELECT * FROM students WHERE status = 'present' OR status IS NULL")
    students = cursor.fetchall()
        
    if not students:
        cursor.close()
        conn.close()
        return jsonify({'error': 'No active students found'}), 400
    
    selected = None
    if mode == 'random' or mode == 'rollCall':
        selected = random.choice(students)
    elif mode == 'fair':
        min_count = min([s['selection_count'] for s in students])
        candidates = [s for s in students if s['selection_count'] == min_count]
        selected = random.choice(candidates)
    
    cursor.execute('UPDATE students SET selection_count = selection_count + 1 WHERE id = %s', (selected['id'],))
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify(selected)

# ========== Selection History API ==========

@app.route('/api/history', methods=['GET'])
def get_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM selection_history ORDER BY created_at DESC LIMIT 100')
    history = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(history)

@app.route('/api/history', methods=['POST'])
def add_history():
    data = request.json
    student_id = data.get('student_id')
    student_name = data.get('student_name')
    mode = data.get('mode', 'random')
    score_delta = data.get('score_delta', 0)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO selection_history (student_id, student_name, mode, score_delta)
        VALUES (%s, %s, %s, %s)
    ''', (student_id, student_name, mode, score_delta))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'History added'}), 201

@app.route('/api/history', methods=['DELETE'])
def clear_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM selection_history')
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'History cleared'}), 200

@app.route('/api/history/<int:student_id>', methods=['PUT'])
def update_history_score(student_id):
    """Update the most recent history record for a student with their score"""
    data = request.json
    score_delta = data.get('score_delta')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    # Update the most recent record for this student
    cursor.execute('''
        UPDATE selection_history 
        SET score_delta = %s 
        WHERE student_id = %s AND score_delta IS NULL
        ORDER BY created_at DESC 
        LIMIT 1
    ''', (score_delta, student_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'History updated'}), 200

if __name__ == '__main__':
    print("Starting server...")
    print("Initializing database...")
    init_db()
    print("Database initialized, starting Flask on 0.0.0.0:5001...")
    app.run(debug=False, host='0.0.0.0', port=5001)
