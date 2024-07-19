#!/bin/bash

truncate -s 0 blank.txt

STREAM_NUM=$1
OUT_NUM=$2

for ((i = 1; i <= STREAM_NUM; i++)); do
	for ((j = 1; j <= OUT_NUM; j++)); do
		output="__stream${i}__out${j}__"
		echo $output >>blank.txt
	done
	echo "" >>blank.txt
done
