require('dotenv').config();
require("./settings");
//const mime = require('mime');
const mime = require('mime-types');
const pool = require("./db-pg");
const express = require('express');
const cors = require('cors');
var corsOptions = {
	origin: cors_url,
	credentials: true,
	allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie"
  ],
  exposedHeaders: ["Set-Cookie"]
}
const cookieParser = require("cookie-parser");
const fs = require('node:fs');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
});
app.set('etag', false);
app.use('/', express.static('login'));
app.use('/todo', express.static('todo'), async (req, res, next) => {
	let user_id = await getUserID(req);
	if(!user_id || user_id < 0) {
		debuglog("static todo: not logged in");
		return res.status(403).json({
			success: false,
			message: "Access denied.",
		});
	}
	else {
		debuglog("static todo: logged in as " + user_id);
		next();
	}
});

function debuglog(debugstring) {
	if (mode_debug) {
		console.log(new Date().toISOString() + ": " + debugstring);
	}
}

async function getUserID(request)
{
	try {
		if (!request.cookies.c1 || !request.cookies.c2)
		{
			debuglog("auth failed: missing cookies");
			return false;
		}

		//console.log(request.cookies);

		let session_id = request.cookies.c1;
		let hash = request.cookies.c2;
		let remote_ip = request.ip;

		/*
		// Query the provided cookies against database.
		// Expired sessions are excluded.
		*/
		const query_user_id = await pool.query(
			"SELECT user_id, ip FROM sessions " +
			"WHERE session_id = $1 AND " +
			"session_hash = $2 AND " +
			"session_end is NULL AND (session_use is NULL OR session_use > (clock_timestamp()-($3 * interval '1 minute')))",
			[session_id, hash, session_timeout_minutes]
		);
		if (query_user_id.rowCount === 0) {
			debuglog("auth failed: no matching sessions");
			const logoutsession = await pool.query(
				"UPDATE sessions SET session_end = clock_timestamp() " +
				"WHERE session_id = $1 AND session_hash = $2 " +
				"RETURNING session_end",
				[session_id, hash]
			);
			return false;
		}
		else
		{
			if (session_restrict_ip && remote_ip != query_user_id.rows[0].ip)
			{
				debuglog("auth failed: wrong ip");
				return false;
			}
			const updatesession = await pool.query(
				"UPDATE sessions SET session_use = clock_timestamp() " +
				"WHERE session_id = $1 AND session_hash = $2 " +
				"RETURNING session_use",
				[session_id, hash]
			);
			debuglog('Logged in as id ' + query_user_id.rows[0].user_id);
			return query_user_id.rows[0].user_id;
		}
	}
	catch (err) {
		debuglog("Checking session failed with errors");
		console.error(err.message);
		return false;
	}
}

