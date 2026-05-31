// =====================
// ☰ SIDEBAR
// =====================
function toggleMenu(){
    let sidebar = document.getElementById("sidebar");
    let main = document.querySelector(".main");

    sidebar.classList.toggle("active");
    if(main) main.classList.toggle("shift");
}



// 🔓 LOGOUT
function logout(){
    localStorage.removeItem("user");
    window.location.href = "/";
}

// =====================
// 📂 QUESTIONS DATA
// =====================
let questions = [];
let currentIndex = 0;
let totalQuestions = 0;


// =====================
// ⏱ TIMER
// =====================
let timeLeft = 120;
let timerInterval;

function startTimer(){
    clearInterval(timerInterval);
    timeLeft = 120;

    timerInterval = setInterval(()=>{
        let timerEl = document.getElementById("timer");
        if(!timerEl) return;

        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;

        timerEl.innerText = `Time: ${m}:${s < 10 ? '0'+s : s}`;

        timeLeft--;

        if(timeLeft < 0){
            clearInterval(timerInterval);
            submitAnswer();
        }
    },1000);
}

// =====================
// 🎯 LOAD QUESTION
// =====================
function loadQuestion(){

    document.getElementById("question").innerText = questions[currentIndex];
    document.getElementById("answer").value = "";
    document.getElementById("result").innerHTML = "";

    startTimer();
    updateProgress();   // ✅ THIS LINE IS CRITICAL
}

// =====================
// 🎤 VOICE INPUT
// =====================
function startVoice(){
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if(!SpeechRecognition){
        alert("Use Chrome browser");
        return;
    }

    let recognition = new SpeechRecognition();
    recognition.start();

    recognition.onresult = (e)=>{
        document.getElementById("answer").value =
            e.results[0][0].transcript;
    };
}


// =====================
// 📊 SUBMIT ANSWER
// =====================
function submitAnswer(){

    clearInterval(timerInterval);

    let answer = document.getElementById("answer").value;

    fetch('/analyze',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
            answer: answer,
            index: currentIndex
        })
    })
    .then(res=>res.json())
    .then(data=>{

        document.getElementById("result").innerHTML = `
            <div style="background:#1e293b;padding:15px;border-radius:10px;">
                <h3>Score: ${data.score}/100</h3>
                <p>Content: ${data.feedback.content}</p>
                <p>Voice: ${data.feedback.voice}</p>
                <p>Emotion: ${data.feedback.emotion}</p>
            </div>
        `;

        // SAVE RESULT
        localStorage.setItem("resultData", JSON.stringify({
            score: 52,
    feedback: [
        "Too short.",
        "Detailed answer.",
        "Confident tone.",
        "Hesitation detected.",
        "Positive emotion.",
        "Try to give more detailed answers.",
        "Avoid fillers like um, uh."
    ]
            
        }));
        setTimeout(()=>{
            currentIndex = data.next_index;

            if(currentIndex < totalQuestions){
                loadQuestion();
            } else {
                window.location.href = "/result";
            }
        },2000);

    });
}

// =====================
// 🎥 CAMERA
// =====================
let videoStream = null;

function startCamera(){
    let video = document.getElementById("video");
    if(!video) return;

    navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream=>{
        videoStream = stream;
        video.srcObject = stream;
    });
}

// =====================
// 🎥 FACE DETECTION
// =====================
function sendFrame(){
    let video = document.getElementById("video");
    if(!video) return;

    let canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    let ctx = canvas.getContext("2d");
    ctx.drawImage(video,0,0);

    canvas.toBlob(blob=>{
        let formData = new FormData();
        formData.append("image", blob);

        fetch("/detect_face", {
            method:"POST",
            body: formData
        })
        .then(res=>res.json())
        .then(data=>{
            let status = document.querySelector(".ai-status");
            if(!status) return;

            status.innerText = data.face_detected ?
                "😊 Face Detected" :
                "⚠️ No Face";
        });

    },"image/jpeg");
}

// =====================
// 🚀 PAGE LOAD
// =====================
window.onload = function(){

    // INTERVIEW PAGE
    let data = document.body.getAttribute("data-questions");

    if(data){
        questions = JSON.parse(data);
        totalQuestions = questions.length;
        loadQuestion();
    }

    // CAMERA
    if(document.getElementById("video")){
        startCamera();
        setInterval(sendFrame, 3000);
    }

    // RESULT PAGE
    if(window.location.pathname === "/result"){
        let result = JSON.parse(localStorage.getItem("resultData"));
        if(!result) return;

        document.getElementById("score").innerText =
            "Score: " + result.score;

        document.getElementById("feedback").innerText =
            Object.values(result.feedback).join(" | ");
    }
};

// =====================
// 🎯 UPDATE PROGRESS BAR
// =====================
function updateProgress(){
    let percent = ((currentIndex + 1) / totalQuestions) * 100;

    let bar = document.getElementById("progress-bar");
    let text = document.getElementById("progress-text");

    if(bar) bar.style.width = percent + "%";

    if(text){
        text.innerText = `Question ${currentIndex + 1} of ${totalQuestions}`;
    }
}



