// import React from "react";

// import {
//     StyleSheet,
//     Text,
//     View,
//     ImageBackground,
//     TouchableOpacity,
//     StatusBar,
// } from "react-native";

// import Ionicons from "react-native-vector-icons/Ionicons";
// import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

// import {
//     widthPercentageToDP as wp,
//     heightPercentageToDP as hp,
// } from "react-native-responsive-screen";


// type NotebookItem = {
//     id: number;
//     title: string;
//     image: any;
//     screen?: string;
// };


// const notebookItems: NotebookItem[] = [
//     {
//         id: 1,
//         title: "Các bài tập",
//         image: require("../assets/notebook-exercise.png"),
//         screen: "WorkoutPage",
//     },

//     {
//         id: 2,
//         title: "Dinh dưỡng thể thao",
//         image: require("../assets/sport-nutrition.png"),
//         screen: "SportNutrition",
//     },

//     {
//         id: 3,
//         title: "Danh sách các nguyên liệu\nvà lượng calo",
//         image: require("../assets/calories-food.png"),
//         screen: "CaloriesFood",
//     },

//     {
//         id: 4,
//         title: "Bách khoa toàn thư",
//         image: require("../assets/encyclopedia.png"),
//         screen: "Encyclopedia",
//     },
// ];


// const Notebook = ({ navigation }: any) => {

//     const handleOpenItem = (item: NotebookItem) => {

//         if (item.screen) {
//             navigation.navigate(item.screen);
//         }

//     };


//     return (

//         <View style={styles.container}>

//             <StatusBar
//              //   backgroundColor="#FFFFFF"
//                 barStyle="dark-content"
//             />


//             {/* ================= HEADER ================= */}

//             <View style={styles.header}>

//                 <Text style={styles.headerTitle}>
//                     Sổ tay
//                 </Text>

//             </View>


//             {/* ================= CONTENT ================= */}

//             <View style={styles.content}>

//                 {notebookItems.map((item) => (

//                     <TouchableOpacity
//                         key={item.id}
//                         style={styles.card}
//                         activeOpacity={0.85}
//                         onPress={() => handleOpenItem(item)}
//                     >

//                         <ImageBackground
//                             source={item.image}
//                             style={styles.cardImage}
//                             imageStyle={styles.cardImageStyle}
//                             resizeMode="cover"
//                         >

//                             {/* overlay tối */}
//                             <View style={styles.cardOverlay} />

//                             <Text style={styles.cardTitle}>
//                                 {item.title}
//                             </Text>

//                         </ImageBackground>

//                     </TouchableOpacity>

//                 ))}

//             </View>


//             {/* ================= BOTTOM NAV ================= */}

//             <View style={styles.bottomNavWrapper}>

//                 <View style={styles.bottomNavigation}>


//                     {/* KẾ HOẠCH TẬP */}

//                     <TouchableOpacity
//                         style={styles.navItem}
//                         onPress={() =>
//                             navigation.navigate("WorkoutPage")
//                         }
//                     >

//                         <MaterialCommunityIcons
//                             name="tune-variant"
//                             size={wp("6.5%")}
//                             color="#4D5A5E"
//                         />

//                         <Text style={styles.navText}>
//                             Kế hoạch tập
//                         </Text>

//                     </TouchableOpacity>


//                     {/* FEED */}

//                     <TouchableOpacity
//                         style={styles.navItem}
//                         onPress={() =>
//                             navigation.navigate("Feed")
//                         }
//                     >

//                         <MaterialCommunityIcons
//                             name="archive-outline"
//                             size={wp("6.2%")}
//                             color="#4D5A5E"
//                         />

//                         <Text style={styles.navText}>
//                             Feed
//                         </Text>

//                     </TouchableOpacity>


//                     {/* TIN NHẮN */}

//                     <TouchableOpacity
//                         style={styles.navItem}
//                         onPress={() =>
//                             navigation.navigate("Messages")
//                         }
//                     >

//                         <Ionicons
//                             name="chatbubble-ellipses-outline"
//                             size={wp("6%")}
//                             color="#4D5A5E"
//                         />

//                         <Text style={styles.navText}>
//                             Tin nhắn
//                         </Text>

//                     </TouchableOpacity>


//                     {/* SỔ TAY - ACTIVE */}

//                     <TouchableOpacity
//                         style={styles.navItem}
//                     >

//                         <View style={styles.activeIconWrapper}>

//                             <Ionicons
//                                 name="book-outline"
//                                 size={wp("6.5%")}
//                                 color="#10BFC1"
//                             />

//                         </View>

//                         <Text
//                             style={[
//                                 styles.navText,
//                                 styles.activeNavText,
//                             ]}
//                         >
//                             Sổ tay
//                         </Text>

//                     </TouchableOpacity>


//                     {/* THÊM */}

//                     <TouchableOpacity
//                         style={styles.navItem}
//                         onPress={() =>
//                             navigation.navigate("More")
//                         }
//                     >

