# Install required libraries:
# pip install speechrecognition pyaudio fpdf flask sounddevice requests flask-jwt-extended

import speech_recognition as sr
import requests
from fpdf import FPDF
from flask import Flask, request, send_file, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import threading
import time
from datetime import datetime
import os

# DeepSeek API setup
DEEPSEEK_API_KEY = "sk-5c8209e281ef46c284a3ed086e2667ff"
DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"
HEADERS = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}

# Flask app setup
app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "your_jwt_secret_key"  # Replace with a strong secret
jwt = JWTManager(app)

# Dummy user database
users = {"admin": "password123"}
notes = []

# Audio capture
transcript = []
recording = False

def capture_audio():
    global transcript, recording
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source, duration=1)
        while recording:
            try:
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
                text = recognizer.recognize_google(audio)
                timestamp = datetime.now().strftime("%H:%M:%S")
                transcript.append(f"[{timestamp}] {text}")
            except sr.UnknownValueError:
                pass
            except sr.RequestError as e:
                print(f"API error: {e}")

def generate_summary(text):
    if not text:
        return "No content to summarize."
    full_text = " ".join([entry.split("] ")[1] for entry in text])
    payload = {
        "model": "deepseek-reasoner",
        "messages": [{"role": "user", "content": f"Summarize this in 100 words with bullet points:\n{full_text}"}],
        "max_tokens": 200
    }
    response = requests.post(DEEPSEEK_URL, json=payload, headers=HEADERS)
    return response.json()["choices"][0]["message"]["content"]

def create_pdf(transcript, summary_text):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "Meeting/Lecture Notes", ln=True, align="C")
    pdf.ln(10)
    pdf.set_font("Arial", size=12)
    pdf.cell(0, 10, "Full Transcript:", ln=True)
    for line in transcript:
        pdf.multi_cell(0, 10, line)
    pdf.ln(10)
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "Summary:", ln=True)
    pdf.set_font("Arial", size=12)
    for point in summary_text.split("\n"):
        if point.strip():
            pdf.cell(0, 10, point.strip(), ln=True)
    output_file = f"notes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    pdf.output(output_file)
    return output_file

# API Routes
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    if username in users and users[username] == password:
        token = create_access_token(identity=username)
        return jsonify({"token": token})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/user", methods=["GET"])
@jwt_required()
def get_user():
    return jsonify({"username": get_jwt_identity()})

@app.route("/start", methods=["GET"])
@jwt_required()
def start_recording():
    global recording, transcript
    if not recording:
        recording = True
        transcript = []
        threading.Thread(target=capture_audio).start()
        return "Recording started"
    return "Already recording"

@app.route("/stop", methods=["GET"])
@jwt_required()
def stop_recording():
    global recording
    if recording:
        recording = False
        summary_text = generate_summary(transcript)
        pdf_file = create_pdf(transcript, summary_text)
        notes.append({"date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 
                      "transcript": " ".join(transcript), 
                      "summary": summary_text, 
                      "filename": pdf_file})
        return send_file(pdf_file, as_attachment=True)
    return "Not recording"

@app.route("/upload", methods=["POST"])
@jwt_required()
def upload():
    file = request.files["file"]
    if file:
        audio_file = sr.AudioFile(file)
        with audio_file as source:
            audio = sr.Recognizer().record(source)
            text = sr.Recognizer().recognize_google(audio)
            transcript = [f"[Uploaded] {text}"]
            summary_text = generate_summary(transcript)
            pdf_file = create_pdf(transcript, summary_text)
            notes.append({"date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 
                          "transcript": " ".join(transcript), 
                          "summary": summary_text, 
                          "filename": pdf_file})
            return send_file(pdf_file, as_attachment=True)
    return "No file uploaded", 400

@app.route("/notes", methods=["GET"])
@jwt_required()
def get_notes():
    return jsonify(notes)

@app.route("/download/<filename>", methods=["GET"])
@jwt_required()
def download(filename):
    return send_file(filename, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
