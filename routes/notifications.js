const {
	Notification,
	validateNotification,
} = require('../models/notification');
const express = require('express');
const router = express.Router();
const { updateDeviceId, getUsers } = require('../routes/users');
const { sendNotification } = require('../services/notificationService');
const { t, lang } = require('../services/langs');

router.get('/', async (req, res) => {
	let docs = await Notification.find({});

	res.send(docs);
});

router.post('/add', async (req, res) => {
	const { error } = validateNotification(req.body);
	if (error) return res.status(400).send(error.details[0].message);

	let docs = await Notification.insertMany([req.body]);

	res.send(docs);
});

router.post('/getUserNotifcaions/:id', async (req, res) => {
	let docs = await Notification.find({ user: req.params.id }).sort({ _id: -1 });

	res.send(docs);
});

router.post('/regUserForNoti', async (req, res) => {
	let result = await updateDeviceId(req.body._id, req.body.notiToken);

	res.status(200).send();
});

router.post('/rmrNotiToken', async (req, res) => {
	let result = await updateDeviceId(req.user._id, null);

	res.status(200).send();
});

router.post('/delete', async (req, res) => {
	await Notification.findByIdAndRemove({ _id: req.body._id });
	res.status(200).send();
});

router.post('/send', async (req, res) => {
	lang(req.header('Accept-Language'));
	console.log(req.body.userIds);

	let users = await getUsers(req.body.userIds),
		notifications = [],
		deviceIds = [];

	console.log(' Users are ... ', users);

	users.forEach(user => {
		if (user.deviceId) {
			notifications.push({
				user: user._id,
				title: req.body.tit,
				description: req.body.desc,
				issueDate: new Date(),
				action: t('accepted'),
			});
			deviceIds.push(user.deviceId);
		}
	});

	let parameter = {
		deviceIds: deviceIds,
		message: req.body.desc,
		title: req.body.tit,
		data: {
			// screen: 'ClassesDetails',
			// params: {
			//   classId: result._id
			// }
		},
	};

	await saveNotification(notifications);

	await sendNotification(parameter);

	res.status(200).send();
});

async function saveNotification(notifications) {
	try {
		let docs = await Notification.insertMany(notifications);
		console.log(docs);

		return docs;
	} catch (e) {
		console.log(e);
	}
}

module.exports = router;
module.exports.saveNotification = saveNotification;
