import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SoTayHomeScreen from './SoTayHomeScreen';

// Exercises
import ExerciseCategoriesScreen from './Exercises/ExerciseCategoriesScreen';
import ExerciseListScreen from './Exercises/ExerciseListScreen';
import ExerciseDetailScreen from './Exercises/ExerciseDetailScreen';

// Nutrition
import NutritionCategoriesScreen from './Nutrition/NutritionCategoriesScreen';
import NutritionProductListScreen from './Nutrition/NutritionProductListScreen';
import NutritionDetailScreen from './Nutrition/NutritionDetailScreen';

// Food & Calories
import FoodCategoriesScreen from './Food/FoodCategoriesScreen';
import FoodListScreen from './Food/FoodListScreen';
import FoodDetailScreen from './Food/FoodDetailScreen';

// Encyclopedia
import EncyclopediaListScreen from './Encyclopedia/EncyclopediaListScreen';
import EncyclopediaDetailScreen from './Encyclopedia/EncyclopediaDetailScreen';

const Stack = createNativeStackNavigator();

const SoTayStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SoTayHome" component={SoTayHomeScreen} />
      
      {/* Exercises */}
      <Stack.Screen name="ExerciseCategories" component={ExerciseCategoriesScreen} />
      <Stack.Screen name="ExerciseList" component={ExerciseListScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />

      {/* Nutrition */}
      <Stack.Screen name="NutritionCategories" component={NutritionCategoriesScreen} />
      <Stack.Screen name="NutritionProductList" component={NutritionProductListScreen} />
      <Stack.Screen name="NutritionDetail" component={NutritionDetailScreen} />

      {/* Food */}
      <Stack.Screen name="FoodCategories" component={FoodCategoriesScreen} />
      <Stack.Screen name="FoodList" component={FoodListScreen} />
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />

      {/* Encyclopedia */}
      <Stack.Screen name="EncyclopediaList" component={EncyclopediaListScreen} />
      <Stack.Screen name="EncyclopediaDetail" component={EncyclopediaDetailScreen} />
    </Stack.Navigator>
  );
};

export default SoTayStack;
