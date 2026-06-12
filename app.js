// ==========================================
// 1. SELECT DOM UI COMPONENT HANDLES
// ==========================================
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');

const terminalCard = document.getElementById('terminal-card');
const statusBox = document.getElementById('status-box');
const sysBadge = document.getElementById('sys-badge');
const sysDot = document.getElementById('sys-dot');
const mainTitle = document.getElementById('main-title');
const mainDesc = document.getElementById('main-desc');
const txtAction = document.getElementById('txt-action');
const txtGestureSignature = document.getElementById('txt-gesture-signature');
const progressBar = document.getElementById('progress-bar');
const sequenceTitle = document.getElementById('sequence-title');
const dashboardControls = document.getElementById('dashboard-controls');
const loadingOverlay = document.getElementById('camera-loading-overlay');
const loadingStatus = document.getElementById('loading-status');

const btnChangePass = document.getElementById('btn-change-pass');
const btnRelock = document.getElementById('btn-relock');

// ==========================================
// 2. STATE MACHINE CONFIGURATION
// ==========================================
let currentMode = 'SETUP'; 
let holdProgress = 0;
let activeStepIndex = 0;
let tabTriggered = false;

let temporarySetupSequence = []; 
let savedPasscodeSequence = [];  

let storedVault = localStorage.getItem('biometric_vault_token');
if (storedVault) {
    savedPasscodeSequence = JSON.parse(storedVault);
    currentMode = 'LOCK';
} else {
    currentMode = 'SETUP';
}

syncSystemTheme();

// ==========================================
// 3. SECURE CORE VIEW AND THEME SWITCHERS
// ==========================================
function syncSystemTheme() {
    dashboardControls.classList.add('hidden');
    
    terminalCard.className = terminalCard.className.replace(/\bborder-\S+/g, '').replace(/\bshadow-\S+/g, '');
    sysBadge.className = sysBadge.className.replace(/\btext-\S+/g, '');
    sysDot.className = sysDot.className.replace(/\btext-\S+/g, '').replace(/\bbg-\S+/g, '');
    statusBox.className = statusBox.className.replace(/\bbg-\S+/g, '').replace(/\bborder-\S+/g, '');
    progressBar.className = progressBar.className.replace(/\bbg-\S+/g, '').replace(/\btext-\S+/g, '');

    if (currentMode === 'SETUP') {
        mainTitle.innerText = "Initialize Security Code";
        mainDesc.innerText = "No signature lock found. Hold up 3 distinct hand shapes, one after the other, to draft your passcode strategy.";
        sequenceTitle.innerText = "Registration Sequence Steps:";
        terminalCard.classList.add('border-purple-500', 'shadow-purple-950/20');
        sysBadge.classList.add('text-purple-400'); sysBadge.innerText = "SETUP_MODE";
        sysDot.classList.add('text-purple-400', 'bg-purple-400');
        statusBox.classList.add('bg-purple-950/10', 'border-purple-900/30');
        progressBar.classList.add('bg-purple-500', 'text-purple-400');
    } 
    else if (currentMode === 'CONFIRM') {
        mainTitle.innerText = "Confirm Code Strategy";
        mainDesc.innerText = "Passcode drafted! Repeat those exact 3 gestures in chronological order to authorize structural write-access.";
        sequenceTitle.innerText = "Verification Sequence Steps:";
        terminalCard.classList.add('border-amber-500', 'shadow-amber-950/20');
        sysBadge.classList.add('text-amber-400'); sysBadge.innerText = "CONFIRMATION_MODE";
        sysDot.classList.add('text-amber-400', 'bg-amber-400');
        statusBox.classList.add('bg-amber-950/10', 'border-amber-900/30');
        progressBar.classList.add('bg-amber-500', 'text-amber-400');
    } 
    else if (currentMode === 'LOCK') {
        mainTitle.innerText = "System Gate Locked";
        mainDesc.innerText = "Firewall engaged. Execute your custom 3-gesture passcode combination in sequence to decrypt access routes and open your GitHub.";
        sequenceTitle.innerText = "Security Authorization Steps:";
        terminalCard.classList.add('border-rose-500', 'shadow-rose-950/20');
        sysBadge.classList.add('text-rose-400'); sysBadge.innerText = "CORE_LOCKED";
        sysDot.classList.add('text-rose-400', 'bg-rose-400');
        statusBox.classList.add('bg-rose-950/10', 'border-rose-900/30');
        progressBar.classList.add('bg-rose-500', 'text-rose-400');
    } 
    else if (currentMode === 'RE_AUTH') {
        mainTitle.innerText = "Re-Authenticate First";
        mainDesc.innerText = "Privileged operation requested. Provide your current 3-gesture security passphrase sequence to verify administrative ownership.";
        sequenceTitle.innerText = "Re-Authentication Sequence:";
        terminalCard.classList.add('border-yellow-500', 'shadow-yellow-950/20');
        sysBadge.classList.add('text-yellow-400'); sysBadge.innerText = "SUDO_CHALLENGE";
        sysDot.classList.add('text-yellow-400', 'bg-yellow-400');
        statusBox.classList.add('bg-yellow-950/10', 'border-yellow-900/30');
        progressBar.classList.add('bg-yellow-500', 'text-yellow-400');
    } 
    else if (currentMode === 'DASHBOARD') {
        mainTitle.innerText = "Admin Console Open";
        mainDesc.innerText = "Authentication successful! Target page executed. Use the settings options below to safely clear or update credentials.";
        sequenceTitle.innerText = "Active Biometric Token Blueprint:";
        dashboardControls.classList.remove('hidden');
        terminalCard.classList.add('border-cyan-400', 'shadow-cyan-950/20');
        sysBadge.classList.add('text-cyan-400'); sysBadge.innerText = "SYS_AUTHORIZED";
        sysDot.classList.add('text-cyan-400', 'bg-cyan-400');
        statusBox.classList.add('bg-cyan-950/10', 'border-cyan-900/30');
        progressBar.classList.add('bg-cyan-400', 'text-cyan-400');
    }
    
    renderStepCards();
}

