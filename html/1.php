<?php

if (isset($_GET['1dest1on'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh out1 source');
echo $output;
}

if (isset($_GET['1dest2on'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh out2 source');
echo $output;
}

if (isset($_GET['1dest3on'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh out3 source');
echo $output;
}

if (isset($_GET['1dest1off'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh out1 off');
echo $output;
}

if (isset($_GET['1dest2off'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh out2 off');
echo $output;
}

if (isset($_GET['1dest3off'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh out3 off');
echo $output;
}
####END OF DESTINATIONS START INPUTS#####

if (isset($_GET['1main'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh main');
echo $output;
}

if (isset($_GET['1back'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh back');
echo $output;
}

if (isset($_GET['1holding'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh holding');
echo $output;
}

if (isset($_GET['1video'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh video');
echo $output;
}

if (isset($_GET['1off'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh off');
echo $output;
}

####END OF INPUTS START MODS#####

if (isset($_GET['1vol'])) {
$vol = $_POST[1vol_level'];
$vol_level = 2*$vol;
$output = exec("sudo /bin/bash /usr/local/nginx/scripts/1on.sh volume $vol_level");
echo "$output";
}

/*if (isset($_GET['1vol1'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh volume 2');
echo $output;
}

if (isset($_GET['1vol2'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh volume 4');
echo $output;
}
*/
if (isset($_GET['1superon'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh super on');
echo $output;
}

if (isset($_GET['1superoff'])) {
$output = exec('sudo /bin/bash /usr/local/nginx/scripts/1on.sh super off');
echo $output;
}

?>

