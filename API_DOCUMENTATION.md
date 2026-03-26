# E-Commerce Backend API Documentation

Production-ready e-commerce backend built with Node.js, Express, TypeScript, and MongoDB.

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Project Structure](#project-structure)

## 🚀 Installation

```bash
npm install
```

### Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **zod**: Schema validation
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **dotenv**: Environment variables
- **cors**: Cross-Origin Resource Sharing

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

## ▶️ Running the Server

### Development Mode

```bash
npm run dev
```

Server will start on `http://localhost:5000`

## 📡 API Endpoints

### Base URL

```
http://localhost:5000/api
```

---

## 🔐 Authentication

### Register User

**POST** `/auth/register`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "phone": "1234567890"
}
```

**Response (201)**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

### Login User

**POST** `/auth/login`

```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Response (200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token_here"
  }
}
```

### Get User Profile

**GET** `/auth/me`

**Headers**

```
Authorization: Bearer <token>
```

**Response (200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User profile fetched",
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Update User Profile

**PUT** `/auth/profile`

**Headers**

```
Authorization: Bearer <token>
```

**Body**

```json
{
  "name": "Jane Doe",
  "phone": "9876543210",
  "avatar": "https://example.com/avatar.jpg"
}
```

---

## 📦 Products

### Get All Products

**GET** `/products?page=1&limit=10&isFeatured=false`

**Query Parameters**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `isFeatured` (optional): Filter featured products (true/false)

**Response (200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products fetched successfully",
  "data": {
    "products": [ /* product array */ ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

### Get Single Product

**GET** `/products/:id`

**Response (200)**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product fetched successfully",
  "data": {
    "_id": "product_id",
    "name": "Product Name",
    "slug": "product-name",
    "description": "Product description",
    "price": 99.99,
    "stock": 50,
    "category": "Electronics",
    "images": ["url1", "url2"],
    "isFeatured": true
  }
}
```

### Get Featured Products

**GET** `/products/featured`

### Search Products

**GET** `/products/search?q=search_term`

### Create Product (Admin Only)

**POST** `/products`

**Headers**

```
Authorization: Bearer <admin_token>
```

**Body**

```json
{
  "name": "New Product",
  "description": "Product description here",
  "price": 99.99,
  "discountPrice": 79.99,
  "category": "electronics",
  "brand": "BrandName",
  "stock": 50,
  "images": ["url1", "url2"],
  "isFeatured": false,
  "isPublished": true
}
```

### Update Product (Admin Only)

**PUT** `/products/:id`

**Headers**

```
Authorization: Bearer <admin_token>
```

### Delete Product (Admin Only)

**DELETE** `/products/:id`

**Headers**

```
Authorization: Bearer <admin_token>
```

---

## 🏷️ Categories

### Get All Categories

**GET** `/categories`

### Get Single Category

**GET** `/categories/:id`

### Get Category by Slug

**GET** `/categories/slug/:slug`

### Create Category (Admin Only)

**POST** `/categories`

**Headers**

```
Authorization: Bearer <admin_token>
```

**Body**

```json
{
  "name": "Electronics",
  "description": "Electronic products",
  "image": "https://example.com/image.jpg",
  "isActive": true
}
```

### Update Category (Admin Only)

**PUT** `/categories/:id`

### Delete Category (Admin Only)

**DELETE** `/categories/:id`

---

## 🛒 Cart

### Get User Cart

**GET** `/cart`

**Headers**

```
Authorization: Bearer <token>
```

### Add to Cart

**POST** `/cart`

**Headers**

```
Authorization: Bearer <token>
```

**Body**

```json
{
  "productId": "product_id",
  "quantity": 2,
  "price": 99.99
}
```

### Update Cart Item

**PUT** `/cart/:productId`

**Body**

```json
{
  "quantity": 5
}
```

### Remove from Cart

**DELETE** `/cart/:productId`

### Clear Cart

**DELETE** `/cart`

---

## 📋 Orders

### Create Order

**POST** `/orders`

**Headers**

```
Authorization: Bearer <token>
```

**Body**

```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "card",
  "notes": "Please deliver in the morning"
}
```

### Get User Orders

**GET** `/orders/my-orders?page=1&limit=10`

**Headers**

```
Authorization: Bearer <token>
```

### Get Single Order

**GET** `/orders/:id`

**Headers**

```
Authorization: Bearer <token>
```

### Get All Orders (Admin Only)

**GET** `/orders?page=1&limit=10`

**Headers**

```
Authorization: Bearer <admin_token>
```

### Update Order Status (Admin Only)

**PUT** `/orders/:id/status`

**Headers**

```
Authorization: Bearer <admin_token>
```

**Body**

```json
{
  "status": "shipped"
}
```

**Status Options**: `pending`, `processing`, `shipped`, `delivered`, `cancelled`

### Delete Order (Admin Only)

**DELETE** `/orders/:id`

---

## 📁 Project Structure

```
src/
├── app.ts                 # Express app setup
├── server.ts              # Server entry point
├── config/
│   ├── db.ts              # MongoDB connection
│   ├── env.ts             # Environment variables
│   └── jwt.ts             # JWT utilities
├── middlewares/
│   ├── auth.ts            # JWT authentication
│   ├── errorHandler.ts    # Global error handler
│   └── validate.ts        # Zod validation
├── modules/
│   ├── product/
│   │   ├── product.model.ts
│   │   ├── product.schema.ts
│   │   ├── product.service.ts
│   │   ├── product.controller.ts
│   │   ├── product.types.ts
│   │   └── product.routes.ts
│   ├── category/
│   ├── user/
│   ├── auth/
│   ├── cart/
│   └── order/
├── routes/
│   └── index.ts           # Main routes
└── utils/
    ├── AppError.ts        # Custom error class
    ├── asyncHandler.ts    # Async error wrapper
    └── response.ts        # Response formatter
```

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Password hashing with bcryptjs
- ✅ Input validation with Zod
- ✅ CORS enabled
- ✅ Error handling middleware
- ✅ Role-based access control (user/admin)

## 📝 Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "statusCode": 200|201|400|404|500,
  "message": "Response message",
  "data": {}  // Optional, only on successful responses
}
```

## 🚨 Error Handling

Error responses include detailed validation errors:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation Error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

## 📚 Next Steps

1. Set up frontend to connect to these APIs
2. Implement payment gateway integration (Stripe/PayPal)
3. Add email verification for users
4. Add product reviews and ratings
5. Add admin dashboard features
6. Implement wishlist feature

---

**Built with ❤️ using Node.js, Express, and MongoDB**
