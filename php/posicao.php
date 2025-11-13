<?php

$servername = "feira_preta.mysql.dbaas.com.br";
$username   = "feira_preta";
$password   = "s3na@cPRETA25@#";
$dbname     = "feira_preta";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die();
}

$sql = "SELECT nome, tentativas, data
        FROM ranking
        ORDER BY tentativas desc, DATA desc";

echo("xxxx");