// ==========================================
// 4. STEP CARD RENDERERS
// ==========================================
function renderStepCards() {
    for (let i = 0; i < 3; i++) {
        const card = document.getElementById(`step-card-${i}`);
        const txt = document.getElementById(`step-text-${i}`);
        if (!card || !txt) continue;

        card.className = "bg-slate-950/40 border p-3 rounded-xl text-center transition-all duration-300 ";
        txt.className = "text-xs font-bold truncate ";

        let modeColor = currentMode === 'SETUP' ? 'purple' : currentMode === 'CONFIRM' ? 'amber' : currentMode === 'LOCK' || currentMode === 'RE_AUTH' ? 'rose' : 'cyan';

        if (i === activeStepIndex && currentMode !== 'DASHBOARD') {
            card.className += `border-${modeColor}-400 bg-slate-950 shadow-[0_0_15px_rgba(var(--color-${modeColor}),0.1)] scale-[1.02] z-10`;
            txt.className += `text-${modeColor}-400 animate-pulse`;
            txt.innerText = "RECORDING...";
        } else if (i < activeStepIndex || currentMode === 'DASHBOARD') {
            card.className += "border-emerald-500/30 bg-slate-900/40 opacity-90";
            txt.className += "text-emerald-400 font-medium";
            txt.innerText = getPatternString(currentMode === 'SETUP' ? temporarySetupSequence[i] : savedPasscodeSequence[i]) + " ✔";
        } else {
            card.className += "border-slate-900/60 opacity-30";
            txt.className += "text-slate-600";
            txt.innerText = "PENDING";
        }
    }
}

function getPatternString(pattern) {
    if (!pattern) return "EMPTY";
    let active = [];
    if (pattern.index) active.push("INDX");
    if (pattern.middle) active.push("MID");
    if (pattern.ring) active.push("RNG");
    if (pattern.pinky) active.push("PNK");
    return active.length === 0 ? "FIST" : active.join("+");
}

btnChangePass.addEventListener('click', () => {
    currentMode = 'RE_AUTH';
    activeStepIndex = 0;
    holdProgress = 0;
    syncSystemTheme();
});

btnRelock.addEventListener('click', () => {
    currentMode = 'LOCK';
    activeStepIndex = 0;
    holdProgress = 0;
    tabTriggered = false;
    syncSystemTheme();
});

// ==========================================
// 5. MASTER REAL-TIME DATA PROCESSING FRAMEWORK
// ==========================================
function onResults(results) {
    if (loadingOverlay) {
        loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
    }

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    
    if (currentMode === 'DASHBOARD') {
        progressBar.style.width = '0%';
        txtAction.innerText = "CONSOLE_ARMED_IDLE";
        txtAction.className = "text-cyan-400 font-bold";
        return;
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const handLandmarks = results.multiHandLandmarks[0];
        drawSkeletonWireframe(handLandmarks);
        const currentHand = getHandState(handLandmarks);
        
        txtGestureSignature.innerText = `SIGN: ${getPatternString(currentHand)}`;

        if (currentMode === 'SETUP') {
            handleSetupPacing(currentHand);
        } 
        else if (currentMode === 'CONFIRM') {
            handleVerificationPacing(currentHand, temporarySetupSequence);
        } 
        else if (currentMode === 'LOCK') {
            handleVerificationPacing(currentHand, savedPasscodeSequence, true);
        } 
        else if (currentMode === 'RE_AUTH') {
            handleVerificationPacing(currentHand, savedPasscodeSequence, false, true);
        }
    } else {
        txtGestureSignature.innerText = "SIGN: NONE";
        txtAction.innerText = "NO_HAND_DETECTED";
        txtAction.className = "text-slate-500 font-medium";
        decayProgress();
    }
}

