from flask import Flask, render_template, request, redirect, session, url_for, jsonify
from textblob import TextBlob
import cv2
import numpy as np
from flask import Flask, render_template, request, redirect, url_for,flash

app = Flask(__name__)
app.secret_key = "secret"

# 👤 TEMP USER STORAGE (acts like database)
users = []

# 🎯 QUESTIONS
questions = [
    "Tell me about yourself.",
    "What are your strengths?",
    "Why should we hire you?",
    "Describe a challenge you faced.",
    "Where do you see yourself in 5 years?"
]

# =====================
# 🏠 HOME
# =====================
@app.route("/")
def home():
    return render_template("index.html")


# =====================
# 🔐 LOGIN
# =====================
@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        username = request.form.get("username")
        password = request.form.get("password")

        for user in users:

            if user["username"] == username and user["password"] == password:

                session["user"] = username

                return redirect(url_for("interview"))
            

        return render_template(
            "login.html",
            error="Invalid Username or Password"
        )

    return render_template("login.html")
# =====================
# 📝 REGISTER
# =====================
@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        fullname = request.form.get("fullname")
        username = request.form.get("username")
        email = request.form.get("email")
        mobile = request.form.get("mobile")
        gender = request.form.get("gender")
        password = request.form.get("password")

        # Save user
        users.append({
            "fullname": fullname,
            "username": username,
            "email": email,
            "mobile": mobile,
            "gender": gender,
            "password": password
        })

        print(users)

        flash("Registration Successful! Please Login")

        return redirect(url_for("login"))

    return render_template("register.html")


# =====================
# 🚪 LOGOUT
# =====================
@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect("/")

# =====================
# 🎤 INTERVIEW (PROTECTED)
# =====================
@app.route("/interview")
def interview():
    if "user" not in session:
        return redirect("/login")

    return render_template("interview.html",questions=questions)

# =====================
# 📊 RESULT (PROTECTED)
# =====================
@app.route("/result")
def result():
    if "user" not in session:
        return redirect("/login")

    return render_template("result.html")

# =====================
# 🧠 ANALYZE
# =====================
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    answer = data.get("answer", "")
    index = data.get("index", 0)

    blob = TextBlob(answer)
    polarity = blob.sentiment.polarity

    words = answer.split()
    length = len(words)

    # CONTENT
    if length > 40:
        content = "Detailed answer."
        content_score = 30
    elif length > 15:
        content = "Good but can improve."
        content_score = 20
    else:
        content = "Too short."
        content_score = 10

    # VOICE
    if any(w in answer.lower() for w in ["um", "uh", "maybe"]):
        voice = "Hesitation detected."
        voice_score = 5
    else:
        voice = "Confident tone."
        voice_score = 20

    # EMOTION
    if polarity > 0.2:
        emotion = "Positive"
        emotion_score = 20
    elif polarity < -0.2:
        emotion = "Negative"
        emotion_score = 5
    else:
        emotion = "Neutral"
        emotion_score = 10

    score = min(100, content_score + voice_score + emotion_score)

    return jsonify({
        "score": score,
        "feedback": {
            "content": content,
            "voice": voice,
            "emotion": emotion
        },
        "next_index": index + 1
    })

# =====================
# 🎥 FACE DETECTION
# =====================
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

@app.route('/detect_face', methods=['POST'])
def detect_face():
    file = request.files['image']

    img_bytes = file.read()
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    return jsonify({
        "face_detected": len(faces) > 0
    })

if __name__ == "__main__":
    app.run(debug=True)










