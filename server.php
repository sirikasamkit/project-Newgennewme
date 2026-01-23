<?php

    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "register_ngnm";

    $con = mysqli_connect($servername, $username, $password, $dbname);

    if (!$con) {
        die("Connectio failed" . mysqli_connect_error());
    } else {
        echo "Connected successfully";
    }

?>