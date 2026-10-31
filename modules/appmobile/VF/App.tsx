import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { Alert, Animated, View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import Ionicons from "react-native-vector-icons/Ionicons";
import { notificationEmitter } from "./src/general/notification";
import MemberHome from "./src/page/member/MemberHome";
import WorkoutPlanScreen from "./src/page/member/WorkoutPlanScreen";
import Homepage from "./src/page/trainners/HomePage";
import AuthScreen from "./src/page/member/AuthScreen";
import Login from "./src/page/login";
import PhongTap from "./src/page/member/PhongTap";
import TrainerAuthScreen from "./src/page/trainners/TrainerAuthScreen";
import Dashboard from "./src/page/trainners/Dashboard";
import Income from "./src/page/trainners/Income";
import MemberDetail from "./src/page/trainners/MemberDetail";
import Profile from "./src/page/trainners/Profile";
import Schedule from "./src/page/trainners/Schedule";
import SessionHistory from "./src/page/trainners/SessionHistory";
import SessionReview from "./src/page/trainners/SessionReview";
import Members from "./src/page/trainners/Members";
import TrainerFeed from "./src/page/trainners/TrainerFeed";
import SportFeed from "./src/page/member/SportFeed";
import headerPage from "./src/page/member/TrainingPlan/Header/page";
import DashboardScreen from "./src/page/member/TrainingPlan/Tab/DashboardScreen";
import DietScreen from "./src/page/member/TrainingPlan/Tab/DietScreen";
import WorkoutPlan from "./src/page/member/WorkoutPlan";



import WorkoutUnPlan from "./src/page/member/WorkoutUnPlan";
import WorkoutLocationScreen from "./src/page/member/WorkoutLocationScreen";
import ChatList from "./src/page/chat/ChatList";
import ChatRoom from "./src/page/chat/ChatRoom";
import WorkoutDifficultyScreen from "./src/page/member/WorkoutDifficultyScreen";
import WorkoutProgramDetailScreen from "./src/page/member/WorkoutProgramDetailScreen";
import DietDetail from "./src/page/member/TrainingPlan/Tab/DietDetailScreen";
import MemberProfile from "./src/page/member/MemberProfile";
// So Tay Module Screens
import SoTayHomeScreen from "./src/page/member/SoTay/SoTayHomeScreen";
import ExerciseCategoriesScreen from "./src/page/member/SoTay/Exercises/ExerciseCategoriesScreen";
import ExerciseListScreen from "./src/page/member/SoTay/Exercises/ExerciseListScreen";
import NutritionCategoriesScreen from "./src/page/member/SoTay/Nutrition/NutritionCategoriesScreen";
import NutritionProductListScreen from "./src/page/member/SoTay/Nutrition/NutritionProductListScreen";
import NutritionDetailScreen from "./src/page/member/SoTay/Nutrition/NutritionDetailScreen";
import FoodCategoriesScreen from "./src/page/member/SoTay/Food/FoodCategoriesScreen";
import FoodListScreen from "./src/page/member/SoTay/Food/FoodListScreen";
import FoodDetailScreen from "./src/page/member/SoTay/Food/FoodDetailScreen";
import EncyclopediaListScreen from "./src/page/member/SoTay/Encyclopedia/EncyclopediaListScreen";
import EncyclopediaDetailScreen from "./src/page/member/SoTay/Encyclopedia/EncyclopediaDetailScreen";


import ExercisePage from "./src/page/member/TrainingPlan/Tab/ExercisePage";
import ReportPage from "./src/page/member/TrainingPlan/Tab/ReportPage";
import WorkoutExercisePlan from "./src/page/member/TrainingPlan/Tab/WorkoutExercisePlan";
import ResultPage from "./src/page/member/ResultPage";
import Onloading from "./src/page/on_loading";
import OnboardingScreen from "./src/page/screens/OnboardingScreen";
import OnboardingScreen1 from "./src/page/screens/OnboardingScreen1";
import OnboardingScreen2 from "./src/page/screens/OnboardingScreen2";
import OnboardingScreen3 from "./src/page/screens/OnboardingScreen3";
import ExerciseDetailScreen from "./src/page/member/TrainingPlan/Tab/ExerciseDetailScreen";
import AiConsultationScreen from "./src/page/member/AiConsultationScreen";
import PTListScreen from "./src/page/member/PTListScreen";
import WorkoutSelectionScreen from "./src/page/member/WorkoutSelectionScreen";
import RegistrationReviewScreen from "./src/page/member/RegistrationReviewScreen";
import PaymentScreen from "./src/page/member/PaymentScreen";
import RegistrationSuccessScreen from "./src/page/member/RegistrationSuccessScreen";
import MyPackagesScreen from "./src/page/member/MyPackagesScreen";
import MyPackageDetailScreen from "./src/page/member/MyPackageDetailScreen";



const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();

const MemberWorkoutStack = createNativeStackNavigator();

function MemberWorkoutNavigator() {
  return (
    <MemberWorkoutStack.Navigator initialRouteName="WorkoutPlanScreen" screenOptions={{ headerShown: false }}>

      <MemberWorkoutStack.Screen name="WorkoutPlanScreen" component={WorkoutPlanScreen} />
      <MemberWorkoutStack.Screen name="AiConsultationScreen" component={AiConsultationScreen} />

      <MemberWorkoutStack.Screen name="WorkoutUnPlan" component={WorkoutUnPlan} />

      <MemberWorkoutStack.Screen name="WorkoutPlan" component={WorkoutPlan} />

      <MemberWorkoutStack.Screen name="WorkoutLocationScreen" component={WorkoutLocationScreen}/>

      <MemberWorkoutStack.Screen name="WorkoutDifficultyScreen" component={WorkoutDifficultyScreen} />

      <MemberWorkoutStack.Screen name="WorkoutProgramDetailScreen" component={WorkoutProgramDetailScreen} />
      <MemberWorkoutStack.Screen name="PhongTap" component={PhongTap} />


      <MemberWorkoutStack.Screen name="headerPage" component={headerPage}/>
      <MemberWorkoutStack.Screen name="DashboardScreen" component={DashboardScreen} />
      <MemberWorkoutStack.Screen name="DietScreen" component={DietScreen} />
      <MemberWorkoutStack.Screen name="DietDetail" component={DietDetail} />
      <MemberWorkoutStack.Screen name="ExercisePage" component={ExercisePage}/>
      <MemberWorkoutStack.Screen name="ReportPage" component={ReportPage}/>
      <MemberWorkoutStack.Screen name="WorkoutExercisePlan" component={WorkoutExercisePlan} />
      <MemberWorkoutStack.Screen name="ResultPage" component={ResultPage}/>
      <MemberWorkoutStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />




    </MemberWorkoutStack.Navigator>
  );
}



function AnimatIcon({ name_icon, focused, color, size }: { name_icon: string; focused: boolean; color: string; size: number }) {
  const scaleIcon = new Animated.Value(focused ? 1.2 : 1);
  React.useEffect(() => {
    Animated.spring(scaleIcon, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
    }).start();
  }, [focused]);
  return (
    <Animated.View style={{ transform: [{ scale: scaleIcon }] }}>
      <Ionicons name={name_icon} size={size} color={color} />
    </Animated.View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let name_icon = "";
          if (route.name === "Home") name_icon = focused ? "home" : "home-outline";
          else if (route.name === "Feed") name_icon = focused ? "albums-sharp" : "albums-outline";
          else if (route.name === "Schedule") name_icon = focused ? "calendar" : "calendar-outline";
          else if (route.name === "Members") name_icon = focused ? "people" : "people-outline";
          else if (route.name === "Profile") name_icon = focused ? "person-circle-sharp" : "person-outline";
          return (
            <AnimatIcon
              name_icon={name_icon}
              focused={focused}
              color={color}
              size={size}
            />
          );
        },
        tabBarActiveTintColor: "#0D7F8D",
        tabBarInactiveTintColor: "#71949A",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
          marginBottom: 5,
        },
        tabBarStyle: {
          marginHorizontal: 13,
          marginBottom: 25,
          height: 70,
          borderRadius: 40,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          paddingTop: 5,
          paddingBottom: 5,
        },
      })}
    >
      <Tab.Screen name="Home" component={Homepage} options={{ tabBarLabel: "Trang chủ" }} />
      <Tab.Screen name="Feed" component={TrainerFeed} options={{ tabBarLabel: "Bảng tin" }} />
      <Tab.Screen name="Schedule" component={Schedule} options={{ tabBarLabel: "Lịch dạy" }} />
      <Tab.Screen name="Members" component={Members} options={{ tabBarLabel: "Học viên" }} />
      <Tab.Screen name="Profile" component={Profile} options={{ tabBarLabel: "Hồ sơ" }} />
    </Tab.Navigator>
  );
}

