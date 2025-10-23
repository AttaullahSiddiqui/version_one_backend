// import logging from '#configlogger.js';
// import { signInSchema, signUpSchema } from '#validations/auth.validation.js';
// import { formatValidationError } from '#utils/format.js';
// import { authenticateUser, createUser } from '#services/auth.service.js';
// import { jwtToken } from '#utils/jwt.js';
// import { cookies } from '#utils/cookies.js';

// export const signup = async (req, res, next) => {
//   try {
//     const validationResult = signUpSchema.safeParse(req.body);

//     if (!validationResult.success) {
//       return res.status(400).json({
//         error: 'Validation failed',
//         details: formatValidationError(validationResult.error),
//       });
//     }

//     const { name, email, password, role } = validationResult.data;

//     const user = await createUser({
//       name,
//       email,
//       password,
//       role,
//     });

//     const token = jwtToken.sign({
//       id: user.id,
//       email: user.email,
//       role: user.role,
//     });

//     cookies.set(res, 'token', token);

//     logger.info(`User registered successfully: ${email}`);
//     res.status(201).json({
//       message: 'User registered successfully',
//       data: { id: user.id, name, email, role },
//     });
//   } catch (e) {
//     logger.error('Signup error', e);
//     if (e.message === 'User with this email already exists')
//       return res.status(409).json({ error: 'Email already exist' });
//     next(e);
//   }
// };

// export const signin = async (req, res, next) => {
//   try {
//     const validationResult = signInSchema.safeParse(req.body);

//     if (!validationResult.success) {
//       return res.status(400).json({
//         error: 'Validation failed',
//         details: formatValidationError(validationResult.error),
//       });
//     }

//     const { email, password } = validationResult.data;

//     const user = await authenticateUser({
//       email,
//       password,
//     });

//     const token = jwtToken.sign({
//       id: user.id,
//       email: user.email,
//       role: user.role,
//     });

//     cookies.set(res, 'token', token);

//     logger.info(`User ${user.email} signed in successfully`);

//     return res.status(200).json({
//       message: 'User authenticated successfully',
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (e) {
//     logger.error('Signin error', e);
//     if (e.message === 'User not found' || e.message === 'Invalid password')
//       return res.status(401).json({ error: 'Invalid credentials' });
//     next(e);
//   }
// };

// export const signout = async (req, res, next) => {
//   try {
//     cookies.clear(res, 'token');

//     logger.info('User signed out successfully');
//     return res.status(200).json({
//       message: 'User signed out successfully',
//     });
//   } catch (e) {
//     logger.error('Signout error', e);
//     next(e);
//   }
// };
