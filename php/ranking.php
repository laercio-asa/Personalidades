<?php
header('Content-Type: application/json');

$tempo = $_POST["tempo"] ?? 0;
$personalidade = $_POST["personalidade"] ?? 0;
$cartas = $_POST["cartas"] ?? 0;
$nome = $_POST["nome"] ?? '';


if ($tempo > 0) {

    $servername = "feira_preta.mysql.dbaas.com.br";
    $username   = "feira_preta";
    $password   = "s3na@cPRETA25";
    $dbname     = "feira_preta";

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        die();
    }

    $ip_do_usuario = get_ip_address();
    $user_agent_string = $_SERVER['HTTP_USER_AGENT'];

    $stmt = $conn->prepare("INSERT INTO ranking (tempo, personalidade, cartas, nome, ip, browser) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("iiisss", $tempo, $personalidade, $cartas, $nome, $ip_do_usuario, $user_agent_string);

    $stmt->execute();

    // Fechar
    $stmt->close();
    $conn->close();
}


function get_ip_address()
{
    $ip_address = '';

    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        // Verifica se o IP está em um cabeçalho de proxy
        $ip_address = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // Verifica se o IP está no cabeçalho X-Forwarded-For (pode conter múltiplos IPs)
        $ip_address = $_SERVER['HTTP_X_FORWARDED_FOR'];
        // Pega apenas o primeiro IP, que geralmente é o do cliente original
        $ip_address = explode(',', $ip_address)[0];
    } else {
        // Caso fallback: usa o IP da conexão direta com o servidor
        $ip_address = $_SERVER['REMOTE_ADDR'];
    }

    // Opcional: validar e sanear o IP, pois cabeçalhos HTTP podem ser forjados
    // (A validação de IP é recomendada se você for armazenar os dados para segurança)
    if (filter_var($ip_address, FILTER_VALIDATE_IP)) {
        return $ip_address;
    } else {
        return "IP inválido ou não detectado";
    }
}


$data = [
    'message' => 'Dados recebidos com sucesso!',
    'status' => 'success',
    'items' => [
        ['id' => 1, 'name' => 'Item A'],
        ['id' => 2, 'name' => 'Item B']
    ]
];

echo json_encode($data);