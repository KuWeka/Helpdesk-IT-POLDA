# Helpdesk IT API Documentation

Tanggal dibuat: 2026-05-04

## Overview

The Helpdesk IT API is a comprehensive backend system for managing IT support tickets, technician assignments, and real-time communications. It provides RESTful endpoints with JWT authentication, role-based access control, and real-time updates via WebSockets.

**Base URL:** `https://api.helpdesk.com/api`  
**Current Version:** `1.0.0`  
**API Documentation:** `https://api.helpdesk.com/api/docs`

## Table of Contents

1. [Authentication](#authentication)
2. [API Response Format](#api-response-format)
3. [Authentication Endpoints](#authentication-endpoints)
4. [User Management](#user-management)
5. [Ticket Management](#ticket-management)
6. [Chat & Messaging](#chat--messaging)
7. [Technician Management](#technician-management)
8. [Dashboard](#dashboard)
9. [Health Checks](#health-checks)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)
12. [WebSocket Events](#websocket-events)

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Format

- **Access Token:** Expires in 24 hours
- **Refresh Token:** Expires in 7 days
- **Algorithm:** HS256

### Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all endpoints and management features |
| **Teknisi** | View assigned tickets, create chats, update ticket status |
| **User** | Create tickets, view own tickets, participate in chats |

## API Response Format

All API responses follow a standardized format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "meta": {
    "timestamp": "2026-04-17T10:30:00Z"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "message": "Data retrieved successfully",
  "meta": {
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 150,
      "totalPages": 8
    },
    "timestamp": "2026-04-17T10:30:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "meta": {
    "timestamp": "2026-04-17T10:30:00Z"
  }
}
```

## Authentication Endpoints

### Login

Register a user or authenticate with existing credentials.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "identifier": "teknisi@test.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "Teknisi Name",
      "email": "teknisi@test.com",
      "role": "Teknisi"
    }
  }
}
```

### Refresh Token

Refresh an expired access token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout

Invalidate the current session.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

## User Management

### Get User Profile

Retrieve the authenticated user's profile.

**Endpoint:** `GET /users/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+628123456789",
    "role": "User",
    "language": "ID",
    "theme": "light",
    "created_at": "2026-04-17T10:00:00Z"
  }
}
```

### Update User Profile

Update the authenticated user's profile.

**Endpoint:** `PUT /users/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "+628123456789",
  "language": "ID",
  "theme": "dark"
}
```

### Change Password

Change the user's password.

**Endpoint:** `POST /users/change-password`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### List All Users (Admin Only)

**Endpoint:** `GET /users?page=1&perPage=20&search=john`

**Query Parameters:**
- `page` (optional): Page number, default 1
- `perPage` (optional): Items per page, default 20
- `search` (optional): Search by name or email
- `role` (optional): Filter by role

### Delete User Account

**Endpoint:** `DELETE /users/{userId}`

**Headers:**
```
Authorization: Bearer <token>
```

## Ticket Management

### Create Ticket

Create a new support ticket.

**Endpoint:** `POST /tickets`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Laptop tidak bisa booting",
  "description": "Laptop tiba-tiba mati dan tidak bisa dinyalakan",
  "category": "Hardware",
  "urgency": "High",
  "attachments": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticket_number": "TKT-202604-0001",
    "title": "Laptop tidak bisa booting",
    "description": "Laptop tiba-tiba mati dan tidak bisa dinyalakan",
    "category": "Hardware",
    "urgency": "High",
    "status": "Open",
    "user_id": "uuid",
    "assigned_technician_id": null,
    "created_at": "2026-04-17T10:00:00Z",
    "updated_at": "2026-04-17T10:00:00Z"
  }
}
```

### Get Ticket Details

Retrieve details of a specific ticket.

**Endpoint:** `GET /tickets/{ticketId}`

**Headers:**
```
Authorization: Bearer <token>
```

### List User's Tickets

Get all tickets created by the authenticated user.

**Endpoint:** `GET /tickets/user/own?page=1&perPage=20&status=Open`

**Query Parameters:**
- `page` (optional): Page number
- `perPage` (optional): Items per page
- `status` (optional): Filter by status (Open, In Progress, Resolved, Closed)
- `urgency` (optional): Filter by urgency

### List All Tickets (Admin & Technician)

**Endpoint:** `GET /tickets?page=1&perPage=20&status=Open&technician=uuid`

**Query Parameters:**
- `page` (optional): Page number
- `perPage` (optional): Items per page
- `status` (optional): Filter by status
- `urgency` (optional): Filter by urgency
- `technician` (optional): Filter by assigned technician
- `category` (optional): Filter by category
- `search` (optional): Search in title and description

### Update Ticket Status

Update the status of a ticket.

**Endpoint:** `PATCH /tickets/{ticketId}/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "In Progress"
}
```

**Valid Statuses:** `Open`, `In Progress`, `Resolved`, `Closed`

### Assign Technician

Assign a technician to a ticket (Admin & Technician only).

**Endpoint:** `PATCH /tickets/{ticketId}/assign`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "technician_id": "uuid"
}
```

### Close Ticket

Close a ticket with a solution.

**Endpoint:** `POST /tickets/{ticketId}/close`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "solution": "Mengganti hard disk baru",
  "resolution_notes": "Masalah hardware berhasil diselesaikan"
}
```

## Chat & Messaging

### Create Chat Session

Create a new chat session for a ticket.

**Endpoint:** `POST /chats`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ticket_id": "uuid",
  "title": "Diskusi masalah laptop",
  "description": "Chat untuk diskusi solusi",
  "participant_ids": ["uuid1", "uuid2"]
}
```

### Get Chat Details

Retrieve chat session details.

**Endpoint:** `GET /chats/{chatId}`

**Headers:**
```
Authorization: Bearer <token>
```

### Get Chat Messages

Retrieve messages from a chat session.

**Endpoint:** `GET /chats/{chatId}/messages?page=1&limit=20`

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Messages per page

### Send Message

Send a message in a chat session.

**Endpoint:** `POST /chats/{chatId}/messages`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Baik, saya akan cek laptop Anda besok",
  "message_type": "text",
  "attachment_id": "uuid"
}
```

**Message Types:** `text`, `image`, `file`

### Update Message

Edit a sent message.

**Endpoint:** `PUT /messages/{messageId}`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

### Delete Message

Delete a message (only own messages).

**Endpoint:** `DELETE /messages/{messageId}`

**Headers:**
```
Authorization: Bearer <token>
```

### List User Chats

Get all chat sessions for the authenticated user.

**Endpoint:** `GET /chats?page=1&perPage=20`

**Query Parameters:**
- `page` (optional): Page number
- `perPage` (optional): Items per page
- `status` (optional): Filter by status (Active, Closed)

### Close Chat

Close a chat session.

**Endpoint:** `POST /chats/{chatId}/close`

**Headers:**
```
Authorization: Bearer <token>
```

## Technician Management

### Get All Technicians

List all available technicians.

**Endpoint:** `GET /technicians?page=1&perPage=20&status=active`

**Query Parameters:**
- `page` (optional): Page number
- `perPage` (optional): Items per page
- `status` (optional): Filter by status (active, inactive)
- `specialization` (optional): Filter by specialization

### Get Technician Profile

Retrieve a specific technician's profile.

**Endpoint:** `GET /technicians/{technicianId}`

**Headers:**
```
Authorization: Bearer <token>
```

### Get Technician Workload

Check a technician's current workload and assigned tickets.

**Endpoint:** `GET /technicians/{technicianId}/workload`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "technician_id": "uuid",
    "assigned_tickets": 5,
    "open_tickets": 3,
    "in_progress": 2,
    "resolved_count": 45,
    "avg_resolution_time": 4.5,
    "average_rating": 4.8
  }
}
```

### Update Technician Status (Admin Only)

Update a technician's availability status.

**Endpoint:** `PATCH /technicians/{technicianId}/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "available",
  "note": "Back from lunch"
}
```

## Dashboard

### Get Dashboard Statistics

Get overall dashboard statistics.

**Endpoint:** `GET /dashboard/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_tickets": 150,
    "open_tickets": 25,
    "in_progress": 12,
    "resolved_tickets": 110,
    "closed_tickets": 3,
    "total_technicians": 8,
    "active_technicians": 6,
    "avg_resolution_time": 4.2,
    "customer_satisfaction": 4.7
  }
}
```

### Get Ticket Statistics

Get ticket statistics for different time periods.

**Endpoint:** `GET /dashboard/tickets/stats?period=month`

**Query Parameters:**
- `period` (optional): time period (day, week, month, year), default month

### Get Technician Performance

Get technician performance metrics.

**Endpoint:** `GET /dashboard/technicians/performance?period=month`

**Query Parameters:**
- `period` (optional): time period (day, week, month, year), default month

### Get Recent Activity

Get recent system activity.

**Endpoint:** `GET /dashboard/activity?limit=20`

**Query Parameters:**
- `limit` (optional): Number of activity records, default 20

## File Management

### Upload File

Upload a file for ticket attachment or chat message.

**Endpoint:** `POST /uploads`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (required): File to upload
- `type` (optional): File type (ticket, message)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "screenshot.png",
    "url": "/uploads/uuid",
    "size": 245312,
    "mime_type": "image/png",
    "uploaded_at": "2026-04-17T10:00:00Z"
  }
}
```

### Download File

Download an uploaded file.

**Endpoint:** `GET /uploads/{fileId}`

**Headers:**
```
Authorization: Bearer <token>
```

## Health Checks

### Liveness Check

Check if the API is running.

**Endpoint:** `GET /health/live`

**Response:**
```json
{
  "status": "alive",
  "timestamp": "2026-04-17T10:00:00Z"
}
```

### Readiness Check

Check if all services are ready.

**Endpoint:** `GET /health/ready`

**Response:**
```json
{
  "status": "ready",
  "services": {
    "database": "connected",
    "redis": "connected",
    "socket": "connected"
  },
  "timestamp": "2026-04-17T10:00:00Z"
}
```

## Error Handling

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required or token invalid |
| 403 | Forbidden | Access denied - insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists or state conflict |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Response Example

```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-17T10:00:00Z"
  }
}
```

## Rate Limiting

The API implements rate limiting per IP address:

- **General Limit:** 100 requests per 15 minutes
- **Auth Endpoints:** 5 requests per 15 minutes
- **Upload Endpoints:** 10 requests per 15 minutes

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1713351000
```