// ==========================================
// 6. PROCESSING STATE MACHINE LOGIC SEGMENTS
// ==========================================
function handleSetupPacing(hand) {
    txtAction.innerText = `HOLDING_STAGE_0${activeStepIndex + 1}_PATTERN...`;
    txtAction.className = "text-purple-400 font-bold animate-pulse";

    if (holdProgress < 100) {
        holdProgress += 4; 
        progressBar.style.width = `${holdProgress}%`;
    } else {
        temporarySetupSequence[activeStepIndex] = hand;
        
        if (activeStepIndex < 2) {
            activeStepIndex++;
            holdProgress = 0;
            renderStepCards();
        } else {
            currentMode = 'CONFIRM';
            activeStepIndex = 0;
            holdProgress = 0;
            syncSystemTheme();
        }
    }
}

function handleVerificationPacing(hand, targetSequence, openTabOnSuccess = false, unlockDashboardOnSuccess = false) {
    const expectedPattern = targetSequence[activeStepIndex];
    if (!expectedPattern) return;

    const isMatch = (
        hand.index === expectedPattern.index &&
        hand.middle === expectedPattern.middle &&
        hand.ring === expectedPattern.ring &&
        hand.pinky === expectedPattern.pinky
    );

    let themeColor = currentMode === 'CONFIRM' ? 'amber' : currentMode === 'RE_AUTH' ? 'yellow' : 'rose';

    if (isMatch) {
        txtAction.innerText = `STAGE_0${activeStepIndex + 1}_VERIFIED! STEADY...`;
        txtAction.className = "text-emerald-400 font-bold animate-pulse";
        
        if (holdProgress < 100) {
            holdProgress += 5; 
            progressBar.style.width = `${holdProgress}%`;
        } else {
            if (activeStepIndex < 2) {
                activeStepIndex++;
                holdProgress = 0;
                renderStepCards();
            } else {
                if (currentMode === 'CONFIRM') {
                    savedPasscodeSequence = [...temporarySetupSequence];
                    localStorage.setItem('biometric_vault_token', JSON.stringify(savedPasscodeSequence));
                    
                    currentMode = 'LOCK';
                    activeStepIndex = 0;
                    holdProgress = 0;
                    syncSystemTheme();
                } 
                else if (currentMode === 'RE_AUTH') {
                    currentMode = 'SETUP';
                    temporarySetupSequence = [];
                    activeStepIndex = 0;
                    holdProgress = 0;
                    syncSystemTheme();
                }
                else if (currentMode === 'LOCK' && !tabTriggered) {
                    tabTriggered = true;
                    window.open("https://github.com/rohith-7031", "_blank");
                    
                    currentMode = 'DASHBOARD';
                    activeStepIndex = 0;
                    holdProgress = 0;
                    syncSystemTheme();
                }
            }
        }
    } else {
        txtAction.innerText = `PROVIDE_STAGE_0${activeStepIndex + 1}_PATTERN`;
        txtAction.className = `text-${themeColor}-400 font-semibold`;
        decayProgress();
    }
}

// ==========================================
// 7. MATH AND WIREFRAME CONFIGURATIONS
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

// Modified smooth linear recovery drop code configuration
function decayProgress() {
    if (holdProgress > 0) {
        holdProgress -= 5;
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
        canvasCtx.arc(pixelX, pixelY, 3, 0, 2 * Math.PI);
        canvasCtx.fill();
    }
}

// ==========================================
// 8. INITIALIZE RUNTIME CAMERA & CAPTURE ERROR STRINGS
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
    onFrame: async () => { 
        try {
            await hands.send({ image: videoElement }); 
        } catch(e) {
            console.error("Tracking pipeline hold error:", e);
        }
    },
    width: 640,
    height: 360
});

camera.start().catch(err => {
    console.error("Camera connection fault:", err);
    if(loadingStatus) {
        loadingStatus.innerHTML = `<span class="text-rose-400 font-bold">HARDWARE_PERMISSION_BLOCKED</span><br><br>Your web browser restricted camera access because it is not running on a secure network context (localhost or HTTPS). Run your project via VS Code Live Server to bypass this restriction!`;
        const loaderIcon = loadingOverlay.querySelector('.animate-spin');
        if (loaderIcon) loaderIcon.remove();
    }
});
