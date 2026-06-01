# Manish Kejani Backend

## Overview

This repository contains the backend application for Manish Kejani, built with Node.js and Express. It serves as the API for the frontend application, handling data storage, user authentication, product management, and other core functionalities. The backend is designed to be robust, secure, and scalable.

## Features

*   **RESTful API**: Provides a comprehensive set of API endpoints for managing products, users, orders, and promotions.
*   **User Authentication & Authorization**: Secure user management with JWT (JSON Web Tokens), Passport.js, and Google OAuth20 integration.
*   **Database Integration**: Connects to a PostgreSQL database (indicated by `pg` dependency) and potentially MongoDB (indicated by `express-mongo-sanitize`).
*   **Cloud Storage**: Integrates with Cloudinary for image and file uploads.
*   **Email Services**: Utilizes Resend for sending transactional emails.
*   **Security**: Implements various security measures including `helmet`, `cors`, `express-mongo-sanitize`, and `express-rate-limit`.
*   **Logging**: Uses `morgan` for HTTP request logging.
*   **Error Handling**: Centralized error handling middleware.

## Technology Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js (v5.2.1)
*   **Database**: PostgreSQL (`pg` v8.20.0), potentially MongoDB
*   **Authentication**: JWT, Passport.js (v0.7.0), Passport Google OAuth20 (v2.0.0), bcryptjs (v3.0.3)
*   **Cloud Storage**: Cloudinary (v2.9.0), Multer (v2.1.1), Multer Storage Cloudinary (v2.2.1)
*   **Email Service**: Resend (v6.9.4)
*   **Security**: Helmet (v8.1.0), CORS (v2.8.6), Express Mongo Sanitize (v2.2.0), Express Rate Limit (v8.3.1)
*   **Logging**: Morgan (v1.10.1)
*   **Environment Variables**: Dotenv (v17.3.1)
*   **Compression**: Compression (v1.8.1)
*   **UUID Generation**: UUID (v13.0.0)

## Installation and Setup

To get started with the Manish Kejani Backend, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/jasper-nyambichu/manish-kejani-backend.git
    cd manish-kejani-backend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or yarn install
    ```

3.  **Set up environment variables**:
    Create a `.env` file in the root directory and add your database credentials, API keys, and other necessary environment variables:
    ```env
    PORT=5000
    NODE_ENV=development
    DATABASE_URL=your_database_connection_string
    JWT_SECRET=your_jwt_secret
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    RESEND_API_KEY=your_resend_api_key
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
    ```

4.  **Database Setup**:
    If using PostgreSQL, ensure your database is set up and the `schema.sql` (if present ) is applied. For MongoDB, ensure your connection string is correct.

5.  **Run the development server**:
    ```bash
    npm run dev
    # or yarn dev
    ```

    The server will start on the specified `PORT` (default: 5000).

## Project Structure

manish-kejani-backend/
├── src/
│   ├── config/
│   ├── controllers/
│   │   ├── admin/
│   │   └── public/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   │   ├── admin/
│   │   └── public/
│   ├── services/
│   ├── shared/
│   │   ├── constants/
│   │   └── utils/
│   └── server.js
├── Dockerfile
├── package.json
├── render.yaml
└── scripts/


## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

This project is licensed under the ISC License. See the `LICENSE` file for details. (Note: A `LICENSE` file was not found in the repository, please add one if applicable.)

## Contact

For any inquiries, please contact [jasper-nyambichu](https://github.com/jasper-nyambichu ).
