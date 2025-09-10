psql-admin:

CREATE USER todo_user WITH PASSWORD 'foo/bar';
CREATE DATABASE todo_backend ENCODING = 'UTF8' LOCALE = 'en_US.UTF-8';
ALTER DATABASE todo_backend SET "TimeZone" TO 'Europe/Helsinki';
ALTER DATABASE todo_backend OWNER TO todo_user;



todo_user:

\connect todo_backend
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS group_memberships CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
	user_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_name character varying(60) NOT NULL UNIQUE,
	email character varying(60) NOT NULL UNIQUE,
	password character(60),
	user_hash uuid DEFAULT gen_random_uuid(),
	admin boolean DEFAULT false,
	user_creation timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);

CREATE TABLE sessions (
	session_id uuid default gen_random_uuid(),
	session_hash uuid NOT NULL,
	user_id integer,
	ip inet NOT NULL,
	session_start timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	session_use timestamp with time zone,
	session_end timestamp with time zone,
	PRIMARY KEY (session_id, session_hash)
);

CREATE TABLE groups (
	group_id integer NOT NULL PRIMARY KEY,
	group_name character varying(90) NOT NULL,
	group_creation timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);

CREATE TABLE group_memberships (
	group_id integer NOT NULL,
	user_id integer NOT NULL,
	membership_creation timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	UNIQUE (group_id, user_id)
);

CREATE TABLE tasks (
	task_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	task_name character varying(90) NOT NULL,
	task_description text NOT NULL,
	creator_id integer NOT NULL,
	group_id integer,
	private boolean DEFAULT false,
	task_creation timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
	planned_task_start timestamp with time zone,
	planned_task_finish timestamp with time zone,
	actual_task_start timestamp with time zone,
	starter_id integer,
	actual_task_finish timestamp with time zone,
	finisher_id integer
);


INSERT INTO users (user_name, email, password, admin) VALUES ('user a', 'a@example.com', crypt('password', gen_salt('bf')), true);
INSERT INTO users (user_name, email, password) VALUES ('user b', 'b@example.com', crypt('password', gen_salt('bf')));
