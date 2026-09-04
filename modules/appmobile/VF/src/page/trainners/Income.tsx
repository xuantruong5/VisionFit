import { StyleSheet, Text } from "react-native";

const Income = ({ navigation }: any) => {
    return (
        <Text style={styles.container}> hello Income</Text>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})

export default Income;