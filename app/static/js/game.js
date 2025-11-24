
// DOM Elements
const gameElements = document.getElementById('game-elements');
const particlesLayer = document.getElementById('particles');
const uiLayer = document.getElementById('ui-layer');
const scoreElement = document.getElementById('score');
const speedElement = document.getElementById('speed');
const levelElement = document.getElementById('level');
const roadMarkings = document.getElementById('road-markings');

// Screens
const mainMenu = document.getElementById('main-menu');
const creditsScreen = document.getElementById('credits');
const highScoresScreen = document.getElementById('high-scores');
const gameOverScreen = document.getElementById('game-over');
const pausedScreen = document.getElementById('paused-screen');
const finalScoreElement = document.getElementById('final-score');
const highScoresList = document.getElementById('high-scores-list');

// Buttons
const btnPlay = document.getElementById('btn-play');
const btnCredits = document.getElementById('btn-credits');
const btnCreditsBack = document.getElementById('btn-credits-back');
const btnHighScores = document.getElementById('btn-highscores');
const btnHighScoresBack = document.getElementById('btn-highscores-back');
const btnRetry = document.getElementById('btn-retry');
const btnMenu = document.getElementById('btn-menu');
const btnPause = document.getElementById('btn-pause');
const btnResume = document.getElementById('btn-resume');
const btnQuit = document.getElementById('btn-quit');

if (!gameElements || !uiLayer || !scoreElement || !speedElement || !levelElement || !roadMarkings || !particlesLayer ||
    !mainMenu || !creditsScreen || !highScoresScreen || !gameOverScreen || !pausedScreen || !finalScoreElement || !highScoresList ||
    !btnPlay || !btnCredits || !btnCreditsBack || !btnHighScores || !btnHighScoresBack || !btnRetry || !btnMenu || !btnPause || !btnResume || !btnQuit) {
    throw new Error("Required DOM elements not found");
}

// Constants
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const CAR_WIDTH = 50;
const CAR_HEIGHT = 90;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 90;
const LANE_WIDTH = 120;
const LANE_OFFSET = 20;

// State
let currentState = 'MENU';

let playerX = LANE_OFFSET + LANE_WIDTH * 1.5 - CAR_WIDTH / 2;
let playerY = GAME_HEIGHT - CAR_HEIGHT - 40;
let score = 120;
let speed = 6; // 120 km/h
let level = 1;
let obstacles = [];
let particles = [];
let lastTime = 0;
let obstacleSpawnTimer = 0;
let particleSpawnTimer = 0;
let roadOffsetY = 0;

// Helper to create car SVG
function createCarSVG(type) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    if (type === 'player') group.setAttribute("filter", "url(#glow)");

    // Wheels
    const wheelColor = "#000";
    const wheels = [
        { x: 2, y: 12 }, { x: CAR_WIDTH - 12, y: 12 },
        { x: 2, y: CAR_HEIGHT - 22 }, { x: CAR_WIDTH - 12, y: CAR_HEIGHT - 22 }
    ];
    wheels.forEach(pos => {
        const wheel = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        wheel.setAttribute("x", pos.x.toString());
        wheel.setAttribute("y", pos.y.toString());
        wheel.setAttribute("width", "10");
        wheel.setAttribute("height", "16");
        wheel.setAttribute("fill", wheelColor);
        wheel.setAttribute("rx", "2");
        group.appendChild(wheel);
    });

    // Body
    const body = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = `M 5 15 Q 25 -5 45 15 L 45 80 Q 25 95 5 80 Z`;
    body.setAttribute("d", d);
    body.setAttribute("fill", type === 'player' ? "url(#carGradient)" : "url(#enemyGradient)");
    group.appendChild(body);

    // Windshield
    const windshield = document.createElementNS("http://www.w3.org/2000/svg", "path");
    windshield.setAttribute("d", "M 10 30 L 40 30 L 38 50 L 12 50 Z");
    windshield.setAttribute("fill", "#2d3436");
    windshield.setAttribute("opacity", "0.8");
    group.appendChild(windshield);

    // Rear Window
    const rearWindow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    rearWindow.setAttribute("d", "M 12 60 L 38 60 L 40 75 L 10 75 Z");
    rearWindow.setAttribute("fill", "#2d3436");
    rearWindow.setAttribute("opacity", "0.8");
    group.appendChild(rearWindow);

    // Headlights
    const lightColor = type === 'player' ? "#00d2d3" : "#ff9f43";
    const l1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    l1.setAttribute("d", "M 6 10 L 14 10 L 14 14 L 6 18 Z");
    l1.setAttribute("fill", lightColor);
    group.appendChild(l1);

    const l2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    l2.setAttribute("d", `M ${CAR_WIDTH - 6} 10 L ${CAR_WIDTH - 14} 10 L ${CAR_WIDTH - 14} 14 L ${CAR_WIDTH - 6} 18 Z`);
    l2.setAttribute("fill", lightColor);
    group.appendChild(l2);

    // Tail lights
    const tailColor = "#ff4757";
    const t1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    t1.setAttribute("x", "8");
    t1.setAttribute("y", (CAR_HEIGHT - 5).toString());
    t1.setAttribute("width", "8");
    t1.setAttribute("height", "3");
    t1.setAttribute("fill", tailColor);
    group.appendChild(t1);

    const t2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    t2.setAttribute("x", (CAR_WIDTH - 16).toString());
    t2.setAttribute("y", (CAR_HEIGHT - 5).toString());
    t2.setAttribute("width", "8");
    t2.setAttribute("height", "3");
    t2.setAttribute("fill", tailColor);
    group.appendChild(t2);

    return group;
}

