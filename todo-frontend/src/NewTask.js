
import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Box } from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import relativeTime from 'dayjs/plugin/relativeTime';
require('dayjs/locale/fi');

/*
// Task creation component
// Props:
//  - onSaved returns to the list, primarily when the task is saved
*/
const NewTask = ({ myID, onSaved }) => {
	// Tila lomakkeen kentille
	const [form, setForm] = useState({
		task_name: '',
		task_description: ''
	});
	const [startDate, setStartDate] = useState(dayjs().add(1, 'hour').set('minute', 0).set('second', 0).set('millisecond', 0));
	const [endDate, setEndDate] = useState(dayjs().add(1, 'day').add(1, 'hour').set('minute', 0).set('second', 0).set('millisecond', 0));
	const [privateTask, setPrivate] = useState(false);
	var userLocale = "fi";//Intl.DateTimeFormat().resolvedOptions().locale;
	//var timeZone = 	Intl.DateTimeFormat().resolvedOptions().timeZone;//"Europe/Helsinki";
	dayjs.extend(relativeTime);
	dayjs.locale(userLocale);

	/*
	// Store a changed form element
	*/
	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
		//console.log(form);
	};

	/*
	// Store a changed checkbox value
	*/
	const handleBoolean = (e) => {
		setForm({ ...form, [e.target.name]: e.target.checked });
		setPrivate(e.target.checked);
  };

	/*
	// New task form submission
	*/
	const handleSubmit = async (e) => {
		try {
			/*
			// Prevent traditional form behaviour
			*/
			e.preventDefault();

			await axios.post(process.env.REACT_APP_TODO_BACKEND + '/api/newtask', {task_name: form.task_name, task_description: form.task_description, private: form.private, task_start: startDate.toISOString(), task_end: endDate.toISOString() }, { withCredentials: true, "Content-Type": "application/json" });

			/*
			// Return to task list
			*/
			onSaved();
		}
		catch (err) {
	  		//console.log(err);
			window.location.assign(process.env.REACT_APP_TODO_BACKEND);
		}
	};

	/*
	// Show the new task submission form
	*/
	return (
		<Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}><LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={userLocale}>
			<TextField
				label="Title"
				name="task_name"
				value={form.task_name}
				onChange={handleChange}
				required
			/>
			<TextField
				label="Description"
				name="task_description"
				value={form.task_description}
				multiline
			  rows={2}
				onChange={handleChange}
				required
			/>
			<FormControlLabel
				control={<Checkbox name="private" checked={privateTask} onChange={handleBoolean} />}
				label="Make task private"
			/>
			<DateTimePicker
				label="Start date"
				name="task_start_date"
				value={startDate}
				onChange={(newValue) => setStartDate(newValue)}
			/>
			<DateTimePicker
				label="End date"
				name="task_end_date"
				value={endDate}
				onChange={(newValue) => setEndDate(newValue)}
			/>
			<Button type="submit" variant="contained" color="primary">
				Add task
			</Button>
		</LocalizationProvider></Box>
	);
};

export default NewTask;
