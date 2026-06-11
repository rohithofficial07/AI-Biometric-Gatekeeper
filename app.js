// ==========================================
// 1. DOM VISUAL ELEMENT PICKERS
// ==========================================
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');

const terminalCard = document.getElementById('terminal-card');
const statusBox = document.getElementById('status-box');
const txtAction = document.getElementById('txt-action');
const progressBar = document.getElementById('progress-bar');

const viewLock = document.getElementById('view-lock');
const viewDashboard = document.getElementById('view-dashboard');
const viewEnroll = document.getElementById('view-enroll');

const btnChange = document.getElementById('btn-change');
const btnLock = document.getElementById('btn-lock');

// ==========================================
// 2. STATE CONFIGURATION & STORAGE
// ==========================================
// App Modes: 'LOCK' | 'DASHBOARD' | 'ENROLL'
let currentMode = 'LOCK'; 
let holdProgress = 0;
let tabTriggered = false; 

// Base default setup if cache empty: Index & Middle up (Peace Sign)
const initialFallbackSign = { index: true, middle: true, ring: false, pinky: false };

let cachedToken = localStorage.getItem('biometric_sign_token');
let savedPasswordPattern = cachedToken ? JSON.parse(cachedToken) : initialFallbackSign;

// Initialize layout coloring rules explicitly on initial boot layout
updateLayoutAppearance();

// ==========================================
// 3. CORE LAYOUT ENGINE SWITCHERS
// ==========================================
function updateLayoutAppearance() {
    // Completely clear layout view frames first
    viewLock.classList.add('hidden');
    viewDashboard.classList.add('hidden');
    viewEnroll.classList.add('hidden');
    
    // Wipe styles clean
    terminalCard.className = "w-full max-w-5xl bg-slate-900 border-2 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[520px] transition-all duration-300";
    statusBox.className = "border rounded-xl p-5 font-mono text-sm space-y-3 mt-6 ";
    progressBar.className = "h-full w-0 transition-all duration-75 ease-out ";

    if (currentMode === 'LOCK') {
        viewLock.classList.remove('hidden');
        terminalCard.classList.add('border-rose-500', 'shadow-rose-950/30');
        statusBox.classList.add('bg-rose-950/20', 'border-rose-900/40');
        progressBar.classList.add('bg-rose-500');
        txtAction.innerText = "ENTER_CURRENT_PASSWORD";
        txtAction.className = "text-rose-400 font-bold";
    } 
    else if (currentMode === 'DASHBOARD') {
        viewDashboard.classList.remove('hidden');
        terminalCard.classList.add('border-cyan-400', 'shadow-cyan-950/30');
        statusBox.classList.add('bg-cyan-950/20', 'border-cyan-900/40');
        progressBar.classList.add('bg-cyan-400');
        txtAction.innerText = "AUTHENTICATED_SESSION_ACTIVE";
        txtAction.className = "text-cyan-400 font-bold";
    } 
    else if (currentMode === 'ENROLL') {
        viewEnroll.classList.remove('hidden');
        terminalCard.classList.add('border-amber-500', 'shadow-amber-950/30');
        statusBox.classList.add('bg-amber-950/20', 'border-amber-900/40');
        progressBar.classList.add('bg-amber-500');
        txtAction.innerText = "HOLD_NEW_SIGN_STEADY";
        txtAction.className = "text-amber-400 font-bold";
    }
}

// Button actions connecting modes
btnChange.addEventListener('click', () => {
    currentMode = 'ENROLL';
    holdProgress = 0;
    progressBar.style.width = '0%';
    updateLayoutAppearance();
});

btnLock.addEventListener('click', () => {
    currentMode = 'LOCK';
    holdProgress = 0;
    tabTriggered = false; // Reset tab lock for fresh authentication
    progressBar.style.width = '0%';
    updateLayoutAppearance();
});