// Initialize Player Car
const playerCar = createCarSVG('player');
gameElements.appendChild(playerCar);

function updatePlayerPosition() {
    playerCar.setAttribute("transform", `translate(${playerX}, ${playerY})`);
}

// Particle System
function createParticle(x, y) {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    p.setAttribute("r", (Math.random() * 2 + 1).toString());
    p.setAttribute("fill", "#bdc3c7");
    p.setAttribute("opacity", "0.6");
    particlesLayer.appendChild(p);

    particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 2, // Move down
        life: 1.0,
        element: p
    });
}

// High Scores Logic
function getHighScores() {
    const stored = localStorage.getItem('turboRacerHighScores');
    return stored ? JSON.parse(stored) : [0, 0, 0, 0, 0];
}

function saveHighScore(newScore) {
    const scores = getHighScores();
    scores.push(newScore);
    scores.sort((a, b) => b - a);
    const top5 = scores.slice(0, 5);
    localStorage.setItem('turboRacerHighScores', JSON.stringify(top5));
}

function updateHighScoresList() {
    const scores = getHighScores();
    highScoresList.innerHTML = scores.map((s, i) => `
        <li>
            <span>#${i + 1}</span>
            <span>${s}</span>
        </li>
    `).join('');
}

// Game Logic Functions
function startGame() {
    currentState = 'PLAYING';
    score = 120;
    speed = 6; // 120 km/h
    level = 1;

    // Cleanup
    obstacles.forEach(obs => gameElements.removeChild(obs.element));
    obstacles = [];
    particles.forEach(p => particlesLayer.removeChild(p.element));
    particles = [];

    playerX = LANE_OFFSET + LANE_WIDTH * 1.5 - CAR_WIDTH / 2;
    updatePlayerPosition();

    // UI Updates
    mainMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pausedScreen.classList.add('hidden');
    uiLayer.classList.remove('hidden');
    scoreElement.textContent = `SCORE: ${score}`;
    speedElement.textContent = `120 KM/H`;
    levelElement.textContent = `LVL: 1`;

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function togglePause() {
    if (currentState === 'PLAYING') {
        currentState = 'PAUSED';
        pausedScreen.classList.remove('hidden');
    } else if (currentState === 'PAUSED') {
        currentState = 'PLAYING';
        pausedScreen.classList.add('hidden');
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

function showMainMenu() {
    currentState = 'MENU';
    mainMenu.classList.remove('hidden');
    creditsScreen.classList.add('hidden');
    highScoresScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pausedScreen.classList.add('hidden');
    uiLayer.classList.add('hidden');
}

function showCredits() {
    currentState = 'CREDITS';
    mainMenu.classList.add('hidden');
    creditsScreen.classList.remove('hidden');
}

function showHighScores() {
    currentState = 'HIGHSCORES';
    updateHighScoresList();
    mainMenu.classList.add('hidden');
    highScoresScreen.classList.remove('hidden');
}

function gameOver() {
    currentState = 'GAMEOVER';
    saveHighScore(score);
    gameOverScreen.classList.remove('hidden');
    finalScoreElement.textContent = `${score}`;
    uiLayer.classList.add('hidden');
}

function createObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const x = LANE_OFFSET + lane * LANE_WIDTH + (LANE_WIDTH - OBSTACLE_WIDTH) / 2;
    const y = -OBSTACLE_HEIGHT;

    const obstacle = createCarSVG('enemy');
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.appendChild(obstacle);
    obstacle.setAttribute("transform", `rotate(180, ${CAR_WIDTH / 2}, ${CAR_HEIGHT / 2})`);
    g.setAttribute("transform", `translate(${x}, ${y})`);

    gameElements.appendChild(g);
    obstacles.push({ x, y, element: g });
}

function checkCollision(obs) {
    const padding = 8;
    return (
        playerX + padding < obs.x + OBSTACLE_WIDTH - padding &&
        playerX + CAR_WIDTH - padding > obs.x + padding &&
        playerY + padding < obs.y + OBSTACLE_HEIGHT - padding &&
        playerY + CAR_HEIGHT - padding > obs.y + padding
    );
}

// Event Listeners
btnPlay.addEventListener('click', startGame);
btnCredits.addEventListener('click', showCredits);
btnCreditsBack.addEventListener('click', showMainMenu);
btnHighScores.addEventListener('click', showHighScores);
btnHighScoresBack.addEventListener('click', showMainMenu);
btnRetry.addEventListener('click', startGame);
btnMenu.addEventListener('click', showMainMenu);
btnPause.addEventListener('click', togglePause);
btnResume.addEventListener('click', togglePause);
btnQuit.addEventListener('click', showMainMenu);

window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }

    if (currentState !== 'PLAYING') return;
    const moveAmount = LANE_WIDTH;

    if (e.key === 'ArrowLeft') {
        if (playerX > LANE_OFFSET + LANE_WIDTH / 2) {
            playerX -= moveAmount;
        }
    } else if (e.key === 'ArrowRight') {
        if (playerX < GAME_WIDTH - LANE_OFFSET - LANE_WIDTH) {
            playerX += moveAmount;
        }
    }
    updatePlayerPosition();
});

