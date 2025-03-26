#!/bin/bash
# Deletes NGINX logs on restart to conserve space
sudo rm /usr/local/nginx/logs/*.log

# Resets any lowerthirds applied previously to blank images
sudo cp /usr/local/nginx/scripts/images/lowerthird/*lowerthird.png /usr/local/nginx/scripts/images

# Replaces page titles in webpages to name of instance
sudo sed -i "s|<title>.*</title>|<title>$(hostname) Stats</title>|" /usr/local/nginx/html/stat.xsl

# Restart NGINX
sudo /usr/local/nginx/sbin/nginx -s stop
sudo /usr/local/nginx/sbin/nginx