/*
// Logging in
*/
app.post("/login", async (req, res) => {
	try {
		debuglog("/login");

		/*
		// If the request body does not exist
		*/
		if (!req || Object.prototype.hasOwnProperty.call(req, 'body') == false) {
			debuglog("Request data not found");
			return res.status(400).json({
				success: false,
				message: "Invalid request",
			});
		}

		/*
		// If the request body exists
		*/
		else {
			body = req.body;

			/*
			// These three things are necessary for logging in
			*/
			if (req.body.username && req.body.password && req.ip) {
				let username = req.body.username;
				debuglog("Trying to log in as " + username);
				const checkuser = await pool.query(
					"SELECT user_id, password, replace(user_hash::text, '-', '') as hash FROM users WHERE user_name = $1",
					[username]
				);
				if (checkuser.rowCount == 0) {
					debuglog("User doesn't exist");
					return res.status(401).json({
						success: false,
						message: "Invalid login credentials.",
					});
				}
				else {
					debuglog("User found...");
				}

				let password = req.body.password;
				const password_hash = checkuser.rows[0].password;

				/*
				// Check whether the provided password matches the stored hash
				*/
				const match = await pool.query("SELECT crypt($1, $2) = $2 AS valid", [
					password,
					password_hash
				]);

				if (match.rows[0].valid) {
					/*
					// Create new session.
					//  - session ID is a random UUID
					//  - session hash is based on predetermined hash and current timestamp
					//  - collisions are possible, but extremely unlikely
					*/
					let remote_ip = req.ip;
					let now = new Date();
					let session_hash = (BigInt(parseInt(checkuser.rows[0].hash, 16)) ^ BigInt(now.getFullYear().toString().padStart(4,"0")+(now.getMonth()+1).toString().padStart(2,"0")+now.getDate().toString().padStart(2,"0")+now.getHours().toString().padStart(2,"0")+now.getMinutes().toString().padStart(2,"0")+now.getSeconds().toString().padStart(2,"0")+now.getMilliseconds().toString().padStart(3,"0"))).toString(16);
					const createsession = await pool.query(
						"INSERT INTO sessions(user_id, ip, session_hash) VALUES($1, $2, $3) RETURNING replace(session_id::text, '-', '') as session_id",
						[checkuser.rows[0].user_id, remote_ip, session_hash]
					);

					/*
					// If session was created, make cookies and move on to the frontend
					*/
					if (createsession.rowCount > 0) {
						debuglog("Login succesful");
						res.cookie("c1", createsession.rows[0].session_id, {
							httpOnly: true,
							domain: cookie_domain,
						});
						res.cookie("c2", session_hash, {
							httpOnly: true,
							domain: cookie_domain,
						});
						res.redirect(frontend_url);
					} // if: createsession
					else {
						debuglog("Login failed");
						return res.status(500).json({
							success: false,
							message: "Logging in failed.",
						});
					} // else: createsession
				} // if: match.rows[0].valid
				else {
					return res.status(401).json({
						success: false,
						message: "Invalid login credentials.",
					});
				} // else: match.rows[0].valid
			} // if: req.body x2
			else {
				return res.status(400).json({
					success: false,
					message: "Invalid request body",
				});
			} // else: req.body x2
		} // else: !req
	}
	catch (err) {
		console.error(err.message);
	}
});

app.get("/logout", async (req, res) => {
	try {
		debuglog("/logout");
		let user_id = await getUserID(req);
		if(user_id > 0) {
			let session_id = req.cookies.c1;
			let hash = req.cookies.c2;
			const logoutsession = await pool.query(
				"UPDATE sessions SET session_end = clock_timestamp() " +
				"WHERE session_id = $1 AND session_hash = $2 " +
				"RETURNING session_end",
				[session_id, hash]
			);
			if (logoutsession.rowCount > 0) {
				debuglog("Logout succesful");
				res.cookie("c1", "", {
					httpOnly: true,
					domain: cookie_domain,
					maxAge: 1
				});
				res.cookie("c2", "", {
					httpOnly: true,
					domain: cookie_domain,
					maxAge: 1
				});
				res.send(`
<html>
<head><title>Logged out succesfully</title></head>
<body>
<h1>Logged out succesfully</h1>
<p>Well... <a href="/">move along now</a>.</p>
</body>
</html>`);
			} // if: logoutsession
			else {
				res.send(`
<html>
<head><title>Problem with logout</title></head>
<body>
<h1>Problem with logout</h1>
<p>Couldn't log you out. You can try <a href="">refreshing</a> to see if it works now.</p>
</body>
</html>`);
			}
		} // if: user_id > 0
		else {
			/*
			// Already not logged in
			*/
			res.redirect(frontend_url);
		}
	}
	catch (err) {
		console.error(err.message);
	}
});

app.get('/', async (req, res) => {
	try {
		let user_id = await getUserID(req);
		if(user_id > 0) {
			// show main UI
			debuglog("get /: logged in as " + user_id);
			fs.readFile("todo.html", 'utf8', (err, data) => {
				if(err) {
					debuglog("todo: error reading file");
					return res.status(500).json({
						success: false,
						message: "Internal server error.",
					});
				}
				res.send(data);
			});
			//res.redirect(frontend_url);
			/*res.setHeader('Content-Type', 'text/html');
			res.send(`
<html>
	<head><title>Log in</title></head>
	<body>
		<h1>Logged in</h1>

	</body>
</html>`);*/
		}
		else {
			// show log in form
			debuglog("not logged in: " + user_id);
			res.setHeader('Content-Type', 'text/html');
			fs.readFile('login.html', 'utf8', (err, data) => {
				if (err) {
					res.send(`
<html>
<head><title>Log in</title></head>
<body>
<form action="/login" method="post">
<input type="text" id="username" name="username" required><br>
<input type="password" id="password" name="password" required><br>
<input type="submit">
</form>
</body>
</html>`);
					console.error(err);
				}
				res.send(data);
			});
		}
	}
	catch (err) {
		console.error(err.message);
	}
});


