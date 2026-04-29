# backend/main.py
import os
import json
import numpy as np
import random
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "analytics.json"

# --- DETECTIVE GAME STATE ---
# A small bank of secret puzzles
PUZZLES = [
    {"text": "cats chase mice", "hint": "A classic predator/prey dynamic."},
    {"text": "big red dog", "hint": "Two adjectives describing a noun."},
    {"text": "I love math", "hint": "A strong opinion about a subject."}
]

# Global state to hold the current puzzle (for prototype simplicity)
current_puzzle = None

# --- ARCHITECTURE FIXER GAME STATE ---
# The bank of intentional architecture bugs
ARCHITECTURE_BUGS = [
    {
        "id": "missing_scale", 
        "hint": "The Softmax is too sharp. Did we forget to normalize the dot product?",
        "solution_keywords": ["scale", "scaling factor", "sqrt", "root", "dk", "d_k"]
    },
    {
        "id": "missing_mask", 
        "hint": "Token 1 is looking into the future. That's illegal in decoding.",
        "solution_keywords": ["mask", "causal", "triu", "future", "hide"]
    },
    {
        "id": "missing_softmax", 
        "hint": "These attention 'weights' are massive. Do they even add up to 1?",
        "solution_keywords": ["softmax", "probability", "exp", "normalize"]
    }
]

# Global state for the active bug
active_bug = None

# --- ANALYTICS UTILS ---
def save_analytics(topic: str, confusion: int, mastery: int, prompt: str = ""):
    """Saves student confusion data to a local JSON file for the teacher dashboard."""
    try:
        with open(DB_FILE, "r") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []
    
    data.append({
        "timestamp": datetime.now().isoformat(),
        "topic": topic,
        "confusion_score": confusion,
        "mastery_score": mastery,
        "prompt": prompt
    })
    
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

# --- MODELS ---
class Token(BaseModel):
    id: str
    text: str
    position: int

class AttentionState(BaseModel):
    layerIndex: int
    headIndex: int
    tokens: List[Token]
    embeddings: List[List[float]] 
    positionalEncoding: List[List[float]]
    queries: List[List[float]]
    keys: List[List[float]]
    values: List[List[float]]
    rawScores: List[List[float]]
    maskedScores: List[List[float]]
    attentionWeights: List[List[float]]
    contextVector: List[List[float]]
    finalOutput: List[List[float]]

class TextRequest(BaseModel):
    text: str
    dimension: int = 4
    
class ArenaRequest(BaseModel):
    text: str
    dimension: int = 4
    
class CopilotRequest(BaseModel):
    userPrompt: str
    tensorContext: Optional[AttentionState] = None

# --- MATH UTILS ---
def softmax(x):
    e_x = np.exp(x - np.max(x, axis=-1, keepdims=True))
    return (e_x / e_x.sum(axis=-1, keepdims=True)).tolist()

def compute_full_transformer_block(Q, K, V, dim):
    seq_len = Q.shape[0]
    
    # 1. Raw Attention Scores (Dot Product)
    raw_scores = np.dot(Q, K.T) / np.sqrt(dim)
    
    # 2. Causal Masking (The "Don't Look into the Future" step)
    # Creates an upper triangular matrix of negative infinity
    mask = np.triu(np.full((seq_len, seq_len), float('-inf')), k=1)
    masked_scores = raw_scores + mask
    
    # 3. Softmax (Convert to Probabilities)
    # Subtract max for numerical stability before exponentiating
    exp_scores = np.exp(masked_scores - np.max(masked_scores, axis=1, keepdims=True))
    attention_weights = exp_scores / np.sum(exp_scores, axis=1, keepdims=True)
    
    # 4. Context Vector (Attention * Value)
    context_vector = np.dot(attention_weights, V)
    
    # 5. Feed Forward Network (Linear -> ReLU -> Linear)
    # Expand dimension (usually 4x) then compress back
    W1 = np.random.randn(dim, dim * 4) * 0.1
    W2 = np.random.randn(dim * 4, dim) * 0.1
    
    ffn_hidden = np.maximum(0, np.dot(context_vector, W1)) # ReLU activation
    final_output = np.dot(ffn_hidden, W2)
    
    return {
        "raw_scores": raw_scores.round(2).tolist(),
        "masked_scores": np.where(np.isneginf(masked_scores), -999, masked_scores.round(2)).tolist(),
        "attention_weights": attention_weights.round(2).tolist(),
        "context_vector": context_vector.round(2).tolist(),
        "final_output": final_output.round(2).tolist()
    }

