#!/bin/bash

STREAM_NUM=25

case $1 in
# ===== Name Config =====
nameconfig)
	sudo sed -i "s|stream__name__.*|stream__name__ $2|" /usr/local/nginx/scripts/config.txt
	;;

# ===== Add Destination =====
destination)
	sudo sed -i "s|stream$3__out$4__.*|stream$3__out$4__ $(echo $2 | sed -e 's/\\/\\\\/g; s/\//\\\//g; s/&/\\\&/g') $5 $6|" /usr/local/nginx/scripts/config.txt
	;;

# ===== Stream Config =====
streamconfig)
	sudo sed -i "s|stream$2__config__.*|stream$2__config__ $3 $4 $5|" /usr/local/nginx/scripts/config.txt
	;;

# ===== Scheduling =====
addschedule)
	case $4 in
	on)
		case $3 in
		holding)
			(
				sudo crontab -l
				echo "$7 $8 $9 ${10} * sudo /bin/bash /usr/local/nginx/scripts/$2.sh on && sudo /bin/bash /usr/local/nginx/scripts/$2.sh $3 $6  # $5"
			) 2>/dev/null | sort -u | sudo crontab -
			;;
		video)
			(
				sudo crontab -l
				echo "$7 $8 $9 ${10} * sudo /bin/bash /usr/local/nginx/scripts/$2.sh on && sudo /bin/bash /usr/local/nginx/scripts/$2.sh $3 $6  # $5"
			) 2>/dev/null | sort -u | sudo crontab -
			;;
		*)
			(
				sudo crontab -l
				echo "$7 $8 $9 ${10} * sudo /bin/bash /usr/local/nginx/scripts/$2.sh $3  # $5"
			) 2>/dev/null | sort -u | sudo crontab -
			;;
		esac
		;;

	off)
		case $3 in
		holding)
			(
				sudo crontab -l
				echo "$7 $8 $9 ${10} * sudo /bin/bash /usr/local/nginx/scripts/$2.sh off  # $5"
			) 2>/dev/null | sort -u | sudo crontab -
			;;
		video)
			(
				sudo crontab -l
				echo "$7 $8 $9 ${10} * sudo /bin/bash /usr/local/nginx/scripts/$2.sh off  # $5"
			) 2>/dev/null | sort -u | sudo crontab -
			;;
		*)
			(
				sudo crontab -l
				echo "$7 $8 $9 ${10} * sudo /bin/bash /usr/local/nginx/scripts/$2.sh $3 off  # $5"
			) 2>/dev/null | sort -u | sudo crontab -
			;;
		esac
		;;
	esac
	;;

removeschedule)
	(sudo crontab -l | grep -v "  # $5\$") 2>/dev/null | sort -u | sudo crontab -
	;;

schedulelist)
	sudo crontab -l | sort
	;;

##### AUDIO CONFIG ##########

audioconfig)
	stream_id=$2
	audio_type=$3
	remap_id=$4
	ch1=$5
	ch2=$6
	dest=$7
	sudo sed -i "s|stream${stream_id}__audio__.*|stream${stream_id}__audio__ $remap_id $ch1 $ch2 $audio_type $dest|" /usr/local/nginx/scripts/config.txt

	;;

##### AUDIO PRESET ##########