app.get('/showlogin', async (req, res) => {
	try {
		let user_id = await getUserID(req);
		if(user_id > 0) {
			// show main UI
			debuglog("showlogin: logged in as " + user_id);
			//res.redirect(frontend_url);
			res.setHeader('Content-Type', 'text/html');
			res.send(`
<html>
	<head><title>Log in</title></head>
	<body>
		<h1>Logged in</h1>
		<p>It looks like you're logged in as user ID ` + user_id + `.</p>
	</body>
</html>`);
		}
		else {
			// show log in form
			debuglog("showlogin: not logged in: " + user_id);
			res.redirect(frontend_url);
		}
	}
	catch (err) {
		console.error(err.message);
	}
});

// Hae kaikki tehtävät
app.get('/api/gettasks', async (req, res) => {
	try {
		let user_id = await getUserID(req);
		if(user_id > 0) {
			debuglog("gettasks: logged in");
			const query_tasks = await pool.query("SELECT tasks.*, " +
				"(SELECT users.user_name AS creator_name FROM users WHERE users.user_id = tasks.creator_id), " +
				"(SELECT users.user_name AS starter_name FROM users WHERE users.user_id = tasks.starter_id), " +
				"(SELECT users.user_name AS finisher_name FROM users WHERE users.user_id = tasks.finisher_id) " +
				"FROM tasks WHERE private = false OR (private = true AND creator_id = $1) ORDER BY task_id", [user_id]);
			return res.json(query_tasks.rows);
		}
		else {
			debuglog("gettasks: not logged in");
			return res.status(403).json({
				success: false,
				message: "Access denied.",
			});
		}
	}
	catch (err) {
		console.error(err.message);
	}
});

// Hae kaikki omat tehtävät
app.get('/api/owntasks', async (req, res) => {
	try {
		let user_id = await getUserID(req);
		if(user_id > 0) {
			debuglog("owntasks: logged in");
			const query_tasks = await pool.query("SELECT tasks.*, " +
				"(SELECT users.user_name AS creator_name FROM users WHERE users.user_id = tasks.creator_id), " +
				"(SELECT users.user_name AS starter_name FROM users WHERE users.user_id = tasks.starter_id), " +
				"(SELECT users.user_name AS finisher_name FROM users WHERE users.user_id = tasks.finisher_id) " +
				"FROM tasks WHERE creator_id = $1", [user_id]);
			return res.json(query_tasks.rows);
		}
		else {
			debuglog("owntasks: not logged in");
			return res.status(403).json({
				success: false,
				message: "Access denied.",
			});
		}
	}
	catch (err) {
		console.error(err.message);
	}
});

// Lisää uusi tehtävä
app.post('/api/newtask', async (req, res) => {
	try {
		let user_id = await getUserID(req);
		if(user_id > 0) {
			if (!req.body.task_name || !req.body.task_description || !req.ip) {
				debuglog("missing task details");
				return res.status(400).json({
					success: false,
					message: "Invalid request",
				});
			}
			console.log(req.body);
			let taskname = req.body.task_name;
			let description = req.body.task_description;
			let privateTask = false;
			if(req.body.private) {
				privateTask = true;
			}
			let task_start;
			let task_end;
			let startdate;
			let enddate;
			/*
			// if start date is undefined, set it to next full hour next day
			*/
			if(!req.body.task_start) {
				startdate = new Date();
				startdate.setHours((startdate.getHours() + 1), 0, 0, 0);
				task_start = startdate.toISOString();
			}
			else {
				task_start = req.body.task_start;
			}
			/*
			// if start date is undefined, set it to next full hour next day
			*/
			if(!req.body.task_end) {
				enddate = new Date(task_start);
				enddate.setHours((enddate.getHours() + 1), 0, 0, 0);
				enddate.setDate(enddate.getDate() + 1);
				task_end = enddate.toISOString();
			}
			else {
				task_end = req.body.task_end;
			}

			if(task_start > task_end)
			{
				debuglog("Start timestamp larger! switching...");
				let temp_date = task_start;
				task_start = task_end;
				task_end = temp_date;
			}
			const query_newtask = await pool.query("INSERT INTO tasks(task_name, task_description, creator_id, private, planned_task_start, planned_task_finish)" +
				"VALUES($1, $2, $3, $4, $5, $6) RETURNING task_id",
				[taskname, description, user_id, privateTask, task_start, task_end]);
			if(query_newtask.rows[0].task_id > 0)
			{
				debuglog("newtask: task added succesfully");
				return res.json({ success: true, message: 'Task added succesfully' });
			}
		}
		else {
			debuglog("newtask: not logged in");
			return res.status(403).json({
				success: false,
				message: "Access denied.",
			});
		}
	}
	catch (err) {
		console.error(err.message);
		return res.status(500).send(err);
	}
});