def compute_bugged_transformer_block(Q, K, V, dim, bug_id):
    seq_len = Q.shape[0]
    
    # 1. Raw Attention Scores (Dot Product)
    raw_scores = np.dot(Q, K.T)
    
    # Apply scaling based on bug type
    if bug_id != "missing_scale":
        raw_scores = raw_scores / np.sqrt(dim)
    
    # 2. Causal Masking (The "Don't Look into the Future" step)
    if bug_id != "missing_mask":
        mask = np.triu(np.full((seq_len, seq_len), float('-inf')), k=1)
        masked_scores = raw_scores + mask
    else:
        masked_scores = raw_scores
    
    # 3. Softmax (Convert to Probabilities)
    if bug_id != "missing_softmax":
        # Subtract max for numerical stability before exponentiating
        exp_scores = np.exp(masked_scores - np.max(masked_scores, axis=1, keepdims=True))
        attention_weights = exp_scores / np.sum(exp_scores, axis=1, keepdims=True)
    else:
        # Bug: Output raw scores directly!
        attention_weights = masked_scores
    
    # 4. Context Vector (Attention * Value)
    context_vector = np.dot(attention_weights, V)
    
    # 5. Feed Forward Network (Linear -> ReLU -> Linear)
    W1 = np.random.randn(dim, dim * 4) * 0.1
    W2 = np.random.randn(dim * 4, dim) * 0.1
    
    ffn_hidden = np.maximum(0, np.dot(context_vector, W1)) # ReLU activation
    final_output = np.dot(ffn_hidden, W2)
    
    return {
        "raw_scores": raw_scores.round(2).tolist(),
        "masked_scores": np.where(np.isneginf(masked_scores), -999, masked_scores.round(2)).tolist(),
        "attention_weights": attention_weights.round(2).tolist(),
        "context_vector": context_vector.round(2).tolist(),
        "final_output": final_output.round(2).tolist()
    }

# --- ENDPOINTS ---
@app.post("/api/v1/transformer/calculate", response_model=List[AttentionState])
async def calculate_transformer(request: TextRequest):
    words = request.text.split()
    n_tokens = len(words)
    if n_tokens == 0: return []

    d_k = request.dimension
    num_heads = 4 
    tokens = [Token(id=f"tok_{i}", text=word, position=i) for i, word in enumerate(words)]
    
    emb_rng = np.random.default_rng(seed=100)
    base_embeddings = emb_rng.standard_normal((n_tokens, d_k))
    
    pos_enc = np.zeros((n_tokens, d_k))
    for pos in range(n_tokens):
        for i in range(0, d_k, 2):
            denominator = np.power(10000, (2 * i) / d_k)
            pos_enc[pos, i] = np.sin(pos / denominator)
            if i + 1 < d_k:
                pos_enc[pos, i + 1] = np.cos(pos / denominator)
                
    heads_data = []
    for h in range(num_heads):
        rng = np.random.default_rng(seed=42 + h) 
        Q = rng.standard_normal((n_tokens, d_k))
        K = rng.standard_normal((n_tokens, d_k))
        V = rng.standard_normal((n_tokens, d_k))
        
        # Use the full Transformer block computation
        transformer_results = compute_full_transformer_block(Q, K, V, d_k)
        
        heads_data.append(AttentionState(
            layerIndex=0, headIndex=h, tokens=tokens,
            embeddings=base_embeddings.tolist(),
            positionalEncoding=pos_enc.tolist(),
            queries=Q.tolist(), keys=K.tolist(), values=V.tolist(),
            rawScores=transformer_results["raw_scores"], 
            maskedScores=transformer_results["masked_scores"],
            attentionWeights=transformer_results["attention_weights"],
            contextVector=transformer_results["context_vector"],
            finalOutput=transformer_results["final_output"]
        ))
    return heads_data

