# todoms - A to-do list management system
## Requirements
 - PostgreSQL database.
 - Node.js + a bunch of node_modules
---
## Basic setup
For running on `localhost:6789`
 1. Clone with git, or download and extract the ZIP archive
 2. `cd todo-backend`
 3. `npm install`
 4. Create `.env` file based on `env.example`, where you set mostly the database credentials

	The format used in `.env`:
	- `DB_HOST=localhost` which is the server host for the database connection
	- `DB_USER=` which is the username for the database connection
	- `DB_PASS=` which is the password for the database connection
	- `DB_NAME=` which is the selected database for the database connection
	- `DB_PORT=5432` which is the server port for the database connection
	- `BE_PORT=6789` which is the port the server will run on
 5. Run the server with `node server.js`
---
## Advanced setup
 1. Complete steps 1-4 from basic setup
 2. Edit `todo-backend/settings.js` and set the following according to what you intend to use:
 	- `global.backend_host` Visible host, either in public or private network
	- `global.backend_port` Visible port, should be different from `run_port` if you use a reverse proxy
	- `global.backend_protocol` The protocol for reaching the server
 3. You also might need to change this:
	- `global.cors_url` The URL of the frontend - needed if you run it separately
---
## Building `todo-frontend`
This shouldn't be necessary unless you change the default paths
 1. `cd todo-frontend`
 2. `npm install`
 3. Create `.env` file based on `env.example`, where you set the location where the backend will be running
  - Use relative paths, if possible
 4. Adjust the homepage setting in `todo-frontend/package.json`, if you change the `global.backend_path` server variable
 5. `npm run build`
 6. Replace the existing `todo-backend/todo` folder with the result of the build, for example like this:
	- `rm -r todo-backend/todo`
	- `mv todo-frontend/build todo-backend/todo`
---
## Building `todo-login`
This shouldn't be necessary unless you change the default paths
 1. `cd todo-login`
 2. `npm install`
 3. Create `.env` file based on `env.example`, where you set the location of the login page in the backend
  - Use relative paths, if possible
 4. Adjust the homepage setting in `todo-login/package.json`, if you change the `global.backend_path` server variable
 5. `npm run build`
 6. Replace the existing `todo-backend/login` folder with the result of the build, for example like this:
	- `rm -r todo-backend/login`
	- `mv todo-login/build todo-backend/login`