// Game Loop
function gameLoop(timestamp) {
    if (currentState !== 'PLAYING') return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Road Animation
    roadOffsetY += speed;
    if (roadOffsetY >= 120) roadOffsetY = 0;
    roadMarkings.setAttribute("transform", `translate(0, ${roadOffsetY})`);

    // Particles
    particleSpawnTimer += deltaTime;
    if (particleSpawnTimer > 50) {
        createParticle(playerX + 10, playerY + CAR_HEIGHT);
        createParticle(playerX + CAR_WIDTH - 10, playerY + CAR_HEIGHT);
        particleSpawnTimer = 0;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;

        if (p.life <= 0) {
            particlesLayer.removeChild(p.element);
            particles.splice(i, 1);
        } else {
            p.element.setAttribute("cx", p.x.toString());
            p.element.setAttribute("cy", p.y.toString());
            p.element.setAttribute("opacity", p.life.toString());
        }
    }

    // Level Logic
    if (score >= 1000 && level < 3) {
        level = 3;
        speed = Math.max(speed, 10); // Ensure at least 200 km/h
        levelElement.textContent = `LVL: 3`;
    } else if (score >= 500 && level < 2) {
        level = 2;
        speed = Math.max(speed, 8); // Ensure at least 160 km/h
        levelElement.textContent = `LVL: 2`;
    }

    // Spawn obstacles
    obstacleSpawnTimer += deltaTime;
    // Spawn rate decreases as speed increases
    if (obstacleSpawnTimer > 1500 - (speed * 60)) {
        createObstacle();
        obstacleSpawnTimer = 0;
        // Continuous acceleration: Increase speed by ~1 km/h (0.05) per obstacle
        if (speed < 30) speed += 0.05;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (!obs) continue;

        obs.y += speed;
        obs.element.setAttribute("transform", `translate(${obs.x}, ${obs.y})`);

        if (checkCollision(obs)) {
            gameOver();
            return;
        }

        if (obs.y > GAME_HEIGHT) {
            gameElements.removeChild(obs.element);
            obstacles.splice(i, 1);
            score++;
            scoreElement.textContent = `SCORE: ${score}`;
            speedElement.textContent = `${Math.floor(speed * 20)} KM/H`;
        }
    }

    requestAnimationFrame(gameLoop);
}

// Initial Setup
updatePlayerPosition();
showMainMenu();
