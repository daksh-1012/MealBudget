# 🍽️ MealBudget

### Eat Better. Spend Smarter.

**MealBudget** is a budget-aware meal planning application that helps users plan meals, manage pantry inventory, discover affordable recipes, and control their food expenses — all in one place.

Built with the **MERN stack**, MealBudget combines meal planning, ingredient tracking, budget management, and explainable recipe recommendations to help users make smarter food decisions without exceeding their budget.

---

## ✨ Features

### 📊 Smart Dashboard
- Get an overview of your weekly food budget.
- Track expenses and estimated remaining budget.
- Monitor pantry inventory and meal planning activity.
- View useful insights into your food spending.

### 🥗 Intelligent Recipe Recommendations
- Discover recipes based on your available pantry ingredients.
- Find affordable meals that fit your budget.
- View pantry match percentages.
- Understand additional ingredient requirements and estimated purchase costs.
- Get explainable, rule-based recommendations.

### 🧺 Pantry Management
- Maintain an inventory of available ingredients.
- Track ingredient quantities and units.
- Add, update, and remove pantry items.
- Load a sample pantry to explore the application.

### 📅 Weekly Meal Planner
- Organize meals across a Monday–Sunday schedule.
- Plan meals across different time slots.
- Evaluate your weekly plan against your available pantry.
- Avoid counting the same ingredient purchase multiple times.

### 💰 Budget & Expense Tracking
- Set and manage your weekly food budget.
- Record food-related expenses.
- Monitor estimated expenditure.
- Track how much of your budget remains available.

### 🛒 Smart Shopping List
- Generate shopping lists based on your meal plan.
- Identify ingredients missing from your pantry.
- Track purchased items.
- Automatically update pantry inventory and expenses when items are marked as purchased.

### 📈 Analytics & Insights
- Visualize food expenditure.
- Explore budget utilization.
- Understand spending patterns through interactive charts.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React 18, Vite |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT, bcryptjs |
| Validation | Express Validator |
| Security | Helmet, Express Rate Limit |
| Deployment | Vercel, Render |

---

## 🏗️ Architecture

MealBudget follows a client-server architecture.

```text
                ┌──────────────────────┐
                │      React UI        │
                │   React + Vite       │
                └──────────┬───────────┘
                           │
                      Axios / REST
                           │
                ┌──────────▼───────────┐
                │    Express API       │
                │      Node.js         │
                └──────────┬───────────┘
                           │
                ┌──────────▼───────────┐
                │     Mongoose         │
                │  Data Management     │
                └──────────┬───────────┘
                           │
                ┌──────────▼───────────┐
                │    MongoDB Atlas     │
                │      Database       │
                └──────────────────────┘
```

The backend exposes REST API endpoints, while the frontend communicates with the backend using Axios.

Authentication is handled using JSON Web Tokens, with passwords securely hashed using bcryptjs.

---

## 📁 Project Structure

```text
MealBudget/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

Follow these instructions to run MealBudget locally.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (18.11 or newer)
- npm
- [MongoDB Atlas](https://www.mongodb.com/atlas) account
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/MealBudget.git
cd MealBudget
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, you can alternatively use:

```powershell
Copy-Item .env.example .env
```

Configure the following variables in `backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
```

Start the development server:

```bash
npm run dev
```

The backend will run at:

`http://localhost:5000`

Health check:

`http://localhost:5000/api/health`

**Note:** On the first successful backend startup, the application automatically seeds 11 built-in Indian recipes.

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will run at:

`http://localhost:5173`

The Vite development server proxies `/api` requests to the local Express backend.

### 4. Explore MealBudget

1. Open the frontend in your browser.
2. Register a new account.
3. Navigate to **Pantry**.
4. Select **Load sample pantry**.
5. Explore the recipe recommendations.
6. Create a weekly meal plan.
7. Generate your shopping list.
8. Track your expenses and budget.

---

## 🌐 Deployment

MealBudget is designed to be deployed using:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

### Backend — Render

Create a new Render Web Service and configure:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |

Configure these environment variables:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_production_secret
CLIENT_URL=https://your-vercel-domain.vercel.app
```

### Frontend — Vercel

Import your GitHub repository into Vercel.

Configure:

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Add the following environment variable:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

Replace the example URLs with your actual deployment URLs.

---

## 🧪 Testing

### Backend Unit Tests

Run the engine tests:

```bash
cd backend
npm test
```

### Backend Integration Tests

The integration tests require a separate MongoDB test database.

Configure `TEST_MONGO_URI` and run:

```bash
npm run test:e2e
```

**Warning:** The end-to-end test suite drops its configured test database. Never point `TEST_MONGO_URI` at your production database.

### Frontend Production Build

```bash
cd frontend
npm run build
```

---

## 🧠 How the Recommendation Engine Works

MealBudget uses a rule-based recommendation engine rather than relying on an AI model.

Recipes are evaluated using factors such as:

1. Affordability.
2. Pantry ingredient availability.
3. Additional ingredient purchase requirements.
4. Estimated total cost.

Recommendations are prioritized using these factors, making the results explainable and predictable.

### Budget Calculation

Money is stored internally as integer paise, while the interface displays amounts in Indian Rupees.

The estimated expenditure is calculated as:

**Estimated Expenditure = Recorded Expenses + Remaining Purchase Estimate**

The weekly planning engine also simulates ingredient availability from Monday through Sunday to avoid counting the same ingredient purchase multiple times.

---

## ⚠️ Current Limitations

- Recipe cards display an emoji by default unless an image URL is provided.
- Cooking a planned meal does not automatically deduct pantry stock.
- The shopping list needs to be synchronized with the meal plan using **Sync with plan**.
- Built-in recipes are read-only; users can manage their own recipes.

---

## 🔮 Future Improvements

Potential areas for further development include:

- AI-assisted meal suggestions.
- Nutritional information and dietary preferences.
- More advanced ingredient substitution.
- Recipe image integration.
- Improved spending predictions.
- Enhanced meal planning personalization.
- Mobile-friendly experience improvements.

---

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

If you'd like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Submit a pull request.

---

## 📄 License

This project currently does not specify a license. All rights are reserved unless a license is added to the repository.

---

<p align="center">
  **MealBudget — Eat Better. Spend Smarter.** 🍽️
</p>

<p align="center">
  Built with ❤️ using the MERN Stack.
</p>