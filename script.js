const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let lastTime = 0;
let lastMouseX = null;
let lastMouseY = null;
let drawnPoints = [];

// キャンバスのサイズを調整
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetWidth;
    redrawCanvas();
}

// 既存の描画内容を再描画（必要に応じて）
function redrawCanvas() {
    // 再描画する内容があればここに実装
}

// イベントの座標を取得
function getEventPosition(event) {
    if (event.touches) {
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    } else {
        return { x: event.offsetX, y: event.offsetY };
    }
}

// 描画開始の処理
function handleStart(event) {
    event.preventDefault();
    const { x, y } = getEventPosition(event);
    lastX = x;
    lastY = y;
    lastTime = event.timeStamp;
    lastMouseX = x;
    lastMouseY = y;
    isDrawing = true;
    drawnPoints = [[x, y]];
}

// 描画中の処理
function handleMove(event) {
    event.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getEventPosition(event);
    const brushSize = getBrushSize(x, y, event.timeStamp);
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
    lastMouseX = x;
    lastMouseY = y;
    lastTime = event.timeStamp;
    drawnPoints.push([x, y]);
}

// 描画終了の処理
function handleEnd(event) {
    event.preventDefault();
    isDrawing = false;
    const score = calculateScore();
    lastTime = 0;
    lastMouseX = null;
    lastMouseY = null;
}

// 描画時のブラシサイズを計算
function getBrushSize(x, y, time) {
    if (lastTime && lastMouseX !== null && lastMouseY !== null) {
        const distance = Math.sqrt(Math.pow(x - lastMouseX, 2) + Math.pow(y - lastMouseY, 2));
        const timeDiff = time - lastTime;
        return Math.min(10, Math.max(1, 10 - (distance / timeDiff)));
    }
    return 5; // デフォルトのブラシサイズ
}

// イベントリスナーの設定
function setupEventListeners() {
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd, { passive: false });
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    window.addEventListener('resize', resizeCanvas);
}

// スコア計算
function calculateScore() {
    const { center, radius } = calculateCircleCenterAndRadius(drawnPoints);
    
    ctx.font = '50px Arial';
    ctx.fillStyle = 'blue';
    ctx.textAlign = 'center';

    // 線がある程度円に近い形状であるかを判定する処理
    if (!isDrawingCircular(drawnPoints)) {
        drawLargeX(center);
        ctx.fillText("😭", center.x, center.y - 50);
        return;
    }
    
    // 線の長さをチェック
    if (calculateLineLength(drawnPoints) < 650) { 
        drawLargeX(center);
        ctx.fillText("😨", center.x, center.y - 50);
        return;
    }

    // ...スコア計算ロジック...
    let deviationSum = 0;
    drawnPoints.forEach(point => {
        const distanceToCenter = Math.sqrt((point[0] - center.x) ** 2 + (point[1] - center.y) ** 2);
        deviationSum += Math.abs(distanceToCenter - radius);
    });
    const averageDeviation = deviationSum / drawnPoints.length;

    // 一定の閾値を設定して、それを基にパーセンテージスコアを計算
    const threshold = 10; // 適宜調整が必要
    const score = Math.max(0, 100 - (averageDeviation / threshold) * 100);

    // 理想的な円の中心にスコアを表示
    if (radius > 0 && radius < 50) {
        drawLargeX(center);
        ctx.fillText("😟", center.x, center.y - 50);
    } else if (radius >= 50 && radius < 100) {
        drawLargeX(center);
        ctx.fillText("🥺", center.x, center.y);
    } else {
        // 理想的な円の描画時に半透明の赤色を使用
        drawCircle(center, radius, [255, 0, 0], 0.3);
        ctx.font = '25px Arial';
        ctx.fillText(`${score.toFixed(2)}%`, center.x, center.y);    
    }

    return score.toFixed(2) + '%'; // パーセンテージ表示
}

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

// 初期設定
resizeCanvas();
setupEventListeners();

// New Roundボタンの処理
document.getElementById('newRoundButton').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawnPoints = [];
    // スコア表示をリセットする場合はここに実装
});

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

// 2つのベクトル間の角度を計算する関数（調整版）
function calculateAngle(p1, p2, p3) {
    const v1 = { x: p1[0] - p2[0], y: p1[1] - p2[1] };
    const v2 = { x: p3[0] - p2[0], y: p3[1] - p2[1] };
    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const magnitudeV1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const magnitudeV2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    // ベクトルの大きさが非常に小さい場合は、角度を0として扱う
    if (magnitudeV1 < 0.01 || magnitudeV2 < 0.01) {
        return 0;
    }
    
    const angle = Math.acos(dotProduct / (magnitudeV1 * magnitudeV2));
    return angle * (180 / Math.PI); // ラジアンから度数へ変換
}

// 分散を計算する関数（NaNを回避）
function calculateVariance(values) {
    if (values.length <= 1) return 0; // 要素が1つ以下の場合は分散を0とする
    
    const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
}

// 円に近いかの判定を緩和する
function isDrawingCircular(points) {
    if (points.length < 3) return false; // 少なくとも3点は必要

    let angles = [];
    for (let i = 1; i < points.length - 1; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const p3 = points[i + 1];
        const angle = calculateAngle(p1, p2, p3);
        if (angle > 0) angles.push(angle); // 0より大きい角度のみを考慮
    }

    // 角度の分散が非常に小さい（直線に近い）または大きい（不規則な形状）場合にフィルタリング
    const variance = calculateVariance(angles);
    return variance > 5 && variance < 100; // 分散の閾値を調整
}

function drawLargeX(center) {
    const xStart = center.x - (canvas.width / 4);
    const yStart = center.y - (canvas.height / 4);
    const xEnd = center.x  + (canvas.width / 4);
    const yEnd = center.y + (canvas.height / 4) ;
    ctx.strokeStyle = "rgba(255, 0, 0, 0.1)";

    ctx.beginPath();
    // ctx.strokeStyle = 'red'; // ✗の色を赤に設定
    ctx.lineWidth = 15; // 線の太さ

    // 左上から右下への線
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);

    // 右上から左下への線
    ctx.moveTo(xEnd, yStart);
    ctx.lineTo(xStart, yEnd);
    ctx.stroke();
}

function calculateLineLength(drawnPoints) {
    let totalLength = 0;
    for (let i = 0; i < drawnPoints.length - 1; i++) {
        const p1 = drawnPoints[i];
        const p2 = drawnPoints[i + 1];
        const distance = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
        totalLength += distance;
    }
    return totalLength;
}

function tweetScore(score) {
    const tweetText = `I scored ${score} on the ZenCircles! Can you beat me? #ZenCircles`;
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterIntentUrl, '_blank'); // 新しいタブでTwitterの投稿画面を開く
}

// ボタンクリックイベントを設定
document.getElementById('tweetScoreButton').addEventListener('click', () => {
    const score = calculateScore(); // ここでスコアを計算するか、既に計算されたスコアを使用
    tweetScore(score);
});
