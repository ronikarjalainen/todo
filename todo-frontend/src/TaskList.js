import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
	Button,
	List,
	ListItem,
	ListItemText,
	Typography,
	Box,
	Grid
} from '@mui/material';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import DoneIcon from '@mui/icons-material/Done';
import ShieldIcon from '@mui/icons-material/Shield';
import PublicIcon from '@mui/icons-material/Public';
import NotStartedIcon from '@mui/icons-material/NotStarted';
import AssignmentIcon from '@mui/icons-material/Assignment';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
require('dayjs/locale/fi');

/*
// The listing component
*/
const TaskList = ({ myID, onEdit }) => {
	// Tasks
	const [fetchedTasks, setFetchedTasks] = useState([]);
	// Hakukentän tila
	const [search, setSearch] = useState('');
	// Suodattimen tila
	const [filter, setFilter] = useState('all');
	// Järjestyksen suunta: true = A–Ö, false = Ö–A
	const [ordering, setOrdering] = useState('no');

	var userLocale = "fi-FI";//Intl.DateTimeFormat().resolvedOptions().locale;
	//var timeZone = 	Intl.DateTimeFormat().resolvedOptions().timeZone;//"Europe/Helsinki";
	dayjs.extend(relativeTime);
	dayjs.locale(userLocale);


	/*
	// Getting the task list from backend.
	// This includes all public tasks and all of your private tasks.
	*/
	const fetchTasks = async () => {
		try {
			const res = await axios.get(process.env.REACT_APP_TODO_BACKEND + '/api/gettasks', { withCredentials: true });
			setFetchedTasks(res.data);
			console.log(res.data);
		}
		catch (err) {
	    	//console.log(err);
			window.location.assign(process.env.REACT_APP_TODO_BACKEND);
		}
	};

	/*
	// Fetch on load
	*/
	useEffect(() => {
		fetchTasks();
	}, []);

	/*
	// Decide date format based on the date.
	// - Tasks dating to different years show full date
	// - Tasks on current day show only the time
	// - Other tasks show date and time
	*/
	function formatDate(date) {
		try {
			if(date === null || date === '')
			{
				return '';
			}
			let date_object = dayjs(date);
			if (!dayjs().isSame(date_object, 'year')) {
				return date_object.format('L');
			}
			if (dayjs().isSame(date_object, 'day')) {
				return date_object.format('LT');
			}
			else {
				return date_object.format('LLL');
			}
		} catch (e) {
			return '';
		}
	}

	/*
	// Filter tasks based on search string and/or category.
	//  - search string is compared against task name, task description and whether the task is private
	//  - search categories are:
	//		 - tasks that are neither started nor completed
	//		 - tasks that are started, but not completed
	//		 - tasks that are not completed
	//		 - tasks that are completed
	//		 - all tasks in fetchedTasks
	*/
	let tasks = fetchedTasks.filter(task => {
		let matchSearch = `${task.task_name} ${task.task_description}`.toLowerCase().includes(search.toLowerCase());
		if(task.private) {
			matchSearch = `${task.task_name} ${task.task_description} private`.toLowerCase().includes(search.toLowerCase());
		}

		let matchFilter;
		switch(filter)
		{
			case "waiting":
				if(!task.actual_task_start && !task.actual_task_finish)
				{
					matchFilter = true;
				}
				break;
			case "started":
				if(task.actual_task_start && !task.actual_task_finish)
				{
					matchFilter = true;
				}
				break;
			case "incomplete":
				if(!task.actual_task_finish)
				{
					matchFilter = true;
				}
				break;
			case "complete":
				if(task.actual_task_finish)
				{
					matchFilter = true;
				}
				break;
			default:
				matchFilter = true;
		}
		return matchSearch && matchFilter;
	});
	tasks.sort((a, b) => {
		if(ordering === "end")
		{
			if (a.planned_task_finish < b.planned_task_finish) return -1;
			if (a.planned_task_finish > b.planned_task_finish) return 1;
		}
		if(ordering === "start")
		{
			if (a.planned_task_start < b.planned_task_start) return -1;
			if (a.planned_task_start > b.planned_task_start) return 1;
		}
		return 0;
	});

	return (
		<Box>
			<Typography variant="h6" gutterBottom>
				Task list contains {`${tasks.length}`} {tasks.length === 1 ? 'task' : 'tasks'}
			</Typography>
			{/* Filtering and ordering options */}
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<TextField
					label="Filter based on search string"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					fullWidth
				/>
				<TextField
					select
					label="Filter based on task status"
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					fullWidth
				>
					<MenuItem value="all">All tasks</MenuItem>
					<MenuItem value="waiting">Waiting tasks</MenuItem>
					<MenuItem value="started">Started tasks</MenuItem>
					<MenuItem value="incomplete">Incomplete tasks</MenuItem>
					<MenuItem value="complete">Completed tasks</MenuItem>
				</TextField>
				<TextField
					select
					label="Ordering"
					value={ordering}
					onChange={(e) => setOrdering(e.target.value)}
					fullWidth
				>
					<MenuItem value="end">Deadline</MenuItem>
					<MenuItem value="start">Start date</MenuItem>
					<MenuItem value="no">No particular order</MenuItem>
				</TextField>
			</Box>

			{/* List showing the fetched tasks */}
			<List>
				{tasks.length > 0 ? (
					// Iterate each task
					tasks.map(task => (
						<ListItem key={task.task_id} divider alignItems="flex-start">
							{/* Data is shown inside a MUI Box, placed in MUI Grids */}
							<Box sx={{ width: '100%' }}>
								<Grid container spacing={1}>
									<Grid size={12}>
										<ListItemText
											primary={`${task.task_name}`}
											secondary={`${task.task_description}`}
										/>
									</Grid>
									{/* Different icons are shown for public/private tasks */}
									<Grid size={6}>
										{task.private ? (<ListItemText
											primary=<Tooltip title={"Private task of " + task.creator_name} followCursor><ShieldIcon /></Tooltip>
											secondary={task.creator_name}
										/>):(<ListItemText
											primary=<Tooltip title="Public task" followCursor><PublicIcon /></Tooltip>
											secondary={task.creator_name}
										/>)}
									</Grid>
									{/* Different icons are shown depending on task status */}
									<Grid size={6}>
										{task.actual_task_start == null && (<ListItemText
											primary=<Tooltip title="Not started" followCursor><NotStartedIcon /></Tooltip>
											secondary='Not started'
										/>)}
										{task.actual_task_start !== null && task.actual_task_finish === null && (<ListItemText
											primary=<Tooltip title={"Started by " + task.starter_name} followCursor><AssignmentIcon /></Tooltip>
											secondary={task.starter_name}
										/>)}
										{task.actual_task_finish !== null && (<ListItemText
											primary=<Tooltip title={"Completed by " + task.finisher_name} followCursor><DoneIcon /></Tooltip>
											secondary={task.finisher_name}
										/>)}
									</Grid>
									{/* Show either the planned start date or the actual start date of the task */}
									<Grid size={6}>
										{task.actual_task_start == null ? (<ListItemText
											primary={formatDate(task.planned_task_start)}
											secondary='Planned'
										/>) : (<ListItemText
											primary={formatDate(task.actual_task_start)}
											secondary='Started'
										/>)}
									</Grid>
									{/* Show either the planned completion date or the actual completion date of the task */}
									<Grid size={6}>
									{task.actual_task_finish == null ? (<ListItemText
										primary={formatDate(task.planned_task_finish)}
										secondary='Planned'
									/>) : (<ListItemText
										primary={formatDate(task.actual_task_finish)}
										secondary='Finished'
									/>)}
									</Grid>
								</Grid>

								{/* View task details */}
								<Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
									<Button
										variant="outlined"
										size="small"
										onClick={() => onEdit(task)}
									>
										View
									</Button>
								</Box>
							</Box>
						</ListItem>
					))
				) : (
					// If no tasks were found
					<Typography variant="body2" color="textSecondary">
						No tasks found
					</Typography>
				)}
			</List>
		</Box>
	);
};

export default TaskList;
