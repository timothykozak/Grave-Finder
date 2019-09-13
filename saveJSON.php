<?php
// Accepts the JSON and saves it as cemeteries.txt.

    $file_name = ".\assets\cemeteries.txt";
    $content = file_get_contents("php://input");    //Receive the RAW post data.
    file_put_contents($file_name, $content);

?>