// ==========================================
// 4. REAL-TIME AI SCANNING PROCESS LOOP
// ==========================================
function onResults(results) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    
    // Skip checking any data loops if sitting on the idle Dashboard screen
    if (currentMode === 'DASHBOARD') {
        progressBar.style.width = '0%';
        return;
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const handLandmarks = results.multiHandLandmarks[0];
        drawSkeletonWireframe(handLandmarks);
        const currentHand = getHandState(handLandmarks);

        // --- MODE 1: LOCK SCREEN PROCESSING ---
        if (currentMode === 'LOCK') {
            const isMatch = (
                currentHand.index === savedPasswordPattern.index &&
                currentHand.middle === savedPasswordPattern.middle &&
                currentHand.ring === savedPasswordPattern.ring &&
                currentHand.pinky === savedPasswordPattern.pinky
            );

            if (isMatch) {
                txtAction.innerText = "SIGNATURE_MATCHED!";
                txtAction.className = "text-emerald-400 font-bold animate-pulse";
                
                if (holdProgress < 100) {
                    holdProgress += 4; // Unlocks in roughly 1 second
                    progressBar.style.width = `${holdProgress}%`;
                } else if (!tabTriggered) {
                    tabTriggered = true;
                    // Trigger tab spawn
                    window.open("https://www.instagram.com", "_blank");
                    
                    // Immediately transition inside to Dashboard views
                    currentMode = 'DASHBOARD';
                    holdProgress = 0;
                    updateLayoutAppearance();
                }
            } else {
                txtAction.innerText = "INVALID_SIGNATURE";
                txtAction.className = "text-rose-400 font-bold";
                decayProgress();
            }
        }
        // --- MODE 3: RECORDING NEW PROFILE PASSWORD ---
        else if (currentMode === 'ENROLL') {
            txtAction.innerText = "RECORDING_NEW_SIGN...";
            txtAction.className = "text-amber-400 font-bold animate-pulse";

            if (holdProgress < 100) {
                holdProgress += 3;
                progressBar.style.width = `${holdProgress}%`;
            } else {
                // Commit pattern structures directly to persistent cache configurations
                savedPasswordPattern = currentHand;
                localStorage.setItem('biometric_sign_token', JSON.stringify(currentHand));
                
                // FORCE RELOCK: Instantly kick back out to Lock state demanding the new sign
                currentMode = 'LOCK';
                holdProgress = 0;
                tabTriggered = false; // Reset trigger so it can fire a new tab next time
                progressBar.style.width = '0%';
                updateLayoutAppearance();
            }
        }
    } else {
        // Handle empty fields cleanups
        if (currentMode === 'LOCK') {
            txtAction.innerText = "ENTER_CURRENT_PASSWORD";
            txtAction.className = "text-rose-400 font-bold";
        } else if (currentMode === 'ENROLL') {
            txtAction.innerText = "HOLD_NEW_SIGN_STEADY";
            txtAction.className = "text-amber-400 font-bold";
        }
        decayProgress();
    }
}

// ==========================================
// 5. MATH & VISUAL WIREFRAME UTILITIES
// ==========================================
function getHandState(landmarks) {
    const isFingerOpen = (tipIdx, knuckleIdx) => landmarks[tipIdx].y < landmarks[knuckleIdx].y;
    return {
        index: isFingerOpen(8, 6),
        middle: isFingerOpen(12, 10),
        ring: isFingerOpen(16, 14),
        pinky: isFingerOpen(20, 18)
    };
}

function decayProgress() {
    if (holdProgress > 0) {
        holdProgress -= 6;
        if (holdProgress < 0) holdProgress = 0;
        progressBar.style.width = `${holdProgress}%`;
    }
}

function drawSkeletonWireframe(landmarks) {
    canvasCtx.fillStyle = '#22d3ee';
    for (let point of landmarks) {
        const pixelX = point.x * canvasElement.width;
        const pixelY = point.y * canvasElement.height;
        canvasCtx.beginPath();
        canvasCtx.arc(pixelX, pixelY, 4, 0, 2 * Math.PI);
        canvasCtx.fill();
    }
}

// ==========================================
// 6. INITIALIZE HARDWARE PERMISSIONS
// ==========================================
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => { await hands.send({ image: videoElement }); },
    width: 640,
    height: 360
});
camera.start();
