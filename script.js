/*
Dohvacam canvas objekt iz html-a i inicijaliziram kontekst za crtanje.
Isto tako definiram velicinu canvas-a na velicinu cijelog prozora u pregledniku, ali oduzimam 10px za bijeli okvir.
 */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth - 10;
canvas.height = window.innerHeight - 10;

/*
Definiram parametre palice.
 */
const paddleWidth = (canvas.width * 0.15); // sirina palice
const paddleHeight = (canvas.height * 0.03); // visina palice
let paddleX = (canvas.width - paddleWidth) / 2; // pocetna pozicija palice

/*
Definiram parametre loptice.
 */
const ballRadius = 10; // radijus loptice
let ballX = canvas.width / 2; // pocetna pozicija loptice
let ballY = canvas.height - 30; // pocetna pozicija loptice
const ballSpeed = (canvas.width + canvas.height) * 0.0018; // konstantna brzina loptice
let ballSpeedX = ballSpeed; // x komponenta brzine loptice
let ballSpeedY = -ballSpeed; // y komponenta brzine loptice
const maxAngle = Math.PI / 3; // maksimalni kut loptice pri odbijanju od palice (60 stupnjeva)

/*
Definiram pocetne vrijednosti za bodove i najbolji rezultat te parametar koji kaze jeli igra gotova.
 */
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameOver = false;

/*
Definiram zvukove za pobjedu, gubitak i pogodak cigle.
 */
const winSound = new Audio('win.mp3');
const loseSound = new Audio('lose.mp3');
const hitSound = new Audio('hit.mp3');

/*
Definiram slike za ciglu, palicu i pozadinu.
 */
const brickImage = new Image();
brickImage.src = 'brick.jpg';
const paddleImage = new Image();
paddleImage.src = 'paddle.jpg';
const backgroundImage = new Image();
backgroundImage.src = 'background.jpg';

/*
Definiram parametre za cigle.
 */
const brickColumnCount = 9; // broj cigli u jednom redu
const brickRowCount = 4; // broj cigli u jednom stupcu
const brickAreaHeightRatio = 0.3; // dio visine canvas-a koji zauzimaju cigle
const brickPadding = 10; // padding izmedu cigli
const brickOffsetTop = 50; // offset od vrha canvas-a do prvog reda cigli
let brickWidth = (canvas.width - (brickColumnCount - 1) * brickPadding) / brickColumnCount; // dinamicno racunanje sirine cigle
let brickHeight = ((canvas.height * brickAreaHeightRatio) - (brickRowCount - 1) * brickPadding) / brickRowCount; // dinamicno racunanje visine cigle

/*
Definiram 2D polje za cigle i postavljam status svake cigle na 1, odnosno svaka cigla je u pocetku vidljiva.
 */
let bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

/*
Funkcija za crtanje cigli koja prolazi kroz 2D polje cigli i crta samo vidljive cigle.
Na temelju broja cigle racuna se pozicija svake cigle.
 */
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                let brickX = c * (brickWidth + brickPadding);
                let brickY = brickOffsetTop + r * (brickHeight + brickPadding);
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                ctx.beginPath();
                ctx.drawImage(brickImage, brickX, brickY, brickWidth, brickHeight);
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#ffffff";
                ctx.strokeRect(brickX, brickY, brickWidth, brickHeight);
                ctx.closePath();
            }
        }
    }
}

/*
Funkcija za crtanje palice.
 */
function drawPaddle() {
    ctx.beginPath();
    ctx.drawImage(paddleImage, paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.closePath();
}

/*
Funkcija za crtanje loptice.
 */
function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
}

/*
Funkcija za crtanje bodova i najboljeg rezultata.
 */
function drawScore() {
    document.fonts.load('23px ArcadeClassic').then(() => {
        const scoreText = "Score: " + score;
        const highScoreText = "High  score: " + highScore;
        const textX = canvas.width - 20;

        ctx.font = "23px ArcadeClassic";
        ctx.fillStyle = "white";
        ctx.textAlign = "right";
        ctx.fillText(scoreText, textX, 20);
        ctx.fillText(highScoreText, textX, 40);
    });
}

/*
Funkcija za ispis zavrsne poruke na ekranu.
 */
function endGameWithMessage(message) {
    gameOver = true;
    document.fonts.load('120px ArcadeClassic').then(() => {
        ctx.font = "120px ArcadeClassic";
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    });
}

/*
Funkcija za detekciju kolizije loptice i cigli.
 */
