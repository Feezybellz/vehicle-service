# Vehicle Service Reminder API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication using a JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Authentication Endpoints

### Sign Up

```http
POST /api/auth/signup
```

Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "your_password",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**

- Status: 201 Created
- Body: `{ "message": "User created successfully. Please check your email for verification." }`

### Verify Email

```http
GET /auth/verify-email?token=<verification_token>
```

Verify user's email address using the token sent to their email.

**Response:**

- Status: 200 OK
- Body: `{ "message": "Email verified successfully" }`

### Login

```http
POST /auth/login
```

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**

- Status: 200 OK
- Body:

```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## Vehicle Endpoints

### Get All Vehicles

```http
GET /vehicles
```

Retrieve all vehicles for the authenticated user.

**Response:**

- Status: 200 OK
- Body: Array of vehicle objects

### Get Single Vehicle

```http
GET /vehicles/:id
```

Retrieve a specific vehicle by ID.

**Response:**

- Status: 200 OK
- Body: Vehicle object

### Create Vehicle

```http
POST /vehicles
```

Create a new vehicle.

**Request Body:**

```json
{
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "licensePlate": "ABC123"
}
```

**Response:**

- Status: 201 Created
- Body: Created vehicle object

### Update Vehicle

```http
PUT /vehicles/:id
```

Update an existing vehicle.

**Request Body:**

```json
{
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "licensePlate": "ABC123"
}
```

**Response:**

- Status: 200 OK
- Body: Updated vehicle object

### Delete Vehicle

```http
DELETE /vehicles/:id
```

Delete a vehicle.

**Response:**

- Status: 200 OK
- Body: `{ "message": "Vehicle deleted successfully" }`

## Service Reminder Endpoints

### Get All Service Reminders

```http
GET /service-reminders
```

Retrieve all service reminders for the authenticated user.

**Response:**

- Status: 200 OK
- Body: Array of service reminder objects with populated vehicle information

### Get Single Service Reminder

```http
GET /service-reminders/:id
```

Retrieve a specific service reminder by ID.

**Response:**

- Status: 200 OK
- Body: Service reminder object with populated vehicle information

### Create Service Reminder

```http
POST /service-reminders
```

Create a new service reminder.

**Request Body:**

```json
{
  "vehicle": "vehicle_id",
  "title": "Oil Change",
  "description": "Regular oil change",
  "dueDate": "2024-04-01",
  "reminderType": "maintenance"
}
```

**Response:**

- Status: 201 Created
- Body: Created service reminder object

### Update Service Reminder

```http
PUT /service-reminders/:id
```

Update an existing service reminder.

**Request Body:**

```json
{
  "title": "Oil Change",
  "description": "Regular oil change",
  "dueDate": "2024-04-01",
  "reminderType": "maintenance"
}
```

**Response:**

- Status: 200 OK
- Body: Updated service reminder object

### Mark Service Reminder as Completed

```http
PATCH /service-reminders/:id/complete
```

Mark a service reminder as completed.

**Response:**

- Status: 200 OK
- Body: Updated service reminder object with completed status

### Delete Service Reminder

```http
DELETE /service-reminders/:id
```

Delete a service reminder.

**Response:**

- Status: 200 OK
- Body: `{ "message": "Service reminder deleted successfully" }`

## Error Responses

All endpoints may return the following error responses:

- 400 Bad Request: Invalid input data
- 401 Unauthorized: Invalid or missing authentication token
- 404 Not Found: Requested resource not found
- 500 Internal Server Error: Server-side error

Error responses include a message explaining the error:

```json
{
  "message": "Error description"
}
```
