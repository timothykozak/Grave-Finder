<?php
// Accepts the JSON and saves it as cemeteries.txt.
// Does some basic validation and returns a result.

function last_error_message() {
    $last_err = error_get_last();
    return($last_err['message']);
}

$message = "";
$success = 'false';
$file_name = "./assets/cemeteries.txt";
$content = trim(file_get_contents("php://input"));    //Receive the RAW post data.

if (error_get_last()) {
    $message = "Could not access content: " . last_error_message();
} else {
    $decoded = json_decode($content, true);
    if (is_array($decoded)) {
        $file_size = file_put_contents($file_name, $content);    // Update contents.  Create file if necessary
        if ($file_size) {
            $success = true;
            $message = "File saved.";
        } else {
            $message = "Could not save: " . last_error_message();
        }
    } else {
        $message = "Invalid JSON: " . last_error_message();
    }
}
echo '{ "success": ' . $success . ', "message": "' . $message . '" }';
?>