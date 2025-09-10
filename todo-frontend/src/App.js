import React, { useState } from 'react';
import axios from 'axios';
import { Container, Typography, Box, Tabs, Tab } from '@mui/material';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import NewTask from './NewTask';
import TaskList from './TaskList';
import ViewTask from './ViewTask';

const App = () => {
	const [selectedTask, setSelectedTask] = useState(null);
	const [refreshList, setRefreshList] = useState(false);
	const [tab, setTab] = useState(0);
	const [userID, setUserID] = useState(0);

	const getUserID = async () => {
		if(userID === 0)
		{
			try {
				const res = await axios.get(process.env.REACT_APP_TODO_BACKEND + '/api/userid', { withCredentials: true });
				console.log(res.data);
				setUserID(res.data);
			}
			catch (err) {
				//console.log(err);
				window.location.assign(process.env.REACT_APP_TODO_BACKEND);
			}
		}
	};
	function doLogOut()
	{
		window.location.assign(process.env.REACT_APP_TODO_BACKEND + '/logout');
	}

	getUserID();

	return (
		<><Toolbar sx={{ justifyContent: "space-between" }}>
			<div />
			<Button type="submit" onClick={doLogOut} >
				Log out
			</Button>
		</Toolbar>
		<Container maxWidth="md" sx={{ mt: 4 }}>

			<Typography variant="h4" align="center" gutterBottom>
				Tasks TODO
			</Typography>

			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
				<Tabs
					value={tab}
					aria-label="Task list tabs"
					onChange={(e, newValue) => {
						setTab(newValue);
					}}
					centered
				>
					{/* Tabs in the UI
					// - First tab is the list of tasks
					// - Second tab is a form for adding a new task
					// - Third tab is for viewing details of a task and interacting with it, or editing it. If no task is selected, the tab is disabled.
					*/}
					<Tab label="Task list" />
					<Tab label="Add a task" />
					{selectedTask === null ? (<Tab label="View a task" disabled />) : (<Tab label="View a task" />)}
				</Tabs>
			</Box>

			{/* Tab 0
			// If we're in tab 0, show the list
			*/}
			{tab === 0 && (
				<TaskList
					me={userID}
					onEdit={(selectedTask) => {
						setSelectedTask(selectedTask);
						setTab(2);
					}}
					key={refreshList}
				/>
			)}

			{/* Tab 1
			// If we're in tab 1, show task creation form
			// - passing selectedTask will allow us to create a new task based on the selected task
			*/}
			{tab === 1 && (
				<NewTask
					me={userID}
					selected={selectedTask}
					clearSelection={() => setSelectedTask(null)}
					onSaved={() => {
						setRefreshList(!refreshList);
						setTab(0);
					}}
				/>
			)}

			{/*
			// If we're in tab 2, show task creation form
			*/}
			{tab === 2 && (
				<ViewTask
					me={userID}
					selected={selectedTask}
					clearSelection={() => setSelectedTask(null)}
					onSaved={() => {
						setRefreshList(!refreshList);
						setTab(0);
					}}
					onEdit={() => {
						setRefreshList(!refreshList);
					}}
					key={refreshList}
				/>
			)}
		</Container></>
	);
};

export default App;
