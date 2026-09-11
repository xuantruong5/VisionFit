import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { Alert, Animated, View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import Ionicons from "react-native-vector-icons/Ionicons";
import { notificationEmitter } from "./src/general/notification";
import MemberHome from "./src/page/member/MemberHome";
import Homepage from "./src/page/trainners/HomePage";
import AuthScreen from "./src/page/member/AuthScreen";
import Login from "./src/page/login";
import GenderSelection from "./src/page/member/GenderSelection";
import BodyMetrics from "./src/page/member/BodyMetrics";
import TrainerAuthScreen from "./src/page/trainners/TrainerAuthScreen";
import Dashboard from "./src/page/trainners/Dashboard";
import Income from "./src/page/trainners/Income";
import MemberDetail from "./src/page/trainners/MemberDetail";
import Profile from "./src/page/trainners/Profile";
import Schedule from "./src/page/trainners/Schedule";
import SessionHistory from "./src/page/trainners/SessionHistory";
import SessionReview from "./src/page/trainners/SessionReview";
import Members from "./src/page/trainners/Members";
import SportFeed from "./src/page/member/SportFeed";



const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef();


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
          // if (route.name === "Home") name_icon = focused ? "home" : "home-outline";
          // else if (route.name === "Login") name_icon = focused ? "heart-sharp" : "heart-outline";
          // else if (route.name === "ScanQR") name_icon = focused ? "scan-circle" : "scan";
          // else if (route.name === "ChatBot") name_icon = focused ? "chatbubbles" : "chatbubbles-outline";
          // else if (route.name === "Profile") name_icon = focused ? "person-circle-sharp" : "people-outline";
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
          fontWeight: "bold"
        }
      })}
    >
      <Tab.Screen name="Home" component={Homepage} />
      {/* <Tab.Screen name="login" component={StoreScheduleMember} /> */}
      {/* <Tab.Screen name="ScanQR" component={ScanQR} />
      <Tab.Screen name="ChatBot" component={ChatBot} /> */}
      {/* <Tab.Screen name="Profile" component={Profile} /> */}

    </Tab.Navigator>

  );
}


function MemberTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let name_icon = "";
        if (route.name === "Home") name_icon = focused ? "home" : "home-outline";
        else if (route.name === "Feed") name_icon = focused ? "people-sharp" : "people-outline";
        // else if (route.name === "Trainer") name_icon = focused ? "people-sharp" : "people-outline";
        // else if (route.name === "Calendar") name_icon = focused ? "calendar" : "calendar-outline";
        // else if (route.name === "ChatBot") name_icon = focused ? "chatbubbles" : "chatbubbles-outline";
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
        fontWeight: "bold"
      }
    })}>
      <Tab.Screen name="Home" component={MemberHome} />
      <Tab.Screen name="Feed" component={SportFeed} />
      {/* <Tab.Screen name="Trainer" component={CurrentTrainer} />
      <Tab.Screen name="Calendar" component={MemberSchedule} />
      <Tab.Screen name="Profile" component={MemberProfile} /> */}
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
        initialRouteName="MemberTabs"        // code trang nào thì lấy chỗ name ở dưới thay vào login thì nó sẽ hiện trang đó 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="MemberTabs" component={MemberTabs} />
        <Stack.Screen name="MemberHome" component={MemberHome} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="AuthScreen" component={AuthScreen}/>
        {/* cua member */}
        <Stack.Screen name="GenderSelection" component={GenderSelection} />
        <Stack.Screen name="BodyMetrics" component={BodyMetrics} />

        <Stack.Screen name="AuthScreen" component={AuthScreen} />


        {/* cua trainner  */}
        <Stack.Screen name="TrainerAuthScreen" component={TrainerAuthScreen} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Income" component={Income} />
        <Stack.Screen name="MemberDetail" component={MemberDetail} />
        <Stack.Screen name="Members" component={Members} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Schedule" component={Schedule} />
        <Stack.Screen name="SessionHistory" component={SessionHistory} />
        <Stack.Screen name="SessionReview" component={SessionReview} />
      </Stack.Navigator>

    </NavigationContainer>
  )
}





export default App;