@app.post("/api/v1/copilot/ask")
async def ask_copilot(request: CopilotRequest):
    context_str = "No tensor context provided."
    if request.tensorContext:
        context_str = (
            f"Tokens: {[t.text for t in request.tensorContext.tokens]}\n"
            f"Embeddings: {request.tensorContext.embeddings}\n"
            f"Positional Encoding: {request.tensorContext.positionalEncoding}\n"
            f"Query Matrix: {request.tensorContext.queries}\n"
            f"Key Matrix: {request.tensorContext.keys}\n"
            f"Attention Weights: {request.tensorContext.attentionWeights}"
        )

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system", 
                    "content": (
                        "You are the Neuroweave Socratic AI, a brilliant and concise tutor for Transformer architecture. "
                        "You have access to the user's current tensor math context. "
                        "CRITICAL RULES: "
                        "1. NEVER regurgitate raw arrays or dump massive lists of numbers. "
                        "2. If you must reference a number, ALWAYS round it to 2 decimal places (e.g., 0.87). "
                        "3. Keep your answers brief, conversational, and under 3-4 sentences unless explicitly asked for a deep dive. "
                        "4. If the user just says 'hello' or 'whats up', greet them and offer to explain a specific part of the matrices on their screen."
                        "5. If the user asks for an explanation of a specific term (like 'queries' or 'attention weights'), provide a concise, intuitive explanation without referencing the raw numbers directly."
                        "6. If user says/asks something completely unrelated to Transformers, AI or academics, make a joke referencing famous TV shows and redirect them to studies."
                        "7. Also judge the student's mastery of the topic from 1-10 (1 = total beginner, 10 = expert). "
                        "8. VAGUE LANGUAGE PENALTY: If the user refers to the math or UI using non-technical, elementary terms (e.g., 'squares', 'boxes', 'stuff', 'thingy', 'numbers'), you MUST grade them with HIGH Confusion (8-10) and LOW Mastery (1-3). "
                        "9. ALWAYS end your response with this hidden metadata line: METADATA: [Topic], [Confusion Score 1-10], [Mastery Score 1-10]. "
                        "Topics MUST be one of: 'Softmax', 'Positional Encoding', 'QKV Matrices', 'Masking', or 'Feed Forward'."
                    )
                },
                {"role": "user", "content": f"Context:\n{context_str}\n\nQuestion: {request.userPrompt}"}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.6,
            max_tokens=300,
        )
        
        raw_content = chat_completion.choices[0].message.content
        clean_message = raw_content
        
        # Metadata Slicing & Analytics Logging
        if "METADATA:" in raw_content:
            parts = raw_content.split("METADATA:")
            clean_message = parts[0].strip()
            try:
                meta_raw = parts[1].split(",")
                topic = meta_raw[0].strip().replace("[", "").replace("]", "")
                # Grab confusion (index 1) and mastery (index 2)
                c_score = int("".join(filter(str.isdigit, meta_raw[1])))
                m_score = int("".join(filter(str.isdigit, meta_raw[2])))
                save_analytics(topic, c_score, m_score, request.userPrompt)
            except:
                pass

        return {"message": clean_message}
    except Exception as e:
        return {"message": f"AI Error: {str(e)}"}

@app.get("/api/v1/teacher/stats")
async def get_teacher_stats():
    """Returns the logged interaction history for the teacher dashboard."""
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except:
        return []

@app.post("/api/v1/teacher/clear")
async def clear_stats():
    with open(DB_FILE, "w") as f:
        json.dump([], f)
    return {"status": "cleared"}

@app.get("/api/v1/student/progress")
async def get_student_progress():
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except:
        return []

