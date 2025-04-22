
-- RLS for profiles
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Similar policies for allergies, meal_plans, and nutrition_logs
CREATE POLICY "Users can manage own allergies" 
ON allergies FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own meal plans" 
ON meal_plans FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own nutrition logs" 
ON nutrition_logs FOR ALL 
USING (auth.uid() = user_id);