function brickCollisionDetection() {
    if (gameOver) return; // provjeri jeli igra gotova
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) { // samo ako je cigla vidljiva
                const withinBrickX = ballX > b.x && ballX < b.x + brickWidth; // provjeri jeli loptica unutar x granica cigle
                const withinBrickY = ballY > b.y && ballY < b.y + brickHeight; // provjeri jeli loptica unutar y granica cigle
                let angleOffset = (Math.random() - 0.5) * (Math.PI / 18); // mala varijacija kuta odbijanja (-5° do +5°)

                // ako je loptica unutar granica cigle i cigla je pogodjena sa strane
                if (withinBrickX && (ballY + ballRadius >= b.y && ballY - ballRadius <= b.y + brickHeight)) {
                    b.status = 0; // oznaci ciglu kao pogodjenu
                    score++;
                    hitSound.play().then();

                    // obrni y smjer i dodaj mali kut odbijanja
                    ballSpeedY = -ballSpeedY;
                    let newAngle = Math.atan2(ballSpeedY, ballSpeedX) + angleOffset;

                    // preracunaj brzine loptice kako bi se odrzala konstantna brzina
                    ballSpeedX = ballSpeed * Math.cos(newAngle);
                    ballSpeedY = ballSpeed * Math.sin(newAngle);
                // ako je loptica unutar granica cigle i cigla je pogodjena odozgo ili odozdo
                } else if (withinBrickY && (ballX + ballRadius >= b.x && ballX - ballRadius <= b.x + brickWidth)) {
                    b.status = 0; // oznaci ciglu kao pogodjenu
                    score++;
                    hitSound.play().then();

                    // obrni x smjer i dodaj mali kut odbijanja
                    ballSpeedX = -ballSpeedX;
                    let newAngle = Math.atan2(ballSpeedY, ballSpeedX) + angleOffset;

                    // preracunaj brzine loptice kako bi se odrzala konstantna brzina
                    ballSpeedX = ballSpeed * Math.cos(newAngle);
                    ballSpeedY = ballSpeed * Math.sin(newAngle);
                }
                // provjeri jeli postignut novi najbolji rezultat
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('highScore', highScore);
                }
            }
        }
    }
}

/*
Funkcija za detekciju kolizije loptice i zidova canvas-a.
 */
function edgeCollisionDetection() {
    // provjeri koliziju sa bocnim zidovima canvas-a
    if (ballX + ballSpeedX > canvas.width - ballRadius || ballX + ballSpeedX < ballRadius) {
        ballSpeedX = -ballSpeedX;
    }
    // provjeri koliziju sa gornjim zidom canvas-a
    if (ballY + ballSpeedY < ballRadius) {
        ballSpeedY = -ballSpeedY;
    // provjeri koliziju sa donjim zidom canvas-a
    } else if (ballY + ballRadius > canvas.height) {
        loseSound.play().then(() => {
            setTimeout(() => {
                loseSound.pause();
            }, 4000);
        });
        endGameWithMessage("GAME  OVER");
    }
    // osvjezi poziciju loptice
    ballX += ballSpeedX;
    ballY += ballSpeedY;
}

/*
Funkcija za detekciju kolizije loptice i palice.
 */
function paddleCollisionDetection() {
    // provjeri jeli loptica udarila u palicu
    if (ballY + ballRadius >= canvas.height - paddleHeight) {
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
            // izracunaj kut odbijanja loptice ovisno o mjestu udarca na palicu
            let hitPoint = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
            let angle = hitPoint * maxAngle;
            // preracunaj brzine loptice kako bi se odrzala konstantna brzina
            ballSpeedX = ballSpeed * Math.sin(angle);
            ballSpeedY = -ballSpeed * Math.cos(angle);
        }
    }
    // osvjezi poziciju loptice
    ballX += ballSpeedX;
    ballY += ballSpeedY;
}

/*
Varijable za pracenje stanja tipki na tipkovnici.
 */
let rightPressed = false;
let leftPressed = false;

/*
Event listener za pritisak tipke na tipkovnici.
 */
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "d") {
        rightPressed = true;
    } else if (e.key === "ArrowLeft" || e.key === "a") {
        leftPressed = true;
    }
});

/*
Event listener za otpustanje tipke na tipkovnici.
 */
document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowRight" || e.key === "d") {
        rightPressed = false;
    } else if (e.key === "ArrowLeft" || e.key === "a") {
        leftPressed = false;
    }
});

/*
Funkcija za pomicanje palice lijevo i desno.
 */
function movePaddle() {
    const paddleSpeed = 8;
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += paddleSpeed;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= paddleSpeed;
    }
}

/*
Funkcija za crtanje svih elemenata igre.
 */
function draw() {
    if (gameOver) return; // provjeri jeli igra gotova
    // provjeri jeli igrac pobijedio
    if (score === brickRowCount * brickColumnCount) {
        winSound.play().then(() => {
            setTimeout(() => {
                loseSound.pause();
            }, 2000);
        });
        endGameWithMessage("WINNER");
    }
    // nacrtaj pozadinu
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    // nacrtaj sve elemente igre i obavi sve kalkulacije
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    brickCollisionDetection();
    edgeCollisionDetection();
    paddleCollisionDetection();
    movePaddle();
    requestAnimationFrame(draw);
}

// pokretanje igre
draw();
