import { StyleSheet, Text } from "react-native";

const Members = ({ navigation }: any) => {
    return (
        <Text style={styles.container}> hello Members</Text>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})

export default Members;