# Backend Development Guidelines

## Architecture Overview

This backend follows a **modular architecture** pattern with clear separation of concerns:

```
Module Structure
├── model.ts       → Database schema and interface
├── schema.ts      → Zod validation schemas
├── types.ts       → TypeScript interfaces (DTOs)
├── service.ts     → Business logic
├── controller.ts  → Route handlers
└── routes.ts      → Route definitions
```

## Module Pattern

### 1. **Model** (`*.model.ts`)

- Define Mongoose schema and TypeScript interface
- Add indexes for frequently queried fields
- Include timestamps

```typescript
const userSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: String,
}, { timestamps: true });
```

### 2. **Schema** (`*.schema.ts`)

- Define Zod validation schemas for request bodies
- Separate schemas for create and update operations

```typescript
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});
```

### 3. **Types** (`*.types.ts`)

- Define TypeScript DTOs (Data Transfer Objects)
- Response types for API responses
- Keep types focused and reusable

```typescript
export interface CreateUserDTO {
  email: string;
  name: string;
}
```

### 4. **Service** (`*.service.ts`)

- Contains all business logic
- Database queries and operations
- No request/response handling here

```typescript
export const createUser = async (data: CreateUserDTO) => {
  // Business logic
  return await User.create(data);
};
```

### 5. **Controller** (`*.controller.ts`)

- Handles HTTP requests/responses
- Calls service functions
- Returns formatted responses using `sendResponse`

```typescript
export const createUserHandler = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  sendResponse(res, 201, "User created", user);
});
```

### 6. **Routes** (`*.routes.ts`)

- Define HTTP routes
- Apply validation and authentication middleware
- Mount controllers

```typescript
router.post("/", validate(schema), createHandler);
router.get("/:id", protect, getHandler);
```

## Best Practices

### Error Handling

Always use `asyncHandler` wrapper and `AppError` for custom errors:

```typescript
export const handler = asyncHandler(async (req, res) => {
  const item = await service.get(id);
  if (!item) throw new AppError("Not found", 404);
  sendResponse(res, 200, "Success", item);
});
```

### Validation

Use Zod schemas consistently:

```typescript
router.post("/", validate(createSchema), handler);

export const createSchema = z.object({
  email: z.string().email(),
  price: z.number().positive(),
});
```

### Database Queries

- Always use indexes on frequently queried fields
- Use projections to exclude unnecessary fields
- Implement pagination for list endpoints

```typescript
export const getItems = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Model.find().skip(skip).limit(limit),
    Model.countDocuments(),
  ]);
  return { items, pagination: { total, page, limit } };
};
```

### Authentication

Protect routes using the `protect` middleware:

```typescript
router.get("/profile", protect, handler);
router.delete("/:id", protect, restrictTo("admin"), handler);
```

### Response Format

Always use `sendResponse` utility:

```typescript
sendResponse(res, statusCode, message, data);

// Response format
{
  success: true,
  statusCode: 200,
  message: "Operation successful",
  data: { /* payload */ }
}
```

## File Naming Conventions

- `snake_case` for file names
- `camelCase` for variables and functions
- `PascalCase` for classes and types

```
✅ product.model.ts
✅ user.controller.ts
❌ ProductModel.ts
❌ userController.ts
```

## Adding a New Module

### Step 1: Create directory structure

```bash
src/modules/new-module/
├── new-module.model.ts
├── new-module.schema.ts
├── new-module.types.ts
├── new-module.service.ts
├── new-module.controller.ts
└── new-module.routes.ts
```

### Step 2: Define Model and Interface

```typescript
// new-module.model.ts
export interface INewModule extends Document {
  name: string;
}

const schema = new Schema({ name: String }, { timestamps: true });
export const NewModule = mongoose.model("NewModule", schema);
```

### Step 3: Create Validation Schemas

```typescript
// new-module.schema.ts
export const createSchema = z.object({
  name: z.string().min(2),
});
```

### Step 4: Define Types

```typescript
// new-module.types.ts
export interface CreateNewModuleDTO {
  name: string;
}
```

### Step 5: Implement Service Logic

```typescript
// new-module.service.ts
export const create = async (data: CreateNewModuleDTO) => {
  return await NewModule.create(data);
};
```

### Step 6: Create Controllers

```typescript
// new-module.controller.ts
export const createHandler = asyncHandler(async (req, res) => {
  const item = await service.create(req.body);
  sendResponse(res, 201, "Created", item);
});
```

### Step 7: Set Up Routes

```typescript
// new-module.routes.ts
router.post("/", validate(createSchema), createHandler);
```

### Step 8: Register in Main Routes

```typescript
// routes/index.ts
import newModuleRoutes from "../modules/new-module/new-module.routes";
router.use("/new-module", newModuleRoutes);
```

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Other services
STRIPE_KEY=sk_test_...
PAYPAL_ID=...
```

## Testing

Use Postman or similar to test endpoints. Key testing checklist:

- ✅ Correct status codes (200, 201, 400, 404, 500)
- ✅ Proper error messages
- ✅ Validation working correctly
- ✅ Authentication working
- ✅ Pagination functioning
- ✅ Sorting/filtering working

## Performance Tips

1. **Use Indexes**: Always index fields used in queries

```typescript
schema.index({ email: 1 });
schema.index({ categoryId: 1, status: 1 });
```

2. **Lean Queries**: Use `.lean()` for read-only queries

```typescript
Product.find().lean(); // Faster, returns plain objects
```

3. **Select Fields**: Exclude unnecessary fields

```typescript
User.find().select("-password"); // Exclude password
```

4. **Batch Operations**: Use Promise.all for parallel queries

```typescript
const [users, products] = await Promise.all([
  User.find(),
  Product.find(),
]);
```

5. **Pagination**: Always paginate large datasets

```typescript
items.skip((page - 1) * limit).limit(limit);
```

## Debugging

- Use `console.log()` strategically during development
- Enable detailed error logging in error handler
- Use Postman for API testing
- Check MongoDB Atlas logs for database issues
- Verify JWT tokens in debugger

## Common Pitfalls to Avoid

❌ Mixing business logic in controllers
❌ Not validating input
❌ Forgetting to handle async errors
❌ Not using indexes on frequently queried fields
❌ Direct error responses without formatting
❌ Hardcoding values instead of environment variables
❌ Missing type definitions
❌ Not paginating list endpoints

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Zod Documentation](https://zod.dev/)
- [JWT.io](https://jwt.io/)

---

**Remember: Code consistency and clarity are key to maintainability!**
