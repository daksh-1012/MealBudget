# MealBudget

Budget-aware meal planner (MERN). Plan a week of meals against a rupee budget, see which recipes your pantry already covers, and generate a shopping list for only what is missing.

**Stack:** React 18 + Vite + Tailwind CSS 3 + React Router + Axios + Recharts + Lucide | Node + Express + Mongoose | MongoDB Atlas | JWT + bcryptjs

## 1. Prerequisites
- Node.js 18.11 or newer
- A MongoDB Atlas cluster (free M0 is fine). In Atlas: create a database user, allow your IP under *Network Access*, then copy the connection string (*Connect > Drivers*).

## 2. Run the backend
```bash
cd backend
npm install
cp .env.example .env      # then edit .env: set MONGO_URI and a long random JWT_SECRET
npm run dev               # http://localhost:5000  (health check: /api/health)
```
On first start the 11 built-in Indian recipes are seeded automatically. `npm run seed` resets them.

## 3. Run the frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173  (proxies /api to localhost:5000)
```
Register an account, open **Pantry** and click **Load sample pantry**, then try **Recommendations**.

For a production build: `npm run build`, and set `VITE_API_URL` (see `frontend/.env.example`) and the backend `CLIENT_URL` to your deployed origins.

## 4. Tests
```bash
cd backend
npm test                                                     # engine unit tests, no database
TEST_MONGO_URI=mongodb://127.0.0.1:27017/mealbudget_test npm run test:e2e   # full API flow, drops that _test database
```

## 5. How the numbers work
- Money is stored as integer **paise**; the UI shows rupees. All costs are *estimates* from editable prices.
- Units are normalised (g, kg, ml, l, tbsp, tsp, pcs). A pantry item only counts if its unit type matches (kg never satisfies "pcs").
- **Pantry match %** = ingredients you have in sufficient quantity / total ingredients x 100.
- **Recommendations** are rule-based and explainable (not AI): affordable first, then higher match, then lower extra purchase cost, then lower total cost.
- **Weekly plan** is walked Monday to Sunday against a virtual copy of your pantry, so an ingredient is never charged twice and the shopping list totals add up across meals.
- **Estimated expenditure** = recorded expenses + still-to-buy estimate. Remaining budget = budget - that.
- Marking a shopping item **purchased** adds it to your pantry and records an expense; un-marking reverses both.

## 6. Structure
```
backend/   config/ controllers/ middleware/ models/ routes/ services/ utils/ tests/ server.js
frontend/  src/{components,pages,layouts,context,hooks,services,utils}
```
Business logic lives in `backend/services/engine.js` (pure functions) and the other services.

## 7. Known limitations
- Recipe cards use an emoji tile by default; paste an image URL when adding a recipe to show a photo.
- Cooking a planned meal does not automatically deduct pantry stock.
- The shopping list is recalculated with **Sync with plan** (it does not update live as you edit the plan).
- Built-in recipes are read-only; users can create, edit and delete their own.