const SoTayStackNav = createNativeStackNavigator();

function SoTayStack() {
  return (
    <SoTayStackNav.Navigator screenOptions={{ headerShown: false }}>
      <SoTayStackNav.Screen name="SoTayHome" component={SoTayHomeScreen} />
      
      {/* Exercises */}
      <SoTayStackNav.Screen name="ExerciseCategories" component={ExerciseCategoriesScreen} />
      <SoTayStackNav.Screen name="ExerciseList" component={ExerciseListScreen} />
      <SoTayStackNav.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />

      {/* Nutrition */}
      <SoTayStackNav.Screen name="NutritionCategories" component={NutritionCategoriesScreen} />
      <SoTayStackNav.Screen name="NutritionProductList" component={NutritionProductListScreen} />
      <SoTayStackNav.Screen name="NutritionDetail" component={NutritionDetailScreen} />

      {/* Food */}
      <SoTayStackNav.Screen name="FoodCategories" component={FoodCategoriesScreen} />
      <SoTayStackNav.Screen name="FoodList" component={FoodListScreen} />
      <SoTayStackNav.Screen name="FoodDetail" component={FoodDetailScreen} />

      {/* Encyclopedia */}
      <SoTayStackNav.Screen name="EncyclopediaList" component={EncyclopediaListScreen} />
      <SoTayStackNav.Screen name="EncyclopediaDetail" component={EncyclopediaDetailScreen} />
    </SoTayStackNav.Navigator>
  );
}


function MemberTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let name_icon = "";
        if (route.name === "Kế Hoạch Tập") name_icon = focused ? "barbell-sharp" : "barbell";
        else if (route.name === "Feed") name_icon = focused ? "albums-sharp" : "albums-outline";
        else if (route.name === "Chatroom") name_icon = focused ? "chatbubbles" : "chatbubbles-outline";
        else if (route.name === "Sổ Tay") name_icon = focused ? "book-sharp" : "book-outline";
        else if (route.name === "Thêm") name_icon = focused ? "ellipsis-horizontal-circle-sharp" : "ellipsis-horizontal-outline";
        // else if (route.name === "Profile") name_icon = focused ? "person-circle-sharp" : "person-outline";
        return (
          <AnimatIcon
            name_icon={name_icon}
            focused={focused}
            color={color}
            size={size}
          />
        );
      },
      tabBarActiveTintColor: "#0D7F8D",
      tabBarInactiveTintColor: "#71949A",
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 5,
      },
      tabBarStyle: {
        marginHorizontal: 13,
        marginBottom: 25,
        height: 70,
        borderRadius: 40,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 0,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 3,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        paddingTop: 5,
        paddingBottom: 5,
      },
    })}>
      <Tab.Screen name="Kế Hoạch Tập" component={MemberWorkoutNavigator} />
      <Tab.Screen name="Feed" component={SportFeed} />
      <Tab.Screen name="Chatroom" component={ChatList} options={{ tabBarLabel: "Đoạn chat" }} />
      <Tab.Screen name="Sổ Tay" component={SoTayStack} />
      <Tab.Screen name="Thêm" component={MemberProfile} />
    </Tab.Navigator>
  );
}


