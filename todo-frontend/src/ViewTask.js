import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import DoneIcon from '@mui/icons-material/Done';
import DeleteForeverOutlinedIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import StartIcon from '@mui/icons-material/Start';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import FormControlLabel from '@mui/material/FormControlLabel';
import relativeTime from 'dayjs/plugin/relativeTime';
require('dayjs/locale/fi');

/*
// Task detail component
// Props:
//  - selected contains the task that was selected from the list
//  - clearSelection clears the selection
//  - onSaved returns to the list, primarily when the task is saved
//  - onEdit refreshes the task after it's been interacted with
*/
const ViewTask = ({ me, selected, clearSelection, onSaved, onEdit }) => {

	const [task, setTask] = useState({});
	const [editMode, setEditmode] = useState(false);
	const [startDate, setStartDate] = useState(dayjs());
	const [endDate, setEndDate] = useState(dayjs());
	const [actualStartDate, setActualStartDate] = useState(dayjs());
	const [actualEndDate, setActualEndDate] = useState(dayjs());
	var userLocale = "fi";//Intl.DateTimeFormat().resolvedOptions().locale;// navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language;
	//var timeZone = 	Intl.DateTimeFormat().resolvedOptions().timeZone;//"Europe/Helsinki";
	dayjs.extend(relativeTime);
	dayjs.locale(userLocale);

	useEffect(() => {
		/*
		// A function for showing task durations in human-readable form.
		// Takes a total in seconds and outputs x days, y hours, z minutes and n seconds
		*/
		function parseIntervalEffect(seconds) {
			if(isNaN(parseInt(seconds))) {
				return false;
			}

			let days = Math.floor(seconds / 86400);
			seconds = seconds % 86400;
			let hours = Math.floor(seconds / 3600);
			seconds = seconds % 3600;
			let minutes = Math.floor(seconds / 60);
			seconds = seconds % 60;
			let retval = '';
			let retval_array = [];
			if (days > 1)
			{
				retval_array.push(days + " days");
			}
			if (days === 1)
			{
				retval_array.push(days + " day");
			}
			if (hours > 1)
			{
				retval_array.push(hours + " hours");
			}
			if (hours === 1)
			{
				retval_array.push(hours + " hour");
			}
			if (minutes > 1)
			{
				retval_array.push(minutes + " minutes");
			}
			if (minutes === 1)
			{
				retval_array.push(minutes + " minute");
			}
			if (seconds > 1)
			{
				retval_array.push(seconds + " seconds");
			}
			if (seconds === 1)
			{
				retval_array.push(seconds + " second");
			}
			retval = retval_array.join(", ");
			if(retval_array.length > 0)
			{
				 retval = retval + ".";
			}
			return retval;
		}
		if (selected) {
			/*
			// Making dayjs objects out of the timestamps
			*/
			setStartDate(dayjs(selected.planned_task_start));
			setEndDate(dayjs(selected.planned_task_finish));
			setActualStartDate(dayjs(selected.actual_task_start));
			setActualEndDate(dayjs(selected.actual_task_finish));

			/*
			// Calculating how many seconds passed between actual task start and finish, then formatting it in a more friendly way
			*/
			selected.time_used = parseIntervalEffect(dayjs(selected.actual_task_finish).diff(selected.actual_task_start, 'second'));

			/*
			// Default values in case of editing
			*/
			selected.reset_start = true;
			selected.reset_end = true;

			/*
			// Saving the task for use
			*/
			setTask(selected);
		}
		else {
			/*
			// If nothing is selected, this should take us back to list view
			*/
			onSaved();
		}
	}, [selected, onSaved]);

	/*
	// A function for showing task durations in human-readable form.
	// Takes a total in seconds and outputs x days, y hours, z minutes and n seconds
	*/
	const parseInterval = async (seconds) => {
		let days = Math.floor(seconds / 86400);
		seconds = seconds % 86400;
		let hours = Math.floor(seconds / 3600);
		seconds = seconds % 3600;
		let minutes = Math.floor(seconds / 60);
		seconds = seconds % 60;
		let retval = '';
		let retval_array = [];
		if (days > 1)
		{
			retval_array.push(days + " days");
		}
		if (days === 1)
		{
			retval_array.push(days + " day");
		}
		if (hours > 1)
		{
			retval_array.push(hours + " hours");
		}
		if (hours === 1)
		{
			retval_array.push(hours + " hour");
		}
		if (minutes > 1)
		{
			retval_array.push(minutes + " minutes");
		}
		if (minutes === 1)
		{
			retval_array.push(minutes + " minute");
		}
		if (seconds > 1)
		{
			retval_array.push(seconds + " seconds");
		}
		if (seconds === 1)
		{
			retval_array.push(seconds + " second");
		}
		retval = retval_array.join(", ");
		if(retval_array.length > 0)
		{
			 retval = retval + ".";
		}
		return retval;
	}

	/*
	// A function for deleting a task
	*/
	const deleteTask = async (id) => {
		try {
			let retval = await axios.delete(process.env.REACT_APP_TODO_BACKEND + `/api/deltask/${id}`, { withCredentials: true });
			if(retval.status === 200) {
				onSaved();
				clearSelection();
			}
		}
		catch (err) {
	    	console.log(err);
		}
		finally {
		}
	};

	/*
	// A function for marking a task as started
	*/
	const startTask = async (id) => {
		try {
			let retval = await axios.put(process.env.REACT_APP_TODO_BACKEND + `/api/starttask`, {task_id: id}, { withCredentials: true });
			if(retval.status === 200)
			{
				selected.actual_task_start = retval.data.actual_task_start;
				selected.starter_name = "You";
			}
		}
		catch (err) {
	    	console.log(err);
	 	}
		finally {
			onEdit();
		}
	};

	/*
	// A function for marking a task as completed
	*/
	const finishTask = async (id) => {
		try {
			let retval = await axios.put(process.env.REACT_APP_TODO_BACKEND + `/api/finishtask`, {task_id: id}, { withCredentials: true });
			if(retval.status === 200)
			{
				selected.actual_task_finish = retval.data.actual_task_finish;
				selected.finisher_name = "You";
				selected.time_used = await parseInterval(dayjs(selected.actual_task_finish).diff(selected.actual_task_start, 'second'));
				//console.log(selected);
			}
		}
		catch (err) {
	    	console.log(err);
		}
		finally {
			onEdit();
		}
	};

	/*
	// Edit form submission
	*/
	const handleSubmit = async (e) => {
		/*
		// Prevent traditional form behaviour
		*/
		e.preventDefault();

		/*
		// Attempt storing these dates (which could be null) as ISO 8601 strings
		*/
		let actual_start_date;
		let actual_end_date;
		try {
			actual_start_date = actualStartDate.toISOString();
		}
		catch(err)
		{
			actual_start_date = '';
		}
		try {
			actual_end_date = actualEndDate.toISOString();
		}
		catch(err)
		{
			actual_end_date = '';
		}

		try {
			/*
			// Edit form submission
			*/
			await axios.put(process.env.REACT_APP_TODO_BACKEND + '/api/edittask/'+task.task_id, {task_name: task.task_name, task_description: task.task_description, private: task.private, task_start: startDate.toISOString(), task_end: endDate.toISOString(), reset_start: task.reset_start, reset_end: task.reset_end, actual_task_start: actual_start_date, actual_task_finish: actual_end_date}, { withCredentials: true, "Content-Type": "application/json" });

			/*
			// Return to task list and clear selection
			*/
			onSaved();
			clearSelection();
		}
		catch(err)
		{
			window.location.assign(process.env.REACT_APP_TODO_BACKEND);
		}
	};

	/*
	// Store a changed form element
	*/
	const handleChange = (e) => {
		setTask({ ...task, [e.target.name]: e.target.value });
	};

	/*
	// Store a changed checkbox value
	*/
	const handleBoolean = (e) => {
		setTask({ ...task, [e.target.name]: e.target.checked });
  };

	/*
	// If editing the task, show the edit form
	*/
	if(editMode)
	{
		return (
		<Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}><LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={userLocale}>
			<TextField
				label="Title"
				name="task_name"
				value={task.task_name}
				onChange={handleChange}
				required
			/>
			<TextField
				label="Description"
				name="task_description"
				value={task.task_description}
				multiline
			  rows={2}
				onChange={handleChange}
				required
			/>
			{task.creator_id === me &&(<FormControlLabel
				control={<Checkbox name="private" checked={task.private} onChange={handleBoolean} />}
				label="Make task private"
			/>)}
			<DateTimePicker
				label="Planned start date"
				name="task_start_date"
				value={startDate}
				onChange={(newValue) => setStartDate(newValue)}
			/>
			<DateTimePicker
				label="Planned end date"
				name="task_end_date"
				value={endDate}
				onChange={(newValue) => setEndDate(newValue)}
			/>
			<FormControlLabel control={<Checkbox name="reset_start" checked={task.reset_start} onChange={handleBoolean} />} label="Reset task start" />
			<FormControlLabel control={<Checkbox name="reset_end" checked={task.reset_end} onChange={handleBoolean} />} label="Reset task finish" />
			{!task.reset_start && (<DateTimePicker
				label="Actual start date"
				name="actual_task_start_date"
				value={actualStartDate}
				onChange={(newValue) => setActualStartDate(newValue)}
			/>)}
			{!task.reset_end && (<DateTimePicker
				label="Actual end date"
				name="actual_task_end_date"
				value={actualEndDate}
				onChange={(newValue) => setActualEndDate(newValue)}
			/>)}
			<Button type="submit" variant="contained" color="primary">
				Save edited task
			</Button>
		</LocalizationProvider></Box>
		);
	}

	/*
	// If not editing the task, show the details
	*/
	else 	{
		return (
		<Grid container spacing={2}><Grid size={12}>
			<Typography variant="h3" sx="mt: 1">
				{task.task_name}
			</Typography>
			<p>{task.task_description}</p>
			</Grid>
			<Grid size={12}>
				<Typography variant="h5">State: {task.actual_task_finish !== null && ('Finished')}{task.actual_task_start !== null && task.actual_task_finish === null && ('Started')}{task.actual_task_start === null && ('Not started')}</Typography>
			</Grid>
			<Grid size={12}>
				<Typography variant="h6">Added by: {task.creator_name}{task.private === true && (' (private)')}</Typography>
			</Grid>
			<Grid size={6}>
				<Typography variant="h6">Planned start time</Typography>
				{task.planned_task_start === null ? ("none") : (task.planned_task_start)}
			</Grid>
			<Grid size={6}>
				<Typography variant="h6">Start time</Typography>
				{task.actual_task_start === null ? ("not started yet") : (task.actual_task_start)}
			</Grid>
			<Grid size={6}>
				<Typography variant="h6">Planned finish time</Typography>
				{task.planned_task_finish === null ? ("none") : (task.planned_task_finish)}
			</Grid>
			<Grid size={6}>
				<Typography variant="h6">Finish time</Typography>
				{task.actual_task_finish === null ? ("not finished yet") : (task.actual_task_finish)}
			</Grid>
			<Grid size={6}>
				<Typography variant="h6">{task.starter_name && (`Started by: ${task.starter_name}`)}</Typography>
			</Grid>
			<Grid size={6}>
				<Typography variant="h6">{task.finisher_name && (`Finished by: ${task.finisher_name}`)}</Typography>
			</Grid>
			<Grid size={12}>
				<Typography variant="h6">{task.time_used && (`Time used: ${task.time_used}`)}</Typography>
			</Grid>
			<Grid size={12}><Divider /></Grid>
			<Grid size={6}>
				{task.actual_task_start === null && (<Button
					variant="outlined"
					size="small"
					onClick={() => startTask(task.task_id)}
				>
				<StartIcon />Start task
				</Button>)}
				{task.actual_task_start !== null && task.actual_task_finish === null && (<Button
					variant="outlined"
					size="small"
					onClick={() => finishTask(task.task_id)}
				>
				<DoneIcon />Finish task
				</Button>)}
				{task.actual_task_finish !== null && (<Button
					variant="outlined"
					size="small"
					disabled
				>
				<DoneIcon />Task completed
				</Button>)}
			</Grid>
			<Grid size={3}  >
				<Button
					variant="outlined"
					size="small"
					onClick={() => setEditmode(true)}
				>
				<EditIcon />Edit task
				</Button>
			</Grid>
			<Grid size={3} align="right" >
				{task.creator_id === me ? (
				<Button
					variant="outlined"
					size="small"
					color="error"
					onClick={() => deleteTask(task.task_id)}
				>
				<DeleteForeverOutlinedIcon />Remove task
				</Button>
				) : (
				<Tooltip title="Can't remove task owned by someone else" followCursor><span><Button
					variant="outlined"
					size="small"
					color="error"
					disabled
				>
				<DeleteForeverOutlinedIcon />Remove task
				</Button></span></Tooltip>
				)}
			</Grid>
		</Grid>
	);
	}
}

export default ViewTask;
