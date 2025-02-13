#!/bin/bash

source scripts/set-env.sh

if [[ -z ${STREAM_NUM+x} ]]; then
	echo "Error: STREAM_NUM is not defined. Please switch to BASH if you're using ZSH."
	exit 1
fi

# Production files folder
cd /usr/local/nginx/

# Keep configs
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
