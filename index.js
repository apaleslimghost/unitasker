const menubar = require('menubar');
const micro = require('micro');
const query = require('micro-urlencoded');
const {systemPreferences, Notification, Menu} = require('electron');

const mb = menubar({
	height: 40,
	width: 400,
});

let doing = systemPreferences.getUserDefault('doing', 'string');

function notifyDoing() {
	if(doing) {
		new Notification({
			title: 'currently working on',
			body: doing,
			silent: true,
		}).show();
	}
}

setInterval(notifyDoing, 5 * 60 * 1000);

function setTask(task) {
	doing = task;
	systemPreferences.setUserDefault('doing', 'string', task);
	mb.tray.setTitle(task);
	notifyDoing();
}

const contextMenu = Menu.buildFromTemplate([
	{label: 'Quit', click: () => mb.app.quit()}
]);

mb.on('ready', () => {
	setTask(doing);

	mb.tray.on('right-click', () => mb.tray.popUpContextMenu(contextMenu));
});

const server = micro(async (req, res) => {
	if(req.method === 'POST') {
		const {body} = await query(req);

		setTask(body.doing)
		mb.hideWindow();

		res.setHeader('location', '/');
		return micro.send(res, 302);
	}

	res.setHeader('content-type', 'text/html');
	return `
	<form method='post'>
		<input name="doing" type="text" placeholder="${doing || 'what are you doing'}" maxlength="70" autofocus>
	</form>

	<style>
		body { margin: 0 }
		input { border: 0 none; font-size: 2em; width: 400px }
	</style>
	`;
});

server.listen(() => {
	const {port} = server.address();
	mb.setOption('index', `http://localhost:${port}`);
});
