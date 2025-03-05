.PHONY: *

pretty:
	npx prettier --plugin=prettier-plugin-ejs --write .
	shfmt -w .

install:
	sudo ./setup-nginx-docker.sh

update:
	git pull
	./update-mls.sh

front:
	npm start

run:
	docker compose up

build:
	docker compose build

exec:
	docker exec -it nginx_server bash

dev: build run

css:
	npx tailwindcss -i ./public/input.css -o ./public/output.css --watch