@app.post("/api/v1/arena/submit")
async def arena_submit(request: ArenaRequest):
    """Game Master endpoint for Arena challenges"""
    words = request.text.split()
    n_tokens = len(words)
    if n_tokens == 0:
        return {"error": "Empty input"}
    
    d_k = request.dimension
    
    # Generate tensors for the arena submission
    rng = np.random.default_rng(seed=42)
    Q = rng.standard_normal((n_tokens, d_k))
    K = rng.standard_normal((n_tokens, d_k))
    V = rng.standard_normal((n_tokens, d_k))
    
    # Run the full Transformer block computation
    tensors = compute_full_transformer_block(Q, K, V, d_k)
    
    # Check the win condition (Max attention > 0.95)
    attention_weights = np.array(tensors["attention_weights"])
    
    if attention_weights.shape[0] > 1:
        # Look at all rows EXCEPT the first one
        valid_weights = attention_weights[1:, :]
        max_attention = np.max(valid_weights)
    else:
        # If they only typed one word, they shouldn't win
        max_attention = 0.0
        
    won = bool(max_attention > 0.95)
    
    # Return the result
    return {
        "tensors": tensors,
        "won": won,
        "max_attention": float(max_attention),
        "message": "Bounty Claimed! You forced a complete attention collapse." if won else f"Not quite. Highest attention is currently {max_attention * 100:.1f}%. Keep trying!"
    }

@app.get("/api/v1/arena/detective/start")
def start_detective():
    global current_puzzle
    current_puzzle = random.choice(PUZZLES)
    
    # Run the math on the secret sentence
    words = current_puzzle["text"].split()
    dim = 4  # Default dim
    
    # Generate tensors for the secret sentence
    n_tokens = len(words)
    rng = np.random.default_rng(seed=42)
    Q = rng.standard_normal((n_tokens, dim))
    K = rng.standard_normal((n_tokens, dim))
    V = rng.standard_normal((n_tokens, dim))
    
    # Run the full Transformer block computation
    tensors = compute_full_transformer_block(Q, K, V, dim)
    
    # Create blind labels (Token 1, Token 2, etc.)
    blind_labels = [f"Token {i+1}" for i in range(len(words))]
    
    return {
        "labels": blind_labels,
        "hint": current_puzzle["hint"],
        "attention_weights": tensors["attention_weights"]
    }

@app.post("/api/v1/arena/detective/guess")
def guess_detective(guess: str):
    global current_puzzle
    if not current_puzzle:
        return {"correct": False, "message": "Start a game first!"}
        
    is_correct = guess.lower().strip() == current_puzzle["text"].lower()
    
    return {
        "correct": is_correct,
        "message": "Access Granted! You read the matrix." if is_correct else "Incorrect. Look closer at the attention weights.",
        "answer": current_puzzle["text"] if is_correct else None
    }

@app.get("/api/v1/arena/fixer/start")
def start_fixer(sentence: str = "Break the matrix"):
    global active_bug
    active_bug = random.choice(ARCHITECTURE_BUGS)
    
    # Run the math, but INTENTIONALLY BREAK IT based on the active_bug
    words = sentence.split()
    dim = 4  # Default dim
    
    # Generate tensors for the sentence
    n_tokens = len(words)
    rng = np.random.default_rng(seed=42)
    Q = rng.standard_normal((n_tokens, dim))
    K = rng.standard_normal((n_tokens, dim))
    V = rng.standard_normal((n_tokens, dim))
    
    # Run the bugged Transformer block computation
    tensors = compute_bugged_transformer_block(Q, K, V, dim, active_bug["id"])
    
    return {
        "message": "Architecture deployed. Warning: Anomalies detected in the Attention layer.",
        "hint": active_bug["hint"],
        "tensors": tensors,
        "bug_id": active_bug["id"]
    }

@app.post("/api/v1/arena/fixer/diagnose")
def diagnose_fixer(diagnosis: str):
    global active_bug
    if not active_bug:
        return {"correct": False, "message": "Deploy a bugged architecture first!"}
    
    # Check if the student's diagnosis contains the right keywords
    diagnosis_lower = diagnosis.lower()
    is_correct = any(word in diagnosis_lower for word in active_bug["solution_keywords"])
    
    if is_correct:
        active_bug = None # Reset
        return {"correct": True, "message": "Diagnosis confirmed! Deploying hotfix... The matrix is stable."}
    else:
        return {"correct": False, "message": "Incorrect diagnosis. The matrix is still unstable. Look at the numbers!"}