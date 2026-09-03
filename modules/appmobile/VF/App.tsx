import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { Alert, Animated } from "react-native";
import React, { useEffect, useState } from "react";
import Ionicons from "react-native-vector-icons/Ionicons";
import { notificationEmitter } from "./src/general/notification";
import MemberHome from "./src/page/member/MemberHome";
import Homepage from "./src/page/trainners/HomePage";



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
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "gray",
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
      tabBarActiveTintColor: "black",
      tabBarInactiveTintColor: "gray",
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: "bold"
      }
    })}>
      <Tab.Screen name= "Home" component={MemberHome} />
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
        initialRouteName="MemberHome"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="MemberTabs" component={MemberTabs} />
        <Stack.Screen name="MemberHome" component={MemberHome} />
        
        

      </Stack.Navigator>

    </NavigationContainer>
  )
}





export default App;
