FROM ubuntu:24.04

RUN apt-get update && apt-get install -y \
    build-essential \
    ca-certificates \
    linux-headers-generic \
    libssl-dev \
    pkgconf \
    pkg-config \
    curl \
    wget \
    htop

##############################
# Build the NGINX-build image.
ARG NGINX_VERSION=1.26.3
ARG NGINX_RTMP_VERSION=1.2.2
# ARG MAKEFLAGS="-j4"

# Build dependencies.
RUN apt-get install -y \
    libpcre3 \
    libpcre3-dev \
    zlib1g-dev

WORKDIR /tmp

# Get nginx source.
RUN wget https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz && \
    tar zxf nginx-${NGINX_VERSION}.tar.gz && \
    rm nginx-${NGINX_VERSION}.tar.gz

# Get nginx-rtmp module.
RUN wget https://github.com/arut/nginx-rtmp-module/archive/v${NGINX_RTMP_VERSION}.tar.gz && \
    tar zxf v${NGINX_RTMP_VERSION}.tar.gz && \
    rm v${NGINX_RTMP_VERSION}.tar.gz

# Compile nginx with nginx-rtmp module.
WORKDIR /tmp/nginx-${NGINX_VERSION}
RUN \
    ./configure \
    --prefix=/usr/local/nginx \
    --conf-path=/etc/nginx/nginx.conf \
    --add-module=/tmp/nginx-rtmp-module-${NGINX_RTMP_VERSION} \
    --with-http_ssl_module \
    --with-cc-opt="-Wimplicit-fallthrough=0" && \
    make && \
    make install


###############################
# Build the FFmpeg-build image.
ARG FFMPEG_VERSION=7.1.1
ARG FFMPEG_PREFIX=/usr/local

# FFmpeg build dependencies.
RUN apt-get install -y \
    # Audio codecs
    libmp3lame-dev \
    libopus-dev \
    libvorbis-dev \
    libfdk-aac-dev \
    # Video codecs
    libx264-dev \
    libx265-dev \
    libx264-164 \
    libx265-199 \
    libvpx-dev \
    libwebp-dev \
    # Other dependencies
    libfreetype6-dev \
    libogg-dev \
    libass9 \
    libass-dev \
    librtmp-dev \
    yasm

WORKDIR /tmp

# Get FFmpeg source.
RUN wget http://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.gz && \
    tar zxf ffmpeg-${FFMPEG_VERSION}.tar.gz && \
    rm ffmpeg-${FFMPEG_VERSION}.tar.gz

# Compile ffmpeg.
WORKDIR /tmp/ffmpeg-${FFMPEG_VERSION}
RUN ./configure \
    --pkg-config-flags="--static" \
    --extra-cflags="-I/usr/include" \
    --extra-ldflags="-L/usr/lib" \
    --prefix=${FFMPEG_PREFIX} \
    --enable-version3 \
    --enable-gpl \
    --enable-nonfree \
    --enable-libmp3lame \
    --enable-libx264 \
    --enable-libx265 \
    --enable-libvpx \
    --enable-libvorbis \
    --enable-libopus \
    --enable-libfdk-aac \
    --enable-libass \
    --enable-libwebp \
    --enable-postproc \
    --enable-libfreetype \
    --enable-openssl \
    --enable-network \
    --disable-ffplay \
    --extra-libs="-lpthread -lm" && \
    make && \
    make install && \
    make distclean

# Cleanup.
RUN apt-get clean


######################
# Build Express image.

ARG NODE_VERSION=22.14.0

RUN apt-get install -y \
    gnupg

RUN curl -sL https://deb.nodesource.com/setup_${NODE_VERSION} | bash - && \
    apt-get install -y nodejs

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm ci

COPY . .


##########################
# Build the release image.

RUN apt-get install -y \
    gettext \
    openssl \
    libpcre3 \
    lame \
    libogg0 \
    libass9 \
    libvpx7 \
    libvorbis0a \
    libwebp7 \
    libtheora0 \
    libopus0 \
    rtmpdump

# Add NGINX path, config and static files.
ENV PATH "${PATH}:/usr/local/nginx/sbin"
COPY nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /opt/data

EXPOSE 1935
EXPOSE 80

WORKDIR /app
CMD nginx
