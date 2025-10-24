# Version One Backend

A scalable, secure, and feature-rich Node.js backend for a modern parenting and baby names web application. Built with Express, MongoDB, and Mongoose, this backend provides robust APIs for authentication, blog management, baby name search and analysis, and more.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Development Scripts](#development-scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Authentication & Authorization**
  - Secure JWT-based login/logout
  - Admin management
  - Password reset via email
  - Cookie-based session handling

- **Blog Management**
  - CRUD operations for blogs
  - Categories, tags, featured images
  - Pagination, search, and filtering
  - View and like tracking

- **Baby Name Search & Analysis**
  - Search by trending, top 100, region, religion, gender, origin, length, popularity, numerology, zodiac, and more
  - Advanced filters: prefix/suffix, parent names, letter analysis
  - Name meaning, zodiac details, and numerology insights
  - Name generation and suggestions

- **Security & Best Practices**
  - Helmet, CORS, compression, cookie-parser
  - Input validation and sanitization
  - Centralized error handling
  - Logging with Winston and MongoDB

- **Extensible & Maintainable**
  - Modular codebase with clear separation of concerns
  - Environment-based configuration
  - Ready for future features and scaling

---

## Tech Stack

- **Node.js** (ES Modules)
- **Express.js** (v5)
- **MongoDB** & **Mongoose**
- **JWT** for authentication
- **Nodemailer** for emails
- **Winston** for logging
- **Helmet, CORS, Compression** for security and performance
- **ESLint & Prettier** for code quality

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB instance (local or cloud)

### Installation

```bash
git clone https://github.com/AttaullahSiddiqui/version_one_backend.git
cd version_one_backend
npm install
```

### Running the App

#### Development

```bash
npm run dev
```

#### Production

```bash
npm start
```

---

## Environment Variables

Create a `.env` file in the root directory and configure the following:

```env
ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/version_one_backend
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password
SMTP_FROM_EMAIL=your_email@example.com
APP_NAME=YourAppName
APP_URL=https://yourapp.com
FRONTEND_URL=https://yourfrontend.com
```

---

## Project Structure

```
src/
  config/         # Environment and app configuration
  controllers/    # Route controllers (auth, blog, name, etc.)
  middleware/     # Express middlewares (auth, error, etc.)
  models/         # Mongoose models (User, Blog, Name)
  routes/         # API route definitions
  services/       # Business logic/services
  utils/          # Utility functions (cookies, email, logger, etc.)
  validations/    # Request validation logic
  constants/      # App-wide constants
  public/         # Static assets
  app.js          # Express app setup
  index.js        # App entry point
```

---

## API Overview

### Authentication

- `POST /api/auth/login` — Login and receive JWT cookie
- `POST /api/auth/logout` — Logout and clear session
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password/:token` — Reset password
- `GET /api/auth/me` — Get current user profile
- `POST /api/auth/create-admin` — Create admin (admin only)

### Blog

- `GET /api/blogs/all` — List all blogs (paginated)
- `GET /api/blogs/:slug` — Get blog by slug
- `POST /api/blogs/create` — Create blog (admin only)
- `PUT /api/blogs/update/:id` — Update blog (admin only)
- `DELETE /api/blogs/delete/:id` — Delete blog (admin only)

### Baby Names

- `GET /api/names/trending` — Trending names
- `GET /api/names/top-100` — Top 100 names
- `GET /api/names/region/:region` — Names by region
- `GET /api/names/religion/:religion` — Names by religion
- `GET /api/names/search` — Advanced name search
- `GET /api/names/meaning/:name` — Get name meaning
- `GET /api/names/zodiac/:sign` — Names by zodiac sign
- `GET /api/names/element/:element` — Names by zodiac element
- `GET /api/names/analysis/:name` — Letter/zodiac analysis
- `POST /api/names/generate` — Generate/suggest names
- `POST /api/names/create` — Add new name (admin only)
- `PUT /api/names/update/:id` — Update name (admin only)
- `DELETE /api/names/delete/:id` — Delete name (admin only)

---

## Development Scripts

- `npm run dev` — Start server in development mode with auto-reload
- `npm run lint` — Run ESLint
- `npm run lint:fix` — Fix lint errors
- `npm run format` — Format code with Prettier
- `npm run format:check` — Check code formatting

---

## Contributing

Contributions, issues, and feature requests are welcome!
Please open an issue or submit a pull request via [GitHub](https://github.com/AttaullahSiddiqui/version_one_backend).

---

## License

This project is licensed under the ISC License.

---

## Author

Attaullah Siddiqui
[GitHub Profile](https://github.com/AttaullahSiddiqui)

---

## Support

For questions or support, please open an issue on [GitHub](https://github.com/AttaullahSiddiqui/version_one_backend/issues).