audiopreset)
	preset=$2
	dest=$3
	case $preset in
	all_mono)
		for ((i = 1; i <= 16; i++)); do
			input_channel=$((i - 1))
			sudo sed -i "s|stream${i}__audio__.*|stream${i}__audio__ remap1 c$input_channel c0 mono $dest|" /usr/local/nginx/scripts/config.txt
		done

		for ((i = 17; i <= STREAM_NUM; i++)); do
			input_channel=$((i - 17))
			sudo sed -i "s|stream${i}__audio__.*|stream${i}__audio__ remap2 c$input_channel c0 mono $dest|" /usr/local/nginx/scripts/config.txt
		done
		;;

	one_stereo)
		sudo sed -i "s|stream1__audio__.*|stream1__audio__ remap1 c0 c1 stereo $dest|" /usr/local/nginx/scripts/config.txt
		for ((i = 2; i <= 15; i++)); do
			input_channel=$i
			sudo sed -i "s|stream${i}__audio__.*|stream${i}__audio__ remap1 c$input_channel c0 mono $dest|" /usr/local/nginx/scripts/config.txt
		done

		for ((i = 16; i <= STREAM_NUM; i++)); do
			input_channel=$((i - 16))
			sudo sed -i "s|stream${i}__audio__.*|stream${i}__audio__ remap2 c$input_channel c0 mono $dest|" /usr/local/nginx/scripts/config.txt
		done
		;;

	two_stereo)
		sudo sed -i "s|stream1__audio__.*|stream1__audio__ remap1 c0 c1 stereo $dest|" /usr/local/nginx/scripts/config.txt
		sudo sed -i "s|stream2__audio__.*|stream2__audio__ remap1 c2 c3 stereo $dest|" /usr/local/nginx/scripts/config.txt
		for ((i = 3; i <= 14; i++)); do
			input_channel=$((i + 1))
			sudo sed -i "s|stream${i}__audio__.*|stream${i}__audio__ remap1 c$input_channel c0 mono $dest|" /usr/local/nginx/scripts/config.txt
		done

		for ((i = 15; i <= STREAM_NUM; i++)); do
			input_channel=$((i - 15))
			sudo sed -i "s|stream${i}__audio__.*|stream${i}__audio__ remap2 c$input_channel c0 mono $dest|" /usr/local/nginx/scripts/config.txt
		done
		;;

	esac
	;;

##### UPLOAD FILE ##########

uploadfile)
	sudo wget -O $3$4 $2 && sudo chmod +x $3$4 && sudo mv $3$4 /usr/local/nginx/scripts/images
	;;

##### UPLOAD LOWERTHIRD ##########

uploadlower)
	sudo mv $2 $3
	sudo chmod 755 $3
	sudo chown root:root $3
	echo $3 uploaded
	;;

##### END UPLOAD LOWERTHIRD - START STREAM LIST ##########

streamlist)
	startline=$(grep -n '***STREAM CONFIG***' /usr/local/nginx/scripts/config.txt | cut -d: -f 1)
	endline=$(grep -n '***AUDIO CONFIG***' /usr/local/nginx/scripts/config.txt | cut -d: -f 1)
	rangeoflines=$startline','$endline'p'
	sed -n $rangeoflines /usr/local/nginx/scripts/config.txt

	;;

##### END STREAM LIST - START DESTINATION LIST ##########
destlist)
	startline=$(grep -n '***DESTINATION CONFIG***' /usr/local/nginx/scripts/config.txt | cut -d: -f 1)
	endline=$(grep -n '***STREAM CONFIG***' /usr/local/nginx/scripts/config.txt | cut -d: -f 1)
	rangeoflines=$startline','$endline'p'
	sed -n $rangeoflines /usr/local/nginx/scripts/config.txt | grep -v "rtmp://unconfigured.blk source" | grep -v "instagram.*YourKey source" | grep -v "rtmp://localhost/recording/stream[0-9].* source"

	;;

##### END DESTINATION LIST - START AUDIO LIST ##########
audiolist)
	startline=$(grep -n '***AUDIO CONFIG***' /usr/local/nginx/scripts/config.txt | cut -d: -f 1)
	endline=$(grep -n '***NAME CONFIG***' /usr/local/nginx/scripts/config.txt | cut -d: -f 1)
	rangeoflines=$startline','$endline'p'
	sed -n $rangeoflines /usr/local/nginx/scripts/config.txt

	;;

##### END AUDIO LIST - START CONVERT RECORDING ##########
convertrecording)
	#mv --backup=numbered $3/$4.mp4 $3/$4_`date +%Y%m%d-%H_%M_%S`.mp4;
	mv --backup=numbered $3/$4.mp4 $3/$4_old.mp4
	ffmpeg -y -i $2 -c copy $3/$4.mp4
	rm -f $2
	echo "Recording Converted"

	;;

