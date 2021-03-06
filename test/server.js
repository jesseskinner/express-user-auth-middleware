const express = require('express');
const getDatabase = require('./_database.js');
const UserAuthMiddleware = require('../src/middleware.js');

(async () => {
	express()
		.use(
			express.static('test/html'),
			UserAuthMiddleware({
				database: await getDatabase(),
				secret: 'SECRET',
				email: {
					verify: (to, verifyCode) => {
						console.log(
							'TODO: send email to ',
							to,
							' with verify link ',
							verifyCode
						);
					},
					reset: (to, resetCode) => {
						console.log(
							'TODO: send reset email to ',
							to,
							' with link ',
							resetCode
						);
					}
				}
			})
		)
		.listen(5000);

	console.log('Running at http://localhost:5000/');
})();
