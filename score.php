<?php
// Tiny API: GET returns the best score, POST {"score": 123} saves it if it is a new best.
header('Content-Type: application/json');

$file = __DIR__ . '/../data/score.json';

function read_best($file) {
    if (!is_file($file)) return 0;
    $j = json_decode(file_get_contents($file), true);
    return isset($j['best']) ? (int)$j['best'] : 0;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $score = isset($input['score']) ? (int)$input['score'] : 0;
    $best  = read_best($file);

    if ($score > $best) {
        $best = $score;
        file_put_contents($file, json_encode(['best' => $best]), LOCK_EX);
    }
    echo json_encode(['best' => $best]);
    exit;
}

echo json_encode(['best' => read_best($file)]);
