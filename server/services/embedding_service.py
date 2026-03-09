from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import numpy as np
import os
import json
import time

app = Flask(__name__)
CORS(app)

# ── In-memory store (persisted to JSON) ──────────────────────────────────────
STORE_PATH = os.path.join(os.path.dirname(__file__), 'memory_store.json')
_memory_store: list = []  # [{uid, text, embedding, role, source, ts}]

def _load_store():
    global _memory_store
    if os.path.exists(STORE_PATH):
        try:
            with open(STORE_PATH, 'r', encoding='utf-8') as f:
                _memory_store = json.load(f)
        except Exception:
            _memory_store = []

def _save_store():
    with open(STORE_PATH, 'w', encoding='utf-8') as f:
        json.dump(_memory_store, f)

_load_store()

# Load lightweight model (downloads ~90MB on first run)
print("Loading sentence-transformer model: all-MiniLM-L6-v2...")
model = SentenceTransformer('all-MiniLM-L6-v2')

@app.route('/embed', methods=['POST'])
def embed():
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Generate embedding
        embedding = model.encode(text)
        
        # Convert to list for JSON serialization
        embedding_list = embedding.tolist()
        
        return jsonify({
            'embedding': embedding_list,
            'dimension': len(embedding_list)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/store', methods=['POST'])
def store():
    """Store a text + its embedding for a user."""
    try:
        data = request.json
        uid = data.get('uid', '')
        text = data.get('text', '')
        role = data.get('role', 'user')
        source = data.get('source', 'chat')
        if not uid or not text:
            return jsonify({'error': 'uid and text are required'}), 400
        emb = model.encode(text).tolist()
        entry = {'uid': uid, 'text': text, 'embedding': emb, 'role': role, 'source': source, 'ts': time.time()}
        _memory_store.append(entry)
        _save_store()
        return jsonify({'stored': True, 'dimension': len(emb)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/retrieve', methods=['POST'])
def retrieve():
    """Retrieve top-k memories for a user by cosine similarity + recency."""
    try:
        data = request.json
        uid = data.get('uid', '')
        query = data.get('query', '')
        top_k = int(data.get('topK', 4))
        threshold = float(data.get('threshold', 0.55))
        if not uid or not query:
            return jsonify({'error': 'uid and query are required'}), 400
        q_emb = model.encode(query)
        entries = [e for e in _memory_store if e.get('uid') == uid]
        if not entries:
            return jsonify({'results': []})
        now = time.time()
        scored = []
        for e in entries:
            a = np.array(e['embedding'])
            cos = float(np.dot(q_emb, a) / (np.linalg.norm(q_emb) * np.linalg.norm(a) + 1e-10))
            age_days = (now - e.get('ts', now)) / 86400
            recency = max(0.0, 1.0 - age_days / 30)  # decay over 30 days
            score = 0.8 * cos + 0.2 * recency
            if cos >= threshold:
                scored.append({'text': e['text'], 'score': round(score, 4), 'cosine': round(cos, 4), 'source': e.get('source', 'chat')})
        scored.sort(key=lambda x: x['score'], reverse=True)
        return jsonify({'results': scored[:top_k]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'all-MiniLM-L6-v2', 'stored': len(_memory_store)})

if __name__ == '__main__':
    port = int(os.environ.get('EMBEDDING_PORT', 5002))
    print(f"🚀 Embedding service starting on port {port}...")
    print("📦 Model: all-MiniLM-L6-v2 (384 dimensions)")
    app.run(host='0.0.0.0', port=port, debug=False)