//                         <View style={styles.moreIconContainer}>

//                             <Ionicons
//                                 name="ellipsis-horizontal"
//                                 size={wp("6.5%")}
//                                 color="#4D5A5E"
//                             />

//                             <View style={styles.notificationBadge}>

//                                 <Text style={styles.badgeText}>
//                                     1
//                                 </Text>

//                             </View>

//                         </View>

//                         <Text style={styles.navText}>
//                             Thêm
//                         </Text>

//                     </TouchableOpacity>


//                 </View>

//             </View>


//         </View>

//     );

// };


// const styles = StyleSheet.create({

//     /* ================= CONTAINER ================= */

//     container: {
//         flex: 1,
//         backgroundColor: "#FFFFFF",
//     },


//     /* ================= HEADER ================= */

//     header: {
//         height: hp("7%"),
//         justifyContent: "center",
//         alignItems: "center",
//         backgroundColor: "#FFFFFF",
//     },

//     headerTitle: {
//         color: "#252525",
//         fontSize: wp("5%"),
//         fontWeight: "700",
//     },


//     /* ================= CONTENT ================= */

//     content: {
//         flex: 1,
//         paddingHorizontal: wp("3%"),
//         paddingTop: hp("1%"),
//         paddingBottom: hp("10%"),
//     },


//     /* ================= CARD ================= */

//     card: {
//         width: "100%",
//         height: hp("18.2%"),
//         marginBottom: hp("1.3%"),
//         borderRadius: wp("3%"),
//         overflow: "hidden",

//         backgroundColor: "#DDDDDD",

//         elevation: 2,

//         shadowColor: "#000",
//         shadowOffset: {
//             width: 0,
//             height: 1,
//         },
//         shadowOpacity: 0.15,
//         shadowRadius: 2,
//     },

//     cardImage: {
//         flex: 1,
//         justifyContent: "center",
//     },

//     cardImageStyle: {
//         borderRadius: wp("3%"),
//     },

//     cardOverlay: {
//        // ...StyleSheet.absoluteFillObject,
//         backgroundColor: "rgba(5, 25, 35, 0.34)",
//         borderRadius: wp("3%"),
//     },

//     cardTitle: {
//         color: "#FFFFFF",
//         fontSize: wp("5%"),
//         fontWeight: "700",
//         marginLeft: wp("6%"),
//         lineHeight: wp("6.5%"),

//         textShadowColor: "rgba(0, 0, 0, 0.45)",
//         textShadowOffset: {
//             width: 0,
//             height: 1,
//         },
//         textShadowRadius: 2,
//     },


//     /* ================= BOTTOM NAV WRAPPER ================= */

//     bottomNavWrapper: {
//         position: "absolute",

//         left: wp("5%"),
//         right: wp("5%"),
//         bottom: hp("2%"),

//         borderRadius: wp("8%"),

//         backgroundColor: "rgba(248,248,248,0.92)",

//         elevation: 8,

//         shadowColor: "#000",

//         shadowOffset: {
//             width: 0,
//             height: 3,
//         },

//         shadowOpacity: 0.20,

//         shadowRadius: 6,
//     },


//     /* ================= BOTTOM NAV ================= */

//     bottomNavigation: {
//         height: hp("7.5%"),

//         flexDirection: "row",

//         alignItems: "center",

//         justifyContent: "space-around",

//         borderRadius: wp("8%"),

//         backgroundColor: "rgba(248,248,248,0.95)",

//         paddingHorizontal: wp("2%"),
//     },


//     navItem: {
//         flex: 1,
//         height: "100%",

//         justifyContent: "center",

//         alignItems: "center",
//     },


//     navText: {
//         marginTop: hp("0.1%"),

//         fontSize: wp("2.5%"),

//         color: "#4E5A5E",

//         fontWeight: "500",
//     },


//     activeNavText: {
//         color: "#15BFC1",
//         fontWeight: "700",
//     },


//     activeIconWrapper: {
//         paddingHorizontal: wp("4%"),
//         paddingVertical: hp("0.3%"),

//         borderRadius: wp("5%"),

//         backgroundColor: "rgba(226, 240, 190, 0.75)",
//     },


//     /* ================= MORE BADGE ================= */

//     moreIconContainer: {
//         position: "relative",
//     },

//     notificationBadge: {
//         position: "absolute",

//         top: -hp("0.8%"),

//         right: -wp("3%"),

//         width: wp("5.2%"),
//         height: wp("5.2%"),

//         borderRadius: wp("2.6%"),

//         justifyContent: "center",

//         alignItems: "center",

//         backgroundColor: "#FF6471",

//         borderWidth: 1.5,

//         borderColor: "#FFFFFF",
//     },

//     badgeText: {
//         color: "#FFFFFF",

//         fontSize: wp("2.3%"),

//         fontWeight: "700",
//     },

// });


// export default Notebook;