const App = () => {
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  useEffect(() => {
    const sub = (payload: any) => {
      const { type, message } = payload;
      if (type === "auth") {
        Alert.alert("Authentication Error", message);
        navigationRef.navigate("Login" as never);
      }
    }
    notificationEmitter.on("thong_bao", sub);

    return () => {
      notificationEmitter.off("thong_bao", sub);
    };
  }, []);
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (pendingRoute) {
          navigationRef.navigate(pendingRoute as never);
          setPendingRoute(null);
        }
      }}
    >
      <Stack.Navigator
        initialRouteName="Onloading"        // code trang nào thì lấy chỗ name ở dưới thay vào login thì nó sẽ hiện trang đó 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="AiConsultationScreen" component={AiConsultationScreen} />
        <Stack.Screen name="Onloading" component={Onloading}/>
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ contentStyle: { backgroundColor: "#F4FAFB" } }} />
        <Stack.Screen name="MemberTabs" component={MemberTabs} options={{ contentStyle: { backgroundColor: "#F4FAFB" } }} />
        <Stack.Screen name="MemberHome" component={MemberHome} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="AuthScreen" component={AuthScreen} />
        {/* cua member */}
        <Stack.Screen name="PhongTap" component={PhongTap} />
        <Stack.Screen name="headerPage" component={headerPage} />
        <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
        <Stack.Screen name="DietScreen" component={DietScreen} />
        <Stack.Screen name="DietDetail" component={DietDetail} /> 
        <Stack.Screen name="ExercisePage" component={ExercisePage} />
        <Stack.Screen name="ReportPage" component={ReportPage} />
        <Stack.Screen name="WorkoutExercisePlan" component={WorkoutExercisePlan} />
        <Stack.Screen name="ResultPage" component={ResultPage}/>
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen}/>

        <Stack.Screen name="WorkoutPlanScreen" component={WorkoutPlanScreen} />
        <Stack.Screen name="WorkoutUnPlan" component={WorkoutUnPlan} />
        <Stack.Screen name="WorkoutPlan" component={WorkoutPlan} /> 
        <Stack.Screen name="WorkoutLocationScreen" component={WorkoutLocationScreen} />
        <Stack.Screen name="WorkoutDifficultyScreen" component={WorkoutDifficultyScreen} />
        <Stack.Screen name="WorkoutProgramDetailScreen" component={WorkoutProgramDetailScreen} />
        <Stack.Screen name="WorkoutSelectionScreen" component={WorkoutSelectionScreen} />
        <Stack.Screen name="WorkoutSelection" component={WorkoutSelectionScreen} />
        <Stack.Screen name="PTListScreen" component={PTListScreen} />
        <Stack.Screen name="PTList" component={PTListScreen} />
        <Stack.Screen name="RegistrationReviewScreen" component={RegistrationReviewScreen} />
        <Stack.Screen name="RegistrationReview" component={RegistrationReviewScreen} />
        <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="RegistrationSuccessScreen" component={RegistrationSuccessScreen} />
        <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />
        <Stack.Screen name="MyPackagesScreen" component={MyPackagesScreen} />
        <Stack.Screen name="MyPackages" component={MyPackagesScreen} />
        <Stack.Screen name="MyPackageDetailScreen" component={MyPackageDetailScreen} />
        <Stack.Screen name="MyPackageDetail" component={MyPackageDetailScreen} />


        {/* // gioi thieu */}
       <Stack.Screen name="OnboardingScreen" component={OnboardingScreen}/>
       <Stack.Screen name="OnboardingScreen1" component={OnboardingScreen1}/>
       <Stack.Screen name="OnboardingScreen2" component={OnboardingScreen2}/>
       <Stack.Screen name="OnboardingScreen3" component={OnboardingScreen3}/>
       



        {/* cua trainner  */}
        <Stack.Screen name="TrainerAuthScreen" component={TrainerAuthScreen} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="TrainerFeed" component={TrainerFeed} />
        <Stack.Screen name="Income" component={Income} />
        <Stack.Screen name="MemberDetail" component={MemberDetail} />
        <Stack.Screen name="Members" component={Members} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Schedule" component={Schedule} />
        <Stack.Screen name="SessionHistory" component={SessionHistory} />
        <Stack.Screen name="SessionReview" component={SessionReview} />
        <Stack.Screen name="MemberProfile" component={MemberProfile} />


        {/* cua chat */}
        <Stack.Screen name="ChatList" component={ChatList} />
        <Stack.Screen name="ChatRoom" component={ChatRoom} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
export default App;
