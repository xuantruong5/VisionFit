import { StyleSheet, Text } from "react-native";

const MemberDetail = ({ navigation }: any) => {
    return (
        <Text style={styles.container}> hello MemberDetail</Text>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})

export default MemberDetail;