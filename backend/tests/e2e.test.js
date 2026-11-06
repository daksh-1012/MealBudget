// Integration test: npm run test:e2e   (needs TEST_MONGO_URI, e.g. mongodb://127.0.0.1:27017/mealbudget_test)
// It DROPS the target database, so the database name must end with "_test".
const uri = process.env.TEST_MONGO_URI;
if (!uri || !/_test(\?|$)/.test(uri)) { console.error('Set TEST_MONGO_URI to a database whose name ends with _test'); process.exit(1); }
process.env.MONGO_URI = uri; process.env.JWT_SECRET = 'test-secret';
const connectDB=require('../config/db');
const seed=require('../utils/seed/seedRecipes');
const app=require('../server');
const assert=require('assert');
(async()=>{
  await connectDB(); await require('mongoose').connection.dropDatabase(); await seed();
  const s=app.listen(0); const base='http://127.0.0.1:'+s.address().port+'/api';
  let token='';
  const call=async(m,p,b)=>{const r=await fetch(base+p,{method:m,headers:{'content-type':'application/json',...(token&&{authorization:'Bearer '+token})},body:b&&JSON.stringify(b)});const j=await r.json();return {status:r.status,...j};};
  const ok=(r,st=200)=>{assert.strictEqual(r.status,st,JSON.stringify(r).slice(0,300));return r.data;};
  const week='2026-11-02';
  let r=await call('POST','/auth/register',{name:'Asha',email:'Asha@Test.com',password:'password123'}); token=ok(r,201).token;
  assert.strictEqual((await call('POST','/auth/register',{name:'x',email:'asha@test.com',password:'password123'})).status,409);
  assert.strictEqual((await call('POST','/auth/login',{email:'asha@test.com',password:'wrongpass'})).status,401);
  ok(await call('POST','/auth/login',{email:'asha@test.com',password:'password123'}));
  // user 2 for isolation
  const t1=token; r=await call('POST','/auth/register',{name:'Bo',email:'bo@test.com',password:'password123'}); const t2=ok(r,201).token;
  // pantry
  token=t1; assert.strictEqual(ok(await call('POST','/pantry/starter'),201).added>0,true);
  let pantry=ok(await call('GET','/pantry')); assert.strictEqual(pantry.length,14);
  assert.strictEqual(ok(await call('GET','/pantry?q=rice')).length,1);
  assert.strictEqual((await call('POST','/pantry',{name:'rice',quantity:1,unit:'kg'})).status,409);
  const rice=pantry.find(i=>i.name==='Rice');
  ok(await call('PUT','/pantry/'+rice._id,{...rice,quantity:3}));
  token=t2; assert.strictEqual(ok(await call('GET','/pantry')).length,0);
  assert.strictEqual((await call('DELETE','/pantry/'+rice._id)).status,404,'isolation');
  token=t1;
  // recipes + recommendations
  const recipes=ok(await call('GET','/recipes')); assert.strictEqual(recipes.length,11);
  const rec=ok(await call('GET','/recommendations?weekStart='+week)); assert.strictEqual(rec.results.length,11);
  console.log('Top 3:',rec.results.slice(0,3).map(x=>`${x.recipe.name} ${x.matchPercent}% +₹${x.additionalCost/100}`));
  // custom recipe
  const mine=ok(await call('POST','/recipes',{name:'My Rice',mealCategory:'Lunch',prepTime:10,servings:1,ingredients:[{name:'Rice',quantity:100,unit:'g',unitPrice:6}]}),201);
  assert.strictEqual((await call('PUT','/recipes/'+recipes[0]._id,{name:'hack',mealCategory:'Lunch',prepTime:1,servings:1,ingredients:[{name:'a',quantity:1,unit:'g'}]})).status,404,'builtin read-only');
  // budget
  ok(await call('PUT','/budget',{weekStart:week,amount:150000}));
  // plan
  const by=n=>recipes.find(x=>x.name===n)._id;
  let plan=ok(await call('PUT','/mealplan/entry',{weekStart:week,day:0,slot:'lunch',recipeId:by('Dal Rice')}));
  plan=ok(await call('PUT','/mealplan/entry',{weekStart:week,day:0,slot:'dinner',recipeId:by('Egg Fried Rice')}));
  plan=ok(await call('PUT','/mealplan/entry',{weekStart:week,day:1,slot:'lunch',recipeId:by('Chickpea Curry')}));
  assert.strictEqual((await call('PUT','/mealplan/entry',{weekStart:week,day:0,slot:'dinner',recipeId:by('Dal Rice')})).status,409,'same recipe same day');
  plan=ok(await call('PUT','/mealplan/entry',{weekStart:week,day:0,slot:'dinner',recipeId:by('Egg Curry')})); // replace
  assert.strictEqual(plan.entries.length,3);
  console.log('Totals:',JSON.stringify(plan.totals));
  assert.strictEqual(plan.totals.committed,plan.totals.toBuy);
  // shopping
  let shop=ok(await call('GET','/shopping?weekStart='+week)); assert.ok(shop.items.length>0);
  console.log('Shopping:',shop.items.map(i=>`${i.name} ${i.quantity}${i.unit}`).join(', '),'=>',shop.totals.estimated/100);
  const item=shop.items[0];
  shop=ok(await call('PATCH','/shopping/items/'+item._id,{weekStart:week,purchased:true}));
  let b=ok(await call('GET','/budget?weekStart='+week)); assert.strictEqual(b.expenses.length,1);
  assert.strictEqual(b.summary.totals.spent,item.estCost);
  const afterBuy=b.summary.totals.committed; assert.ok(Math.abs(afterBuy-plan.totals.committed)<=2,'buying should not change committed: '+afterBuy+' vs '+plan.totals.committed);
  shop=ok(await call('POST','/shopping/sync',{weekStart:week})); assert.ok(shop.items.some(i=>i.purchased));
  assert.ok(!shop.items.some(i=>!i.purchased&&i.name===item.name),'bought item no longer needed');
  shop=ok(await call('PATCH','/shopping/items/'+shop.items.find(i=>i.purchased)._id,{weekStart:week,purchased:false}));
  assert.strictEqual(ok(await call('GET','/budget?weekStart='+week)).expenses.length,0);
  // expenses
  b=ok(await call('POST','/budget/expenses',{weekStart:week,amount:25000,description:'Market'}),201); const ex=b.expenses[0];
  ok(await call('DELETE','/budget/expenses/'+ex._id));
  assert.strictEqual((await call('POST','/budget/expenses',{weekStart:week,amount:0,description:'x'})).status,400);
  // dashboard & analytics
  const dash=ok(await call('GET','/dashboard?date=2026-11-05')); console.log('Dashboard keys:',Object.keys(dash).join(','),'upcoming',dash.upcoming.length,'activity',dash.activity.length);
  const an=ok(await call('GET','/analytics?date=2026-11-05')); console.log('Analytics top:',an.topIngredients.slice(0,3),'pantry',an.pantry);
  ok(await call('DELETE','/mealplan/entry?weekStart='+week+'&day=0&slot=lunch'));
  ok(await call('DELETE','/mealplan?weekStart='+week));
  console.log('E2E PASSED'); s.close(); process.exit(0);
})().catch(e=>{console.error('E2E FAIL',e.message);process.exit(1)});
