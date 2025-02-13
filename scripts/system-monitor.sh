#!/bin/bash

# Get CPU usage using uptime
CPU_USAGE=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | awk '{print $1}')

# Get RAM usage
RAM_INFO=$(free -h | awk '/Mem:/ {print $3 " / " $2}')

# Get disk usage
DISK_USAGE=$(df -h --output=used,size / | awk 'NR==2 {print $1 " / " $2}')

# Get network traffic
INTERFACE=$(ip route | grep default | awk '{print $5}')
RX_BYTES_BEFORE=$(cat /sys/class/net/$INTERFACE/statistics/rx_bytes)
TX_BYTES_BEFORE=$(cat /sys/class/net/$INTERFACE/statistics/tx_bytes)
sleep 1
RX_BYTES_AFTER=$(cat /sys/class/net/$INTERFACE/statistics/rx_bytes)
TX_BYTES_AFTER=$(cat /sys/class/net/$INTERFACE/statistics/tx_bytes)

RX_RATE=$(((RX_BYTES_AFTER - RX_BYTES_BEFORE) / 1024))
TX_RATE=$(((TX_BYTES_AFTER - TX_BYTES_BEFORE) / 1024))

# Output the results
echo "{"
echo "  \"cpu\": \"$CPU_USAGE\","
echo "  \"ram\": \"$RAM_INFO\","
echo "  \"disk\": \"$DISK_USAGE\","
echo "  \"downlink\": \"$RX_RATE KB/s\","
echo "  \"uplink\": \"$TX_RATE KB/s\""
echo "}"