##### END CONVERT RECORDING - START SRT ACCEPT ##########

srtaccept)
	LCK="/usr/local/nginx/scripts/tmp/srtaccept.LCK"

	exec 8>$LCK

	if flock -n -x 8; then

		if [ -z "$STY" ]; then
			echo "Turning $2 SRT Accept"
			exec screen -dm -S srtaccept /bin/bash "$0" "$1" "$2"
		fi

		case $2 in
		off)
			echo "SRT Accept is already off"
			exit 0
			;;

		*)
			while true; do
				/usr/local/nginx/scripts/srt/build/srt-live-transmit "srt://:9000" "file://con" | /usr/bin/ffmpeg -re -i pipe:0 -map 0:0 -map 0:1 -vcodec libx264 -preset veryfast -profile:v high -acodec aac -f flv -strict -2 rtmp://127.0.0.1/main/stream1080
				echo "Restarting SRT Accept..."
				sleep .2
			done
			;;
		esac
	#~/ffmpeg_sources/srt/build/srt-live-transmit "srt://:9000" "file://con" | /usr/bin/ffmpeg -re -i pipe:0 -map 0:0 -map 0:1 -vcodec libx264 -preset veryfast -level high -acodec aac -f flv -strict -2 rtmp://127.0.0.1/input/stream1 -map 0:0 -map 0:2 -vcodec copy -acodec aac -f flv -strict -2 rtmp://127.0.0.1/input/stream2 -map 0:0 -map 0:3 -vcodec copy -acodec aac -f flv -strict -2 rtmp://127.0.0.1/input/stream3;

	else
		case $2 in
		off)
			kill $(ps aux | grep "[S]CREEN.* srtaccept" | awk '{print $2}')
			echo "Turning off SRT Accept"
			;;

		*)
			echo "SRT Accept is already on"
			;;
		esac
	fi

	;;

##### END SRT ACCEPT - START SRT SEND ##########

srtsend)
	if [ -z "$STY" ]; then
		exec screen -dm -S srtsend /bin/bash "$0" "$1"
	fi
	/usr/local/bin/ffmpeg -re -fflags +genpts -stream_loop -1 -i /usr/local/nginx/scripts/images/8video.mp4 -map 0:0 -map 0:1 -map 0:2 -map 0:3 -vcodec copy -acodec copy -f mpegts - | ~/ffmpeg_sources/srt/build/srt-live-transmit -v "file://con" "srt://139.59.46.142:9000"

	;;

