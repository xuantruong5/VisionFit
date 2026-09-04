import { StyleSheet, Text } from "react-native";

const SessionHistory = ({ navigation }: any) => {
    return (
        <Text style={styles.container}> hello SessionHistory</Text>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})

export default SessionHistory;