<?php
// Read the saved best score on the server so the page loads with it already filled in.
$file = __DIR__ . 'score.json';
$best = 0;
if (is_file($file)) {
    $json = json_decode(file_get_contents($file), true);
    $best = isset($json['best']) ? (int)$json['best'] : 0;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Block Blast</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <main class="wrap">
    <h1>BYTEBLAST 6-1</h1>

    <div class="scores">
      <div class="box"><span>Score</span><strong id="score">0</strong></div>
      <div class="box"><span>Best</span><strong id="best"><?= $best ?></strong></div>
    </div>

    <div id="board" class="board"></div>
    <div id="tray" class="tray"></div>

    <button id="restart" class="btn">New Game</button>
    <p class="hint">Drag a block onto the grid. Fill a full row or column to clear it.</p>
    <p class="hint">SIXBYTES GROUP ACTIVITY  </p>

    <div id="overlay" class="overlay hidden">
      <div class="modal">
        <h2>Game Over</h2>
        <p>Your score: <strong id="finalScore">0</strong></p>
        <button id="again" class="btn">Play Again</button>
      </div>
    </div>
  </main>

  <script>window.BEST_SCORE = <?= $best ?>;</script>
  <script src="assets/game.js"></script>
</body>
</html>
