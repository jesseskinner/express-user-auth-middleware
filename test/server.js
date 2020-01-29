import express from 'express';
import getDatabase from './_database.js';
import UserAuthMiddleware from '../src/middleware.js';

(async () => {
	express()
		.use(
			express.static('test/html'),
			new UserAuthMiddleware({
                database: await getDatabase(),
                email: {
                    verify: (to, verifyCode) => {
                        console.log(
                            'TODO: send email to ',
                            to,
                            ' with verify link ',
                            verifyCode
                        );
                    },
                    reset: (to, resetLink) => {
                        console.log(
                            'TODO: send reset email to ',
                            to,
                            ' with link ',
                            resetLink
                        );
                    }
                }
			})
		)
		.listen(5000);

	console.log('Running at http://localhost:5000/');
})();
