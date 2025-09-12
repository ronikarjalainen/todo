// Database options
//global.backend_database = "postgresql";
//global.backend_database = "mysql";

// The port the backend server process should run on
global.run_port = process.env.BE_PORT || 6789;

// The port using which the it should be publicly available
//global.backend_port = 443;
global.backend_port = run_port;

// Host, port and path sections of backend
global.backend_host = "localhost";
global.backend_protocol = "http";
global.backend_path = "";
global.backend_url = backend_protocol + "://" + backend_host + ":" + backend_port + "/" + backend_path;

// Frontend can either run separately or from within the Node.js backend
// From Node.js
global.frontend_host = backend_host;
global.frontend_port = backend_port;
// Separately
//global.frontend_host = "localhost";
//global.frontend_port = 3000;

global.frontend_protocol = backend_protocol;
global.frontend_path = "";
global.frontend_url = frontend_protocol + "://" + frontend_host + ":" + frontend_port + "/" + frontend_path;

global.cors_url = frontend_protocol + "://" + frontend_host + ":" + frontend_port + "/";
global.cookie_domain = frontend_host;

// Currently unused database table variables
global.db_table_tasks = "tasks";
global.db_table_users = "users";
global.db_table_groups = "groups";
global.db_table_usergroups = "memberships";

// Session timeout setting in minutes
global.session_timeout_minutes = 1440;

// Session IP restriction
global.session_restrict_ip = false;

// Debug mode
global.mode_debug = true;
