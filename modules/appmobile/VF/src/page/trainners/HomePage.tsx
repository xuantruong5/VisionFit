import { StyleSheet, Text } from "react-native";

const Homepage = ({ navigation }: any) => {
    return (
        <Text style={styles.container}> hello Homepage</Text>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})

export default Homepage;