app.delete('/api/deltask/:id', async (req, res) => {
	try {
		debuglog("deltask: " + req.params.id);
		let user_id = await getUserID(req);
		if(user_id > 0) {
			const deltask = await pool.query('DELETE FROM tasks WHERE task_id = $1 ' +
				"AND creator_id = $2 ", [req.params.id, user_id]);
			if (deltask.rowCount > 0) {
				debuglog("deltask: success");
				return res.json({
					success: true,
					message: 'Task deleted succesfully'
				});
			}
			else {
				debuglog("deltask: failure");
				return res.status(304).json({
					success: false,
					message: "Task not found or not allowed to delete.",
				});
			}
		}
		else {
			debuglog("deltask: not logged in");
			return res.status(403).json({
				success: false,
				message: "Access denied.",
			});
		}
	}
	catch (err) {
		console.error(err.message);
		return res.status(500).send(err);
	}
});

/*
// Edit task details
*/
app.put('/api/edittask/:id', async (req, res) => {
	try {
		debuglog("edittask: " + req.params.id);
		let user_id = await getUserID(req);
		if(user_id > 0) {
			/*
			// Assuming no malformed queries, setting variables from form data
			*/
			let taskname = req.body.task_name;
			let description = req.body.task_description;
			let task_start = req.body.task_start;
			let task_end = req.body.task_end;
			if(task_start > task_end)
			{
				debuglog("Start timestamp larger! switching...");
				let temp_date = task_start;
				task_start = task_end;
				task_end = temp_date;
			}

			/*
			// Tasks are public by default, but they can be set private too
			*/
			const checktaskowner = await pool.query('SELECT creator_id, private FROM tasks ' +
				'WHERE task_id = $1', [req.params.id]);
			let privateTask = checktaskowner.rows[0].private;
			/*
			// Only task owner can change task privacy
			*/
			if(checktaskowner.rows[0].creator_id === user_id) {
				privateTask = req.body.private;
				debuglog("Setting task privacy");
			}
			else {
				debuglog("Not task owner, not allowed to change privacy");
			}

			/*
			// Task isn't reset by default, but it's marked for reset
			// based on these parameters.
			*/
			let resetStart = false;
			let resetEnd = false;
			let actual_task_start = null;
			let actual_task_finish = null;
			if(req.body.reset_start) {
				resetStart = true;
				resetEnd = true;
			}
			if(req.body.reset_end) {
				resetEnd = true;
			}
			if(req.body.actual_task_start) {
				actual_task_start = req.body.actual_task_start;
			}
			if(req.body.actual_task_finish) {
				actual_task_finish = req.body.actual_task_finish;
			}

			/*
			// Decide query based on task reset checkboxes.
			//  - if resetStart is true, reset both start and finish date.
			//  - if resetEnd is true, reset only the finish date.
			//	- if neither is true, reset neither
			*/
			if(resetStart) {
				const edittask = await pool.query("UPDATE tasks SET task_name = $1, task_description = $2, private = $6, planned_task_start = $3, planned_task_finish = $4, " +
					"actual_task_start = null, starter_id = null, actual_task_finish = null, finisher_id = null " +
					"WHERE task_id = $5",
					[taskname, description, task_start, task_end, req.params.id, privateTask ]
				);
			}
			else if(resetEnd)
			{
				const edittask = await pool.query("UPDATE tasks SET task_name = $1, task_description = $2, private = $6, planned_task_start = $3, planned_task_finish = $4, " +
					"finisher_id = null, actual_task_finish = null " +
					"WHERE task_id = $5",
					[taskname, description, task_start, task_end, req.params.id, privateTask ]
				);
			}
			else {
				const edittask = await pool.query("UPDATE tasks SET task_name = $1, task_description = $2, private = $6, planned_task_start = $3, planned_task_finish = $4, " +
					"actual_task_start = $7, actual_task_finish = $8 " +
					"WHERE task_id = $5",
					[taskname, description, task_start, task_end, req.params.id, privateTask, actual_task_start, actual_task_finish ]
				);
			}
			res.json({ success: true, message: 'Task edited succesfully' });
		}
		else {
			debuglog("edittask: not logged in");
			return res.status(403).json({
				success: false,
				message: "Access denied.",
			});
		}
	}
	catch (err) {
		console.error(err.message);
		return res.status(500).send(err);
	}
});

