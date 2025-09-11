import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const style = {
	position: 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 400,
	bgcolor: 'background.paper',
	border: '2px solid #000',
	boxShadow: 24,
	p: 4,
};

const ErrorM = ({err, onCloseModal}) => {
	const [isOpen, setOpen] = useState(false);
	const [error, setError] = useState({});
	const handleClose = () => {
		setOpen(false);
		if (onCloseModal) onCloseModal();
	}
	useEffect(() => {
		if (err.open && (err.title || err.message)) {
			setOpen(true);
			setError({title: err.title, message: err.message, showLogin: err.showLogin});
		}
	}, [err]);

	return (
		<div>
			<Modal
				open={isOpen}
				onClose={handleClose}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Grid container sx={style} spacing={2}>
					<Grid size={1}>
						<ErrorOutlineIcon sx={{ }} />
					</Grid>
					<Grid size={11}>
						<Typography id="modal-modal-title" variant="h6" component="h2">
							{error.title}
						</Typography>
					</Grid>
					<Grid size={12}>
						<Typography id="modal-modal-description" sx={{ mt: 2 }}>
							{error.message}
						</Typography>
					</Grid>
					{error.showLogin ? (
						<Grid size={12} align="right" sx={{ mt: 2 }}>
							<a href={process.env.REACT_APP_TODO_BACKEND+'/showlogin'}>Go to login page</a>
						</Grid>
					) : null}
				</Grid>
			</Modal>
		</div>
	);
}
export default ErrorM;