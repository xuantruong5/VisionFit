import { StyleSheet, Text } from "react-native";

const Dashboard = ({ navigation }: any) => {
    return (
        <Text style={styles.container}> hello Dashboard</Text>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})

export default Dashboard;