/*
// Mark task as started
*/
app.put('/api/starttask', async (req, res) => {
	try {
		let user_id = await getUserID(req);
		if(user_id > 0 && Object.prototype.hasOwnProperty.call(req, 'body') !== false) {
			let task_id = req.body.task_id;
			const starttask = await pool.query("UPDATE tasks SET actual_task_start = clock_timestamp(), " +
				"starter_id = $2 " +
				"WHERE actual_task_start IS NULL " +
				"AND task_id = $1 " +
				"RETURNING actual_task_start",
				[task_id, user_id]
			);
			if (starttask.rowCount > 0) {
				debuglog("starttask: success");
				res.json({
					success: true,
					message: 'Task started succesfully',
					actual_task_start: starttask.rows[0].actual_task_start
				});
			}
			else {
				debuglog("starttask: not modified");
				return res.status(304).json({
					success: true,
					message: "Task not modified.",
				});
			}
		}
		else {
			debuglog("starttask: not logged in");
			return res.status(403).json({
				success: false,
				message: "Access denied.",
			});
		}
	}
	catch (err) {
		console.error(err.message);
		return res.status(500).send(err);
	}
});

/*
// Mark task as completed
*/
app.put('/api/finishtask', async (req, res) => {
	try {
		let user_id = await getUserID(req);
		if(user_id > 0 && Object.prototype.hasOwnProperty.call(req, 'body') !== false) {
			let task_id = req.body.task_id;
			const finishtask = await pool.query("UPDATE tasks SET actual_task_finish = clock_timestamp(), " +
				"finisher_id = $2 " +
				"WHERE actual_task_finish IS NULL " +
				"AND actual_task_start IS NOT NULL " +
				"AND task_id = $1 " +
				"RETURNING actual_task_finish",
				[task_id, user_id]
			);
			if (finishtask.rowCount > 0) {
				debuglog("finishtask: success");
				res.json({
					success: true,
					message: 'Task finished succesfully',
					actual_task_finish: finishtask.rows[0].actual_task_finish
				});
			}
			else {
				debuglog("finishtask: not modified");
				return res.status(304).json({
					success: true,
					message: "Task not modified.",
				});
			}
		}
		else {
			debuglog("finishtask: not logged in");
			return res.status(403).json({
				success: false,
				message: "Access denied.",
			});
		}
	}
	catch (err) {
		console.error(err.message);
		return res.status(500).send(err);
	}
});

// Hae kaikki tehtävät
app.get('/api/userid', async (req, res) => {
	try {
		let user_id = await getUserID(req);
		if(user_id > 0) {
			debuglog("userid: logged in");
			return res.json(user_id);
		}
		else {
			debuglog("userid: not logged in");
			return res.status(403).json({
				success: false,
				message: "Access denied.",
			});
		}
	}
	catch (err) {
		console.error(err.message);
	}
});

app.listen(run_port, () => {
	console.log(new Date().toISOString() + ": käytetään porttia " + run_port);
	console.log("Palvelin kuuntelee osoitteessa " + backend_url);
});
