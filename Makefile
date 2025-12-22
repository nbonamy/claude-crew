.PHONY: install build dev start stop restart logs clean

install:
	cd server && npm install

build:
	cd server && npm run build

dev:
	cd server && npm run dev

start: build
	cd server && npm run pm2:start

stop:
	cd server && npm run pm2:stop

restart:
	cd server && npm run pm2:restart

logs:
	cd server && npm run pm2:logs

clean:
	rm -rf server/node_modules server/dist server/logs