##### END SRT SEND - START REMAP ##########
remap)

	remap_id=$2
	dest=$3
	ch_num=$4
	remap_type=$5
	onoff=$6
	LCK="/usr/local/nginx/scripts/tmp/$remap_id$dest.LCK"

	exec 8>$LCK

	if flock -n -x 8; then
		if [ -z "$STY" ]; then
			if [ $onoff == "on" ]; then
				echo "Remapping $ch_num audio channels of the $remap_id $dest stream"
				exec screen -dm -S $remap_id$dest /bin/bash "$0" "$1" "$2" "$3" "$4" "$5" "$6"
			else
				echo "Remapping of the $remap_id $dest stream is already off"
				exec bash
			fi
		fi

		ch_cnt=$ch_num
		j=1
		for ((i = 0; i < $ch_cnt; i++)); do
			for (( ; j <= $STREAM_NUM; j++)); do
				mapping=$(cat /usr/local/nginx/scripts/config.txt | grep '__stream'$j'__audio__' | cut -d ' ' -f 5)
				stream_remap_id=$(cat /usr/local/nginx/scripts/config.txt | grep '__stream'$j'__audio__' | cut -d ' ' -f 2)
				if [ "$mapping" != "none" ] && [ "$remap_id" == "$stream_remap_id" ]; then
					break
				fi
			done

			if ((j > $STREAM_NUM)); then
				break
			fi

			c0=$(cat /usr/local/nginx/scripts/config.txt | grep '__stream'$j'__audio__' | cut -d ' ' -f 3)
			c1=$(cat /usr/local/nginx/scripts/config.txt | grep '__stream'$j'__audio__' | cut -d ' ' -f 4)
			rtmpapp=$(cat /usr/local/nginx/scripts/config.txt | grep '__stream'$j'__audio__' | cut -d ' ' -f 6)

			if [ $rtmpapp == "main_back" ]; then
				rtmpapp=$dest
			fi

			#Fix for OBS-ffmpeg remap diff
			#To generate multi-channel files with ffmpeg for OBS use, upto 5.0 is safe. Beyond that there are mapping issues
			#OBS-ffmpeg mapping match for 3,4,5,9,10,11,12,13,14. 6 seems to have lfe issue on channel 4 in OBS
			#7,8 and 16 need to be remapped as below
			#7 -- 1-2,2-3,3-1,4-6,5-7,6-4,7-5
			#8 -- 1-2,2-3,3-1,4-6,5-7,6-8,7-4,8-5
			#16 -- 1-3,2-4,3-15,4-16,5-1,6-2,7-7,8-8,9-5,10-6,11-9,12-10,13-11,14-12,15-13,16-14
			if [ $remap_type == "obs" ]; then
				declare -A map7=(["c0"]="c2" ["c1"]="c0" ["c2"]="c1" ["c3"]="c5" ["c4"]="c6" ["c5"]="c3" ["c6"]="c4")
				declare -A map8=(["c0"]="c2" ["c1"]="c0" ["c2"]="c1" ["c3"]="c6" ["c4"]="c7" ["c5"]="c3" ["c6"]="c4" ["c7"]="c5")
				declare -A map16=(["c0"]="c4" ["c1"]="c5" ["c2"]="c0" ["c3"]="c1" ["c4"]="c8" ["c5"]="c9" ["c6"]="c6" ["c7"]="c7" ["c8"]="c10" ["c9"]="c11" ["c10"]="c12" ["c11"]="c13" ["c12"]="c14" ["c13"]="c15" ["c14"]="c2" ["c15"]="c3")

				case $ch_num in
				7)
					c0=${map7[$c0]}
					c1=${map7[$c1]}
					;;

				8)
					c0=${map8[$c0]}
					c1=${map8[$c1]}
					;;

				16)
					c0=${map16[$c0]}
					c1=${map16[$c1]}
					;;
				esac
			fi

			if [[ $mapping = "mono" ]]; then
				map[i]="[0:a]pan=mono|c0=$c0,aresample=async=1000[a$i]"
				stream[i + 1]="-map 0:v -map [a$i] -vcodec copy -acodec aac -ab 128k -f flv -strict -2 rtmp://127.0.0.1/$rtmpapp/stream$j"
			else
				map[i]="[0:a]pan=stereo|c0=$c0|c1=$c1,aresample=async=1000[a$i]"
				stream[i + 1]="-map 0:v -map [a$i] -vcodec copy -acodec aac -ac 2 -ab 256k -f flv -strict -2 rtmp://127.0.0.1/$rtmpapp/stream$j"
				((ch_cnt = ch_cnt - 1))
			fi
			((j = j + 1))
		done

		if ((ch_num >= 1 && ch_num <= 16)); then
			while true; do
				filter_complex=""
				output_streams=""

				for ((k = 0; k < ch_num; k++)); do
					filter_complex+="${map[k]};"
					output_streams+=" ${stream[k + 1]}"
				done

				# Remove the trailing semicolon from filter_complex
				filter_complex=${filter_complex%;}

				/usr/bin/ffmpeg -re -i rtmp://127.0.0.1/$dest/$remap_id -filter_complex "$filter_complex" $output_streams
				echo "Restarting remapping..."
				sleep .2
			done
		else
			echo "Invalid number of channels."
		fi
	else
		if [ $onoff == "on" ]; then
			echo "The $remap_id $dest stream is already being remapped."
		else
			kill $(ps aux | grep "[S]CREEN.* $remap_id$dest" | awk '{print $2}')
			echo "Turning off $remap_id $dest stream remapping."
		fi
	fi
	;;

esac
