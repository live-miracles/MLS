#!/bin/bash

source scripts/set-env.sh

# Production files folder
cd /usr/local/nginx/

# Keep configs
cp ./html/stream-names.csv ~/MLS/html/
cp ./scripts/config.txt ~/MLS/scripts/

# Shift files to right locations
sudo chgrp -R www-data ~/MLS
sudo chmod g+rw -R ~/MLS
sudo cp -R ~/MLS/html .
sudo cp scripts/nginx.conf ./conf/
sudo cp -R ~/MLS/scripts .
sudo chmod +x -R ./scripts

for ((i = 2; i <= STREAM_NUM; i++)); do
	sudo cp ./scripts/1.sh ./scripts/${i}.sh
done

sudo ./scripts/nginxrestart.sh
