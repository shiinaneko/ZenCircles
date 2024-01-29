const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let lastX = 0;
let lastY = 0;

let lastTime = 0;
let lastMouseX = null;
let lastMouseY = null;

function getBrushSize(x, y, time) {
    if (lastTime && lastMouseX !== null && lastMouseY !== null) {
        const distance = Math.sqrt(Math.pow(x - lastMouseX, 2) + Math.pow(y - lastMouseY, 2));
        const timeDiff = time - lastTime;
        return Math.min(10, Math.max(1, 10 - (distance / timeDiff)));
    }
    return 5; // デフォルトのブラシサイズ
}

function getTouchPos(canvas, touchEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top
    };
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = getTouchPos(canvas, e);
    [lastX, lastY] = [touch.x, touch.y];
    isDrawing = true;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = getTouchPos(canvas, e);
    drawLine(touch.x, touch.y);
});

canvas.addEventListener('touchend', () => {
    isDrawing = false;
});

function drawLine(x, y) {
    const brushSize = getBrushSize(e.offsetX, e.offsetY, e.timeStamp);
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

// 既存のマウスイベントの処理を drawLine を使用するように変更
canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const brushSize = getBrushSize(e.offsetX, e.offsetY, e.timeStamp);
    ctx.lineWidth = brushSize;
    // ...既存の描画ロジック...
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

// canvas.addEventListener('mousemove', (e) => {
//     if (!isDrawing) return;
//     const brushSize = getBrushSize(e.offsetX, e.offsetY, e.timeStamp);
//     ctx.lineWidth = brushSize;
//     // ...既存の描画ロジック...
//     if (!isDrawing) return;
//     ctx.beginPath();
//     ctx.moveTo(lastX, lastY);
//     ctx.lineTo(e.offsetX, e.offsetY);
//     ctx.stroke();
//     [lastX, lastY] = [e.offsetX, e.offsetY];
// });

canvas.addEventListener('mousedown', (e) => {
    // ...既存のmousedownロジック...
    lastTime = e.timeStamp;
    lastMouseX = e.offsetX;
    lastMouseY = e.offsetY;

    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener('mouseup', () => {
    lastTime = 0;
    lastMouseX = null;
    lastMouseY = null;
    // ...既存のmouseupロジック...
    isDrawing = false;
});

// New Roundボタンの処理を更新
document.getElementById('newRoundButton').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // キャンバスをクリア
    drawnPoints = []; // 描画された点のデータをリセット
    // document.getElementById('scoreDisplay').innerText = `Score: 0`; // スコア表示をリセット
});

// 手書きの色を黒に設定
canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    ctx.strokeStyle = 'black'; // 描画色を黒に設定
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
    drawnPoints.push([e.offsetX, e.offsetY]);
});

// TODO: Implement the scoring logic and display the score
let drawnPoints = [];

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    drawnPoints = [[lastX, lastY]]; // Start capturing the new path
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    const score = calculateScore(); // スコア計算
    // document.getElementById('scoreDisplay').innerText = `Score: ${score}`;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    // ... existing drawing code ...
    drawnPoints.push([e.offsetX, e.offsetY]);
});

document.getElementById('newRoundButton').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const score = calculateScore();
    // document.getElementById('scoreDisplay').innerText = `Score: ${score}`;
    drawnPoints = [];
});

function calculateCircleCenterAndRadius(points) {
    // 最小二乗法による円の中心と半径の計算
    let A = [];
    let B = [];
    points.forEach(point => {
        A.push([2 * point[0], 2 * point[1], 1]);
        B.push(Math.pow(point[0], 2) + Math.pow(point[1], 2));
    });

    const A_matrix = math.matrix(A);
    const B_matrix = math.matrix(B);
    const AT = math.transpose(A_matrix);

    const ATA = math.multiply(AT, A_matrix);
    const ATB = math.multiply(AT, B_matrix);
    const X = math.lusolve(ATA, ATB);

    const a = X.subset(math.index(0, 0));
    const b = X.subset(math.index(1, 0));
    const c = X.subset(math.index(2, 0));
    const r = Math.sqrt(a * a + b * b + c);

    return { center: { x: a, y: b }, radius: r };
}

function drawCircle(center, radius, color, alpha = 1) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2, false);
    ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
    ctx.stroke();
}

function calculateScore() {
    if (drawnPoints.length < 20) { // 最小点数を設定
        return '0%'; // 点数が少なすぎる場合は0%
    }

    const { center, radius } = calculateCircleCenterAndRadius(drawnPoints);
    let deviationSum = 0;
    drawnPoints.forEach(point => {
        const distanceToCenter = Math.sqrt((point[0] - center.x) ** 2 + (point[1] - center.y) ** 2);
        deviationSum += Math.abs(distanceToCenter - radius);
    });
    const averageDeviation = deviationSum / drawnPoints.length;

    // 一定の閾値を設定して、それを基にパーセンテージスコアを計算
    const threshold = 10; // 適宜調整が必要
    const score = Math.max(0, 100 - (averageDeviation / threshold) * 100);

    // 理想的な円の描画時に半透明の赤色を使用
    drawCircle(center, radius, [255, 0, 0], 0.5);

    // 理想的な円の中心にスコアを表示
    ctx.font = '20px Arial';
    ctx.fillStyle = 'blue';
    ctx.textAlign = 'center';
    ctx.fillText(`${score.toFixed(2)}%`, center.x, center.y);

    createDownloadButton();
    
    return score.toFixed(2) + '%'; // パーセンテージ表示
}

function getCanvasImageData() {
    // 一時的なCanvasを作成
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // 一時的なCanvasに白い背景を設定
    tempCtx.fillStyle = '#FFFFFF'; // 白色
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 元のCanvasの内容を一時的なCanvasにコピー
    tempCtx.drawImage(canvas, 0, 0);

    // 一時的なCanvasの内容を画像データとして取得
    return tempCanvas.toDataURL('image/png');
}

function createDownloadButton() {
    const image = getCanvasImageData();
    let button = document.getElementById('downloadButton');

    if (!button) {
        button = document.createElement('a');
        button.id = 'downloadButton';
        button.textContent = 'Download Image';
        // "button-container"内にボタンを追加
        document.querySelector('.button-container').appendChild(button);
    }

    button.href = image;
    button.download = 'circle-drawing.png';
}



// drawCircle(center, radius, 'red'); // 理想的な円を描画