## WebSocket Events

Connect to WebSocket for real-time updates:

**URL:** `wss://api.helpdesk.com`

### Client Events (Send)

#### Join Room
```javascript
socket.emit('join_room', { room: 'chat:chatId' });
socket.emit('join_room', { room: 'ticket:ticketId' });
socket.emit('join_room', { room: 'notifications' });
```

#### Send Message
```javascript
socket.emit('send_message', {
  chatId: 'uuid',
  content: 'Message content',
  messageType: 'text'
});
```

#### Update Ticket Status
```javascript
socket.emit('update_ticket_status', {
  ticketId: 'uuid',
  status: 'In Progress'
});
```

### Server Events (Receive)

#### New Message
```javascript
socket.on('message_received', {
  id: 'uuid',
  chatId: 'uuid',
  senderId: 'uuid',
  content: 'Message content',
  timestamp: '2026-04-17T10:00:00Z'
});
```

#### Ticket Updated
```javascript
socket.on('ticket_updated', {
  id: 'uuid',
  status: 'In Progress',
  updatedAt: '2026-04-17T10:00:00Z'
});
```

#### Notification
```javascript
socket.on('notification', {
  type: 'ticket_assigned',
  title: 'New Ticket Assigned',
  message: 'Ticket TKT-202604-0001 assigned to you',
  data: { ticketId: 'uuid' }
});
```

## API Versioning

The API supports versioning through the `X-API-Version` header:

```
X-API-Version: v1
```

Current version: `v1.0.0`

## Support & Documentation

- **Swagger UI:** Available at `/api/docs`
- **Status Page:** Available at `/api/health`
- **Support Email:** support@helpdesk.com
- **Documentation:** https://docs.helpdesk.com

## Changelog

### Version 1.0.0 (2026-04-17)
- Initial API release
- Complete ticket management system
- Real-time chat and messaging
- Technician assignment and workload management
- Dashboard with comprehensive statistics
- JWT authentication with role-based access control
- File upload and management
- WebSocket support for real-time updates